/**
 * API Helper Functions
 *
 * Shared utilities for API route handlers including rate limiting,
 * CORS headers, and response formatting.
 */

import { checkRateLimit, getCorsHeaders, getRateLimitHeaders } from './rate-limit';

/**
 * Extract agent token from request body
 *
 * @param body - Parsed request body
 * @returns Agent token or null
 */
export function extractAgentToken(body: any): string | null {
  if (body && typeof body.agent_token === 'string' && body.agent_token.length > 0) {
    return body.agent_token;
  }
  return null;
}

/**
 * Create API response with proper headers
 *
 * @param data - Response data
 * @param agentToken - Agent token (for rate limiting)
 * @param status - HTTP status code
 * @param extraHeaders - Additional headers
 * @returns JSON response
 */
export function apiResponse(
  data: any,
  agentToken: string | null = null,
  status: number = 200,
  extraHeaders: Record<string, string> = {}
) {
  // Get rate limit info
  let rateLimitHeaders = {};
  if (agentToken) {
    const rateLimitResult = checkRateLimit(agentToken);
    rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
  } else {
    // Default headers when no agent token
    rateLimitHeaders = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
    };
  }

  return Response.json(data, {
    status,
    headers: {
      ...getCorsHeaders(),
      ...rateLimitHeaders,
      ...extraHeaders,
    },
  });
}

/**
 * Create error response with proper headers
 *
 * @param code - Error code (SCREAMING_SNAKE_CASE)
 * @param message - Human-readable error message
 * @param agentToken - Agent token (for rate limiting)
 * @param status - HTTP status code
 * @returns JSON response
 */
export function errorResponse(
  code: string,
  message: string,
  agentToken: string | null = null,
  status: number = 400
) {
  return apiResponse(
    {
      success: false,
      error: { code, message },
    },
    agentToken,
    status
  );
}

/**
 * Check rate limit and return error response if exceeded
 *
 * @param agentToken - Agent token
 * @returns Error response if rate limit exceeded, null otherwise
 */
export function checkRateLimitOrError(agentToken: string) {
  const rateLimitResult = checkRateLimit(agentToken);

  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetAt - Math.floor(Date.now() / 1000);
    return errorResponse(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded, retry after ${retryAfter} seconds`,
      agentToken,
      429
    );
  }

  return null;
}

/**
 * Validate agent token
 *
 * @param agentToken - Agent token to validate
 * @returns Error response if invalid, null otherwise
 */
export function validateAgentToken(agentToken: any): ReturnType<typeof errorResponse> | null {
  if (!agentToken || typeof agentToken !== 'string') {
    return errorResponse('INVALID_AGENT_TOKEN', 'Agent token must be a non-empty string');
  }

  if (agentToken.length < 1 || agentToken.length > 256) {
    return errorResponse('INVALID_AGENT_TOKEN', 'Agent token must be 1-256 characters');
  }

  return null;
}

/**
 * Handle OPTIONS preflight requests for CORS
 */
export function handleOptionsRequest() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}
