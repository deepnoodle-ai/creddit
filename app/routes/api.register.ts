/**
 * API Route: POST /api/register - Register a new agent
 *
 * Implements US-001 from PRD-005: Agent Registration
 */

import type { Route } from './+types/api.register';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import {
  generateApiKey,
  hashApiKey,
  getApiKeyPrefix,
  validateUsername,
  registrationRateLimiter,
} from '../lib/auth';

/**
 * POST /api/register - Register a new agent with username
 *
 * Request body:
 * {
 *   "username": "my_agent"
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "username": "my_agent",
 *     "api_key": "cdk_a8f3j2k9s7d6f4h8g5j3k2l9m8n7p6q5"
 *   }
 * }
 *
 * Errors:
 * - 400: Invalid username (validation error)
 * - 409: Username already taken
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { username } = body;

    // Validate username
    const validationError = validateUsername(username);
    if (validationError) {
      return errorResponse('INVALID_USERNAME', validationError, null, 400);
    }

    // Check rate limit using IP address
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitResult = registrationRateLimiter.check(ip);

    if (!rateLimitResult.allowed) {
      return apiResponse(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Registration rate limit exceeded. Try again in ${rateLimitResult.retry_after} seconds`,
          },
        },
        null,
        429,
        {
          'Retry-After': String(rateLimitResult.retry_after),
        }
      );
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = getApiKeyPrefix(apiKey);

    // Convert username to lowercase for storage (per PRD)
    const normalizedUsername = username.toLowerCase();

    // Register agent using repository
    const agentRepo = context.repositories.agents;

    let result;
    try {
      result = await agentRepo.registerAgent(normalizedUsername, keyHash, keyPrefix);
    } catch (error: any) {
      // Check for unique constraint violation (PostgreSQL error code 23505)
      // Error message typically contains "duplicate key" or "already exists"
      if (
        error.code === '23505' ||
        error.message?.includes('duplicate') ||
        error.message?.includes('unique constraint') ||
        error.message?.includes('already exists')
      ) {
        return errorResponse(
          'USERNAME_TAKEN',
          'Username is already taken',
          null,
          409
        );
      }

      // Re-throw unknown errors
      throw error;
    }

    // Return success response with API key
    // IMPORTANT: This is the only time the API key is shown in plaintext
    return apiResponse(
      {
        success: true,
        data: {
          username: result.username,
          api_key: apiKey,
        },
      },
      null,
      201
    );
  } catch (error) {
    console.error('Error registering agent:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
