/**
 * Request deduplication utility to prevent duplicate operations
 * Helps with race conditions from rapid button clicks, network retries, etc.
 */

interface DeduplicationEntry {
  promise: Promise<unknown>;
  timestamp: number;
  ttl: number;
}

class RequestDeduplicator {
  private entries = new Map<string, DeduplicationEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Generate deduplication key for a request
   */
  static generateKey(
    userId: string,
    operation: string,
    resource?: string,
    sessionId?: string
  ): string {
    const parts = [userId, operation];
    if (resource) parts.push(resource);
    if (sessionId) parts.push(sessionId);
    return parts.join(':');
  }

  /**
   * Deduplicate an async operation
   * Returns the same promise for duplicate requests within TTL
   */
  deduplicate<T>(
    key: string,
    operation: () => Promise<T>,
    ttlMs: number = 5000 // 5 second default TTL
  ): Promise<T> {
    const now = Date.now();
    const existing = this.entries.get(key);

    // Return existing promise if still valid
    if (existing && now < existing.timestamp + existing.ttl) {
      return existing.promise as Promise<T>;
    }

    // Create new promise
    const promise = operation().finally(() => {
      // Remove entry after completion to allow new requests
      this.entries.delete(key);
    });

    // Store the promise with metadata
    this.entries.set(key, {
      promise,
      timestamp: now,
      ttl: ttlMs,
    });

    return promise;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.entries.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => this.entries.delete(key));
  }

  /**
   * Get stats for monitoring
   */
  getStats(): { activeRequests: number; totalKeys: number } {
    return {
      activeRequests: this.entries.size,
      totalKeys: this.entries.size,
    };
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.entries.clear();
  }
}

// Singleton instance
const deduplicator = new RequestDeduplicator();

/**
 * Deduplicate critical operations to prevent race conditions
 *
 * @param userId - User ID for scoping
 * @param operation - Operation name (e.g., 'create_session', 'send_message')
 * @param asyncOperation - The async operation to deduplicate
 * @param resource - Optional resource identifier (e.g., sessionId)
 * @param ttlMs - Time-to-live for deduplication (default 5s)
 */
export function deduplicateRequest<T>(
  userId: string,
  operation: string,
  asyncOperation: () => Promise<T>,
  resource?: string,
  ttlMs: number = 5000
): Promise<T> {
  const key = RequestDeduplicator.generateKey(userId, operation, resource);
  return deduplicator.deduplicate(key, asyncOperation, ttlMs);
}

/**
 * Deduplicate with custom key (for more complex scenarios)
 */
export function deduplicateWithKey<T>(
  key: string,
  asyncOperation: () => Promise<T>,
  ttlMs: number = 5000
): Promise<T> {
  return deduplicator.deduplicate(key, asyncOperation, ttlMs);
}

/**
 * Get deduplication stats for monitoring
 */
export function getDeduplicationStats() {
  return deduplicator.getStats();
}

/**
 * Clear deduplication cache (mainly for testing)
 */
export function clearDeduplicationCache() {
  deduplicator.clear();
}

// Export for testing
export { deduplicator };
