/**
 * In-Memory Caching Utilities and Decorators
 *
 * Provides high-level caching utilities with automatic serialization,
 * TTL management, and cache invalidation strategies for the AI Therapist application.
 *
 * Features:
 * - Automatic JSON serialization/deserialization
 * - TTL management with different strategies
 * - Cache invalidation patterns
 * - Memory-efficient caching
 * - Cache warming and preloading
 * - Performance monitoring
 */

import { logger } from '@/lib/utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
  serialize?: boolean; // Whether to serialize data (default: true)
  compress?: boolean; // Whether to compress large data (default: false)
  fallback?: unknown; // Fallback value when cache miss
}

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
  hitRate: number;
}

export interface CacheKeyOptions {
  sessionId?: string;
  userId?: string;
  endpoint?: string;
  params?: Record<string, unknown>;
  version?: string;
}

interface CacheItem {
  value: string;
  expires: number;
}

class CacheManager {
  private stats: Map<string, CacheStats> = new Map();
  private storage: Map<string, CacheItem> = new Map();
  private defaultTTL = 300; // 5 minutes
  private maxKeyLength = 250;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodic cleanup of expired items
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    if (typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.storage.entries()) {
      if (item.expires < now) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Generate cache key with proper namespacing
   */
  private generateKey(
    baseKey: string,
    options: CacheKeyOptions = {},
    prefix: string = 'therapist'
  ): string {
    const parts = [prefix];

    if (options.sessionId) parts.push('session', options.sessionId);
    if (options.userId) parts.push('user', options.userId);
    if (options.endpoint) parts.push('api', options.endpoint);
    if (options.version) parts.push('v', options.version);

    parts.push(baseKey);

    // Add params hash if provided
    if (options.params && Object.keys(options.params).length > 0) {
      const paramsHash = this.hashObject(options.params);
      parts.push('params', paramsHash);
    }

    const key = parts.join(':');

    if (key.length > this.maxKeyLength) {
      // Truncate and add hash for long keys
      const hash = this.hashString(key);
      return `${key.substring(0, this.maxKeyLength - 9)}:${hash}`;
    }

    return key;
  }

  /**
   * Hash object for consistent key generation
   */
  private hashObject(obj: Record<string, unknown>): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return this.hashString(str);
  }

  /**
   * Simple hash function for strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Serialize data for caching
   */
  private serialize(data: unknown): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      logger.error('Cache serialization failed', {
        operation: 'cache_serialize',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to serialize data for caching');
    }
  }

  /**
   * Deserialize data from cache
   */
  private deserialize<T>(data: string): T {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache deserialization failed', {
        operation: 'cache_deserialize',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to deserialize cached data');
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(key: string, hit: boolean, error = false): void {
    const current = this.stats.get(key) || {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0,
      hitRate: 0,
    };

    current.totalRequests++;
    if (error) {
      current.errors++;
    } else if (hit) {
      current.hits++;
    } else {
      current.misses++;
    }

    current.hitRate = current.hits / (current.totalRequests - current.errors);
    this.stats.set(key, current);
  }

  /**
   * Get data from cache
   */
  async get<T>(
    key: string,
    options: CacheKeyOptions = {},
    cacheOptions: CacheOptions = {}
  ): Promise<T | null> {
    const cacheKey = this.generateKey(key, options, cacheOptions.prefix);

    try {
      const item = this.storage.get(cacheKey);
      const now = Date.now();

      if (!item || item.expires < now) {
        if (item) this.storage.delete(cacheKey);
        this.updateStats(key, false);
        return (cacheOptions.fallback as T) || null;
      }

      this.updateStats(key, true);

      if (cacheOptions.serialize !== false) {
        return this.deserialize<T>(item.value);
      }

      return item.value as unknown as T;
    } catch (error) {
      this.updateStats(key, false, true);
      logger.error('Cache get failed', {
        operation: 'cache_get',
        key: cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return (cacheOptions.fallback as T) || null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheKeyOptions = {},
    cacheOptions: CacheOptions = {}
  ): Promise<boolean> {
    const cacheKey = this.generateKey(key, options, cacheOptions.prefix);
    const ttl = cacheOptions.ttl || this.defaultTTL;

    try {
      let value: string;

      if (cacheOptions.serialize !== false) {
        value = this.serialize(data);
      } else {
        value = String(data);
      }

      this.storage.set(cacheKey, {
        value,
        expires: Date.now() + ttl * 1000,
      });

      logger.debug('Cache set successful', {
        operation: 'cache_set',
        key: cacheKey,
        ttl,
      });

      return true;
    } catch (error) {
      logger.error('Cache set failed', {
        operation: 'cache_set',
        key: cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(
    key: string,
    options: CacheKeyOptions = {},
    cacheOptions: CacheOptions = {}
  ): Promise<boolean> {
    const cacheKey = this.generateKey(key, options, cacheOptions.prefix);

    try {
      const result = this.storage.delete(cacheKey);

      logger.debug('Cache delete successful', {
        operation: 'cache_delete',
        key: cacheKey,
        deleted: result,
      });

      return result;
    } catch (error) {
      logger.error('Cache delete failed', {
        operation: 'cache_delete',
        key: cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(
    key: string,
    options: CacheKeyOptions = {},
    cacheOptions: CacheOptions = {}
  ): Promise<boolean> {
    const cacheKey = this.generateKey(key, options, cacheOptions.prefix);
    const item = this.storage.get(cacheKey);
    return !!item && item.expires > Date.now();
  }

  /**
   * Get or set pattern - fetch from cache or compute and store
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T>,
    options: CacheKeyOptions = {},
    cacheOptions: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options, cacheOptions);
    if (cached !== null) {
      return cached;
    }

    // Compute the value
    const computed = await computeFn();

    // Store in cache
    await this.set(key, computed, options, cacheOptions);

    return computed;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(
    pattern: string,
    options: CacheKeyOptions = {},
    cacheOptions: CacheOptions = {}
  ): Promise<number> {
    const searchPattern = this.generateKey(pattern, options, cacheOptions.prefix);

    // Convert glob pattern to regex
    // Simple conversion: * -> .*
    const regex = new RegExp('^' + searchPattern.replace(/\*/g, '.*') + '$');

    try {
      let totalDeleted = 0;
      for (const key of this.storage.keys()) {
        if (regex.test(key)) {
          this.storage.delete(key);
          totalDeleted++;
        }
      }

      logger.info('Cache pattern invalidation successful', {
        operation: 'cache_invalidate_pattern',
        pattern: searchPattern,
        deletedCount: totalDeleted,
      });

      return totalDeleted;
    } catch (error) {
      logger.error('Cache pattern invalidation failed', {
        operation: 'cache_invalidate_pattern',
        pattern: searchPattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Count keys matching a pattern without mutating the cache
   */
  async countPattern(
    pattern: string,
    options: CacheKeyOptions = {},
    cacheOptions: CacheOptions = {}
  ): Promise<number> {
    const searchPattern = this.generateKey(pattern, options, cacheOptions.prefix);
    const regex = new RegExp('^' + searchPattern.replace(/\*/g, '.*') + '$');

    try {
      let totalCount = 0;
      const now = Date.now();
      for (const [key, item] of this.storage.entries()) {
        if (regex.test(key) && item.expires > now) {
          totalCount++;
        }
      }

      return totalCount;
    } catch (error) {
      logger.error('Cache pattern count failed', {
        operation: 'cache_count_pattern',
        pattern: searchPattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Clear all cache for a namespace
   */
  async clearNamespace(prefix: string): Promise<number> {
    return this.invalidatePattern('*', {}, { prefix });
  }

  /**
   * Get cache statistics
   */
  getStats(key?: string): CacheStats | Map<string, CacheStats> {
    if (key) {
      return this.stats.get(key) || { hits: 0, misses: 0, errors: 0, totalRequests: 0, hitRate: 0 };
    }
    return new Map(this.stats);
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats.clear();
  }

  /**
   * Warm up cache with data
   */
  async warmUp<T>(
    key: string,
    data: T,
    options: CacheKeyOptions = {},
    cacheOptions: CacheOptions = {}
  ): Promise<boolean> {
    return this.set(key, data, options, cacheOptions);
  }

  /**
   * Get cache health information
   */
  async getHealthInfo(): Promise<{
    redis: boolean;
    stats: Map<string, CacheStats>;
    totalKeys: number;
  }> {
    return {
      redis: false,
      stats: new Map(this.stats),
      totalKeys: this.storage.size,
    };
  }

  /**
   * Invalidate all keys in a namespace
   */
  async invalidateNamespace(namespace: string): Promise<number> {
    return this.invalidatePattern('*', {}, { prefix: namespace });
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export utility functions
export const cache = {
  get: <T>(key: string, options?: CacheKeyOptions, cacheOptions?: CacheOptions) =>
    cacheManager.get<T>(key, options, cacheOptions),

  set: <T>(key: string, data: T, options?: CacheKeyOptions, cacheOptions?: CacheOptions) =>
    cacheManager.set(key, data, options, cacheOptions),

  delete: (key: string, options?: CacheKeyOptions, cacheOptions?: CacheOptions) =>
    cacheManager.delete(key, options, cacheOptions),

  exists: (key: string, options?: CacheKeyOptions, cacheOptions?: CacheOptions) =>
    cacheManager.exists(key, options, cacheOptions),

  getOrSet: <T>(
    key: string,
    computeFn: () => Promise<T>,
    options?: CacheKeyOptions,
    cacheOptions?: CacheOptions
  ) => cacheManager.getOrSet(key, computeFn, options, cacheOptions),

  invalidatePattern: (pattern: string, options?: CacheKeyOptions, cacheOptions?: CacheOptions) =>
    cacheManager.invalidatePattern(pattern, options, cacheOptions),

  countPattern: (pattern: string, options?: CacheKeyOptions, cacheOptions?: CacheOptions) =>
    cacheManager.countPattern(pattern, options, cacheOptions),

  clearNamespace: (prefix: string) => cacheManager.clearNamespace(prefix),

  getStats: (key?: string) => cacheManager.getStats(key),

  resetStats: () => cacheManager.resetStats(),

  warmUp: <T>(key: string, data: T, options?: CacheKeyOptions, cacheOptions?: CacheOptions) =>
    cacheManager.warmUp(key, data, options, cacheOptions),

  health: () => cacheManager.getHealthInfo(),
};
