/**
 * Rate Limiting Utilities
 *
 * Implements per-agent rate limiting using in-memory storage (for MVP).
 * For production, this should use Cloudflare Workers KV or Durable Objects.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp in seconds
}

// In-memory store (resets on worker restart - OK for MVP)
// For production: use Workers KV or Durable Objects
const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_LIMIT = 100; // requests per hour
const WINDOW_SIZE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Rate limit configuration per agent
 */
export interface RateLimitConfig {
  limit: number; // Max requests per window
  windowMs: number; // Window size in milliseconds
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in seconds
}

/**
 * Clean up expired entries (simple garbage collection)
 */
function cleanupExpiredEntries() {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for an agent
 *
 * @param agentToken - Agent identifier
 * @param config - Rate limit configuration (optional, uses defaults)
 * @returns Rate limit result
 */
export function checkRateLimit(
  agentToken: string,
  config?: Partial<RateLimitConfig>
): RateLimitResult {
  const limit = config?.limit || DEFAULT_LIMIT;
  const windowMs = config?.windowMs || WINDOW_SIZE_MS;

  const now = Date.now();
  const nowSeconds = Math.floor(now / 1000);
  const key = `rate_limit:${agentToken}`;

  // Clean up expired entries occasionally (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  // Get or create entry
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < nowSeconds) {
    // Create new window
    entry = {
      count: 0,
      resetAt: Math.floor((now + windowMs) / 1000),
    };
    rateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  const allowed = entry.count < limit;

  // Increment count if allowed
  if (allowed) {
    entry.count++;
  }

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Get rate limit headers for API response
 *
 * @param result - Rate limit check result
 * @returns Headers object
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
}

/**
 * Get CORS headers for API responses
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Community creation rate limiter
 * 5 communities per agent per 24-hour rolling window
 */
const communityCreationStore = new Map<string, { count: number; resetAt: number }>();
const COMMUNITY_CREATION_LIMIT = 5;
const COMMUNITY_CREATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean up expired entries from communityCreationStore (simple garbage collection)
 */
function cleanupExpiredCommunityEntries() {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of communityCreationStore.entries()) {
    if (entry.resetAt < now) {
      communityCreationStore.delete(key);
    }
  }
}

export function checkCommunityCreationRateLimit(agentToken: string): RateLimitResult {
  const now = Date.now();
  const nowSeconds = Math.floor(now / 1000);
  const key = `community_create:${agentToken}`;

  // Clean up expired entries occasionally (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredCommunityEntries();
  }

  let entry = communityCreationStore.get(key);

  if (!entry || entry.resetAt < nowSeconds) {
    entry = {
      count: 0,
      resetAt: Math.floor((now + COMMUNITY_CREATION_WINDOW_MS) / 1000),
    };
    communityCreationStore.set(key, entry);
  }

  const allowed = entry.count < COMMUNITY_CREATION_LIMIT;

  if (allowed) {
    entry.count++;
  }

  return {
    allowed,
    limit: COMMUNITY_CREATION_LIMIT,
    remaining: Math.max(0, COMMUNITY_CREATION_LIMIT - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Get upgraded rate limit for agent (check if they have active rate limit boost reward)
 * For MVP, returns default. In production, query redemptions table.
 *
 * @param agentToken - Agent identifier
 * @param db - D1 database instance (optional)
 * @returns Rate limit config
 */
export async function getAgentRateLimit(
  agentToken: string,
  db?: D1Database
): Promise<RateLimitConfig> {
  // TODO: Check if agent has active rate_limit_boost redemption
  // For now, return default
  return {
    limit: DEFAULT_LIMIT,
    windowMs: WINDOW_SIZE_MS,
  };
}
