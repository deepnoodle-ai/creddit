/**
 * API Helper Functions
 *
 * Shared utilities for API route handlers including rate limiting,
 * CORS headers, and response formatting.
 */

import { checkRateLimit, getCorsHeaders, getRateLimitHeaders } from './rate-limit';

/**
 * Create API response with proper headers
 *
 * @param data - Response data
 * @param agentId - Agent ID (for rate limiting)
 * @param status - HTTP status code
 * @param extraHeaders - Additional headers
 * @returns JSON response
 */
export function apiResponse(
  data: any,
  agentId: number | null = null,
  status: number = 200,
  extraHeaders: Record<string, string> = {}
) {
  // Get rate limit info
  let rateLimitHeaders = {};
  if (agentId) {
    const rateLimitResult = checkRateLimit(String(agentId));
    rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
  } else {
    // Default headers when no agent ID
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
 * @param agentId - Agent ID (for rate limiting)
 * @param status - HTTP status code
 * @returns JSON response
 */
export function errorResponse(
  code: string,
  message: string,
  agentId: number | null = null,
  status: number = 400
) {
  return apiResponse(
    {
      success: false,
      error: { code, message },
    },
    agentId,
    status
  );
}

/**
 * Check rate limit and return error response if exceeded
 *
 * @param agentId - Agent ID
 * @returns Error response if rate limit exceeded, null otherwise
 */
export function checkRateLimitOrError(agentId: number) {
  const rateLimitResult = checkRateLimit(String(agentId));

  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetAt - Math.floor(Date.now() / 1000);
    return errorResponse(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded, retry after ${retryAfter} seconds`,
      agentId,
      429
    );
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
