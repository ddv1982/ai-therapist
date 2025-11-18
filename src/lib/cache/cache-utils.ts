/**
 * Redis Caching Utilities and Decorators
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

import { redisManager } from './redis-client';
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

class CacheManager {
  private stats: Map<string, CacheStats> = new Map();
  private defaultTTL = 300; // 5 minutes
  private maxKeyLength = 250; // Redis key length limit

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
      const result = await redisManager.executeCommand(
        async (client) => await client.get(cacheKey),
        null
      );

      if (result === null) {
        this.updateStats(key, false);
        return (cacheOptions.fallback as T) || null;
      }

      this.updateStats(key, true);

      if (cacheOptions.serialize !== false) {
        return this.deserialize<T>(result);
      }

      return result as T;
    } catch (error) {
      this.updateStats(key, false, true);
      logger.error('Cache get failed', {
        operation: 'cache_get',
        key: cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to in-memory cache
      const memoryCache = (globalThis as { __memoryCache?: Record<string, unknown> }).__memoryCache;
      const memoryValue = memoryCache?.[cacheKey];
      if (memoryValue !== undefined) {
        return memoryValue as T;
      }

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

      const result = await redisManager.executeCommand(
        async (client) => await client.setEx(cacheKey, ttl, value),
        null
      );

      if (result === 'OK') {
        logger.debug('Cache set successful', {
          operation: 'cache_set',
          key: cacheKey,
          ttl,
        });
      }

      return result === 'OK';
    } catch (error) {
      logger.error('Cache set failed', {
        operation: 'cache_set',
        key: cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to in-memory cache
      const globalWithCache = globalThis as { __memoryCache?: Record<string, unknown> };
      if (!globalWithCache.__memoryCache) {
        globalWithCache.__memoryCache = {};
      }
      globalWithCache.__memoryCache[cacheKey] = data;

      return true;
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
      const result = await redisManager.executeCommand(
        async (client) => await client.del(cacheKey),
        0
      );

      logger.debug('Cache delete successful', {
        operation: 'cache_delete',
        key: cacheKey,
        deleted: (result ?? 0) > 0,
      });

      return (result ?? 0) > 0;
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

    try {
      const result = await redisManager.executeCommand(
        async (client) => await client.exists(cacheKey),
        0
      );

      return result === 1;
    } catch (error) {
      logger.error('Cache exists check failed', {
        operation: 'cache_exists',
        key: cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
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

    try {
      const result = await redisManager.executeCommand(async (client) => {
        let cursor = 0;
        let totalDeleted = 0;
        do {
          const scanResult = await client.scan(String(cursor), {
            MATCH: searchPattern,
            COUNT: 100,
          });
          cursor = Number(scanResult.cursor);
          const keys: string[] = scanResult.keys;
          if (keys.length > 0) {
            totalDeleted += await client.del(keys as unknown as [string, ...string[]]);
          }
        } while (cursor !== 0);
        return totalDeleted;
      }, 0);

      logger.info('Cache pattern invalidation successful', {
        operation: 'cache_invalidate_pattern',
        pattern: searchPattern,
        deletedCount: result,
      });

      return result ?? 0;
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

    try {
      const result = await redisManager.executeCommand(async (client) => {
        let cursor = 0;
        let totalCount = 0;
        do {
          const scanResult = await client.scan(String(cursor), {
            MATCH: searchPattern,
            COUNT: 100,
          });
          cursor = Number(scanResult.cursor);
          const keys: string[] = scanResult.keys;
          totalCount += keys.length;
        } while (cursor !== 0);
        return totalCount;
      }, 0);

      return result ?? 0;
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
    const redisHealth = await redisManager.healthCheck();

    let totalKeys = 0;
    try {
      const result = await redisManager.executeCommand(async (client) => await client.dbSize(), 0);
      totalKeys = result || 0;
    } catch (error) {
      logger.warn('Failed to get Redis key count', {
        operation: 'cache_health',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return {
      redis: redisHealth.healthy,
      stats: new Map(this.stats),
      totalKeys,
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

// All types are already exported through their interface declarations above
