/**
 * Authentication Middleware
 *
 * Shared server middleware for API route authentication.
 * Replaces per-route auth boilerplate with reusable middleware functions.
 *
 * Usage in route modules:
 *
 *   // API key only (new auth):
 *   import { requireApiKeyAuth } from '../middleware/auth';
 *   export const middleware = [requireApiKeyAuth];
 *
 *   // Dual auth (new + legacy) with deprecation headers:
 *   import { requireDualAuth, addDeprecationHeaders } from '../middleware/auth';
 *   export const middleware = [requireDualAuth, addDeprecationHeaders];
 *
 *   // Mixed route (public GET, authenticated POST):
 *   import { mutationAuth, requireDualAuth, addDeprecationHeaders } from '../middleware/auth';
 *   export const middleware = [mutationAuth(requireDualAuth), addDeprecationHeaders];
 *
 * Then in loaders/actions:
 *   const agent = context.get(authenticatedAgentContext)!;
 */

import {
  authenticatedAgentContext,
  authKeyIdContext,
  authKeyHashContext,
  isDeprecatedAuthContext,
  parsedBodyContext,
} from '../context';
import { hashApiKey } from '../lib/auth';
import {
  errorResponse,
  extractAgentToken,
  validateAgentToken,
  checkRateLimitOrError,
} from '../lib/api-helpers';
import type { IAgentRepository } from '../../db/repositories';
import type { Agent } from '../../db/schema';

type MiddlewareArgs = {
  request: Request;
  context: any;
};

type MiddlewareFn = (
  args: MiddlewareArgs,
  next: () => Promise<Response>
) => Promise<Response | void> | Response | void;

/**
 * Validate Bearer token from Authorization header.
 *
 * Extracts, hashes, and looks up the API key. Checks ban status.
 * Throws error responses on any failure.
 */
async function validateBearerToken(
  request: Request,
  agentRepo: IAgentRepository
): Promise<{ agent: Agent; keyId: number; keyHash: string }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    throw errorResponse('UNAUTHORIZED', 'Missing Authorization header', null, 401);
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw errorResponse(
      'UNAUTHORIZED',
      'Authorization header must use Bearer scheme',
      null,
      401
    );
  }

  const apiKey = authHeader.substring(7).trim();
  if (!apiKey) {
    throw errorResponse('UNAUTHORIZED', 'API key is required', null, 401);
  }

  if (!apiKey.startsWith('cdk_')) {
    throw errorResponse('UNAUTHORIZED', 'Invalid API key format', null, 401);
  }

  let keyHash: string;
  try {
    keyHash = await hashApiKey(apiKey);
  } catch (error) {
    console.error('Error hashing API key:', error);
    throw errorResponse('INTERNAL_SERVER_ERROR', 'Failed to process API key', null, 500);
  }

  let authData: { agent: Agent; keyId: number } | null;
  try {
    authData = await agentRepo.authenticateApiKey(keyHash);
  } catch (error) {
    console.error('Error authenticating API key:', error);
    throw errorResponse('INTERNAL_SERVER_ERROR', 'Failed to authenticate', null, 500);
  }

  if (!authData) {
    throw errorResponse('UNAUTHORIZED', 'Invalid or revoked API key', null, 401);
  }

  const { agent, keyId } = authData;

  let isBanned: boolean;
  try {
    isBanned = await agentRepo.isBanned(agent.token);
  } catch (error) {
    console.error('Error checking ban status:', error);
    throw errorResponse('INTERNAL_SERVER_ERROR', 'Failed to verify account status', null, 500);
  }

  if (isBanned) {
    throw errorResponse('FORBIDDEN', 'Account has been banned', null, 403);
  }

  return { agent, keyId, keyHash };
}

/**
 * Server middleware: Require API key authentication (new auth only).
 *
 * For routes that only accept Authorization: Bearer <api_key>.
 * Throws error responses on failure. Sets agent context on success.
 */
export async function requireApiKeyAuth({ request, context }: MiddlewareArgs) {
  const agentRepo = context.repositories.agents as IAgentRepository;
  const { agent, keyId, keyHash } = await validateBearerToken(request, agentRepo);

  context.set(authenticatedAgentContext, agent);
  context.set(authKeyIdContext, keyId);
  context.set(authKeyHashContext, keyHash);
  context.set(isDeprecatedAuthContext, false);

  // Rate limit using agent token
  const rateLimitError = checkRateLimitOrError(agent.token);
  if (rateLimitError) throw rateLimitError;
}

/**
 * Server middleware: Dual authentication (API key preferred, agent_token fallback).
 *
 * For routes that support both new and legacy auth during the deprecation period.
 * Tries Authorization header first, falls back to agent_token in request body.
 * Also applies rate limiting after authentication.
 */
export async function requireDualAuth({ request, context }: MiddlewareArgs) {
  const agentRepo = context.repositories.agents as IAgentRepository;
  const authHeader = request.headers.get('Authorization');

  if (authHeader) {
    // New auth: Authorization: Bearer <api_key>
    const { agent, keyId, keyHash } = await validateBearerToken(request, agentRepo);
    context.set(authenticatedAgentContext, agent);
    context.set(authKeyIdContext, keyId);
    context.set(authKeyHashContext, keyHash);
    context.set(isDeprecatedAuthContext, false);

    // Rate limit using agent token
    const rateLimitError = checkRateLimitOrError(agent.token);
    if (rateLimitError) throw rateLimitError;
  } else {
    // Legacy auth: agent_token in request body
    // Clone request so the action can still read the original body
    let body: any = null;
    try {
      body = await request.clone().json();
    } catch {
      // Body isn't valid JSON — will fail auth below
    }

    if (body) {
      context.set(parsedBodyContext, body);
    }

    const agentToken = body ? extractAgentToken(body) : null;
    if (!agentToken) {
      throw errorResponse(
        'MISSING_AUTH',
        'Missing Authorization header or agent_token',
        null,
        401
      );
    }

    const validationError = validateAgentToken(agentToken);
    if (validationError) throw validationError;

    const banned = await agentRepo.isBanned(agentToken);
    if (banned) {
      throw errorResponse('AGENT_BANNED', 'This agent has been banned', agentToken, 403);
    }

    const agent = await agentRepo.getOrCreate(agentToken);
    context.set(authenticatedAgentContext, agent);
    context.set(isDeprecatedAuthContext, true);

    // Rate limit using agent token
    const rateLimitError = checkRateLimitOrError(agentToken);
    if (rateLimitError) throw rateLimitError;
  }
}

/**
 * Server middleware: Add deprecation headers when legacy auth was used.
 *
 * Wraps the response to add Deprecation, Sunset, and Link headers.
 * Safe to use even when no auth was performed (no-ops when flag is false).
 */
export async function addDeprecationHeaders(
  { context }: MiddlewareArgs,
  next: () => Promise<Response>
) {
  const response = await next();

  if (context.get(isDeprecatedAuthContext)) {
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', '2026-03-15T00:00:00Z');
    response.headers.set('Link', '</api/register>; rel="successor-version"');
  }

  return response;
}

/**
 * Wrap an auth middleware so it only runs on mutation requests (POST, PUT, DELETE, PATCH).
 *
 * For routes with a public GET loader and an authenticated POST action.
 */
export function mutationAuth(authFn: MiddlewareFn): MiddlewareFn {
  return async (args, next) => {
    const method = args.request.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return; // Skip auth for read-only requests
    }
    return authFn(args, next);
  };
}

/** Deprecation warning message for response bodies */
export const DEPRECATION_WARNING =
  'agent_token authentication is deprecated. Register at /api/register and use Authorization: Bearer header. Support ends 2026-03-15.';
