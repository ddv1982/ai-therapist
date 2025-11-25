/**
 * Crypto Operation Rate Limiter
 *
 * Prevents abuse of encryption/decryption operations by rate limiting
 * crypto operations per user.
 *
 * Features:
 * - Per-user rate limiting
 * - 100 operations per minute default
 * - Automatic cleanup of expired entries
 * - Memory-efficient sliding window
 *
 * Security:
 * - Prevents DoS attacks via crypto operations
 * - Protects against key derivation brute force
 * - Minimal performance impact on normal usage
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter for cryptographic operations
 */
class CryptoRateLimiter {
  private attempts = new Map<string, RateLimitEntry>();
  private readonly limit: number;
  private readonly windowMs: number;
  private lastCleanup: number = Date.now();
  private readonly cleanupIntervalMs = 60000; // Clean up every minute

  /**
   * Create a new rate limiter
   * @param limit - Maximum operations per window (default: 100)
   * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
   */
  constructor(limit = 100, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Check if operation is within rate limit
   * @param userId - User identifier (use 'anonymous' for unauthenticated)
   * @throws Error if rate limit exceeded
   * @returns true if operation allowed
   */
  checkLimit(userId: string): boolean {
    const now = Date.now();

    // Periodic cleanup of expired entries
    this.periodicCleanup(now);

    const entry = this.attempts.get(userId);

    // Clean up expired entry
    if (entry && now > entry.resetAt) {
      this.attempts.delete(userId);
    }

    const current = this.attempts.get(userId);

    // First operation in window
    if (!current) {
      this.attempts.set(userId, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (current.count >= this.limit) {
      const secondsRemaining = Math.ceil((current.resetAt - now) / 1000);
      throw new Error(
        `Rate limit exceeded for encryption operations. Please try again in ${secondsRemaining} seconds.`
      );
    }

    // Increment count
    current.count++;
    return true;
  }

  /**
   * Reset rate limit for a specific user (for testing or manual reset)
   * @param userId - User identifier to reset
   */
  reset(userId: string): void {
    this.attempts.delete(userId);
  }

  /**
   * Clear all rate limit entries (for testing)
   */
  resetAll(): void {
    this.attempts.clear();
    this.lastCleanup = Date.now();
  }

  /**
   * Get current usage for a user (for debugging/monitoring)
   * @param userId - User identifier
   * @returns Current count and reset time, or null if no entry
   */
  getUsage(userId: string): { count: number; resetAt: number; limit: number } | null {
    const entry = this.attempts.get(userId);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.resetAt) {
      this.attempts.delete(userId);
      return null;
    }

    return {
      count: entry.count,
      resetAt: entry.resetAt,
      limit: this.limit,
    };
  }

  /**
   * Periodic cleanup of expired entries to prevent memory leaks
   */
  private periodicCleanup(now: number): void {
    if (now - this.lastCleanup < this.cleanupIntervalMs) {
      return;
    }

    this.lastCleanup = now;

    for (const [userId, entry] of this.attempts.entries()) {
      if (now > entry.resetAt) {
        this.attempts.delete(userId);
      }
    }
  }

  /**
   * Get rate limiter statistics (for monitoring)
   */
  getStats(): {
    totalUsers: number;
    limit: number;
    windowMs: number;
  } {
    return {
      totalUsers: this.attempts.size,
      limit: this.limit,
      windowMs: this.windowMs,
    };
  }
}

/**
 * Global rate limiter instance
 * 100 operations per minute per user
 */
export const cryptoRateLimiter = new CryptoRateLimiter(100, 60000);

/**
 * Create a custom rate limiter with different limits
 * Useful for testing or specialized use cases
 */
export function createCryptoRateLimiter(limit: number, windowMs: number): CryptoRateLimiter {
  return new CryptoRateLimiter(limit, windowMs);
}
