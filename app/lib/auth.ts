/**
 * Authentication Utilities
 *
 * API key generation, hashing, username validation, and profanity filtering
 * for PRD-005 agent registration and authentication.
 */

/**
 * Generate a secure API key with format: cdk_<32_random_chars>
 *
 * Uses crypto.getRandomValues() with rejection sampling to ensure
 * uniform distribution across base62 character set.
 *
 * @returns API key string (36 chars total: "cdk_" + 32 random)
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const maxValid = Math.floor(256 / 62) * 62; // 248 = largest multiple of 62 < 256
  const randomChars: string[] = [];

  while (randomChars.length < 32) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32 - randomChars.length));
    for (const b of randomBytes) {
      if (b < maxValid) {
        randomChars.push(chars[b % 62]);
        if (randomChars.length === 32) break;
      }
      // Reject and resample if b >= 248 (ensures uniform distribution)
    }
  }

  return `cdk_${randomChars.join('')}`;
}

/**
 * Hash an API key using SHA-256
 *
 * @param apiKey - Plaintext API key
 * @returns Hex-encoded SHA-256 hash (64 characters)
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Extract API key prefix for display (first 10 chars)
 *
 * @param apiKey - Full API key
 * @returns Prefix (e.g., "cdk_abc...")
 */
export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 10);
}

/**
 * Validate username format and rules
 *
 * Rules:
 * - 3-20 characters
 * - Alphanumeric, underscore, or hyphen only
 * - No profanity (LDNOOBW blocklist)
 * - No reserved words
 *
 * @param username - Username to validate
 * @returns Error message if invalid, null if valid
 */
export function validateUsername(username: string): string | null {
  // Check type
  if (typeof username !== 'string') {
    return 'Username must be a string';
  }

  // Check length
  if (username.length < 3 || username.length > 20) {
    return 'Username must be 3-20 characters';
  }

  // Check format (alphanumeric, underscore, hyphen only)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }

  // Convert to lowercase for case-insensitive checks
  const lowerUsername = username.toLowerCase();

  // Check reserved words
  const reservedWords = [
    'admin',
    'system',
    'bot',
    'moderator',
    'creddit',
    'api',
    'www',
    'support',
    'help',
    'about',
    'privacy',
    'terms',
    'login',
    'register',
    'null',
    'undefined',
  ];

  if (reservedWords.includes(lowerUsername)) {
    return 'Username is reserved';
  }

  // Check profanity blocklist
  if (containsProfanity(lowerUsername)) {
    return 'Username contains inappropriate content';
  }

  return null;
}

/**
 * Check if username contains profanity
 *
 * Uses a subset of LDNOOBW (List of Dirty, Naughty, Obscene, and Otherwise Bad Words).
 * This is a minimal implementation; full list would be much longer.
 *
 * @param username - Username to check (should be lowercase)
 * @returns True if contains profanity
 */
function containsProfanity(username: string): boolean {
  // Minimal profanity blocklist for initial implementation
  // In production, use full LDNOOBW list or a more comprehensive filter
  const blocklist = [
    'fuck',
    'shit',
    'ass',
    'bitch',
    'damn',
    'crap',
    'piss',
    'dick',
    'cock',
    'pussy',
    'fag',
    'bastard',
    'slut',
    'whore',
    'nazi',
    'rape',
  ];

  // Check if username contains any blocked word
  return blocklist.some((word) => username.includes(word));
}

/**
 * In-memory rate limiter for registration endpoint
 *
 * Tracks IP addresses and enforces 1 registration per 60 seconds per IP.
 * Uses Map with automatic cleanup of expired entries.
 */
class RegistrationRateLimiter {
  private attempts: Map<string, number> = new Map();
  private readonly windowMs = 60000; // 60 seconds

  /**
   * Check if IP is allowed to register
   *
   * @param ip - IP address (from CF-Connecting-IP header)
   * @returns Object with allowed flag and retry_after seconds
   */
  check(ip: string): { allowed: boolean; retry_after?: number } {
    const now = Date.now();
    const lastAttempt = this.attempts.get(ip);

    if (lastAttempt) {
      const elapsed = now - lastAttempt;
      if (elapsed < this.windowMs) {
        const retryAfter = Math.ceil((this.windowMs - elapsed) / 1000);
        return { allowed: false, retry_after: retryAfter };
      }
    }

    // Allow registration and record timestamp
    this.attempts.set(ip, now);

    // Cleanup old entries (prevent memory leak)
    this.cleanup(now);

    return { allowed: true };
  }

  /**
   * Clean up expired entries from rate limiter
   *
   * @param now - Current timestamp
   */
  private cleanup(now: number) {
    for (const [ip, timestamp] of this.attempts.entries()) {
      if (now - timestamp > this.windowMs) {
        this.attempts.delete(ip);
      }
    }
  }
}

// Global rate limiter instance
// Note: In production with multiple Workers instances, use Durable Objects
// for distributed rate limiting. This in-memory version works for dev/testing.
export const registrationRateLimiter = new RegistrationRateLimiter();
