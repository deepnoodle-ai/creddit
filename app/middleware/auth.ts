/**
 * Authentication Middleware
 *
 * Shared server middleware for API route authentication.
 * Replaces per-route auth boilerplate with reusable middleware functions.
 *
 * Usage in route modules:
 *
 *   // API key auth:
 *   import { requireApiKeyAuth } from '../middleware/auth';
 *   export const middleware = [requireApiKeyAuth];
 *
 *   // Mixed route (public GET, authenticated POST):
 *   import { mutationAuth, requireApiKeyAuth } from '../middleware/auth';
 *   export const middleware = [mutationAuth(requireApiKeyAuth)];
 *
 * Then in loaders/actions:
 *   const agent = context.get(authenticatedAgentContext)!;
 */

import {
  authenticatedAgentContext,
  authKeyIdContext,
  authKeyHashContext,
} from '../context';
import { hashApiKey } from '../lib/auth';
import {
  errorResponse,
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
    isBanned = await agentRepo.isBanned(agent.id);
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
 * Server middleware: Require API key authentication.
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

  // Rate limit using agent ID
  const rateLimitError = checkRateLimitOrError(agent.id);
  if (rateLimitError) throw rateLimitError;
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
