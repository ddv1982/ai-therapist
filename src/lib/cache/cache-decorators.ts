/**
 * Caching Decorators and Higher-Order Functions
 * 
 * Provides decorators and HOFs for easy caching integration with existing
 * functions and API routes in the AI Therapist application.
 * 
 * Features:
 * - Method decorators for automatic caching
 * - Higher-order functions for API routes
 * - Automatic cache invalidation
 * - Performance monitoring
 * - Error handling with fallbacks
 */

import { cache, CacheOptions, CacheKeyOptions } from './cache-utils';
import { logger } from '@/lib/utils/logger';

export interface CacheDecoratorOptions extends CacheOptions {
  keyGenerator?: (args: unknown[], context?: unknown) => string;
  invalidateOn?: string[]; // Methods that should invalidate this cache
  skipCache?: (args: unknown[], context?: unknown) => boolean;
  onCacheHit?: (key: string, result: unknown) => void;
  onCacheMiss?: (key: string) => void;
  onCacheError?: (key: string, error: Error) => void;
}

/**
 * Method decorator for automatic caching
 */
export function Cached(options: CacheDecoratorOptions = {}) {
  return function (_target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cacheKeyPrefix = `${(_target as { constructor: { name: string } }).constructor.name}:${propertyName}`;

    descriptor.value = async function (...args: unknown[]) {
      // Generate cache key
      const keyGenerator = options.keyGenerator || ((args: unknown[]) => 
        `${cacheKeyPrefix}:${JSON.stringify(args)}`
      );
      
      const cacheKey = keyGenerator(args, this);
      
      // Check if we should skip caching
      if (options.skipCache && options.skipCache(args, this)) {
        return originalMethod.apply(this, args);
      }

      try {
        // Try to get from cache
        const cached = await cache.get(cacheKey, {}, options);
        if (cached !== null) {
          options.onCacheHit?.(cacheKey, cached);
          return cached;
        }

        // Cache miss - compute result
        options.onCacheMiss?.(cacheKey);
        const result = await originalMethod.apply(this, args);
        
        // Store in cache
        await cache.set(cacheKey, result, {}, options);
        
        return result;
      } catch (error) {
        options.onCacheError?.(cacheKey, error as Error);
        logger.error('Cached method execution failed', {
          operation: 'cached_method',
          method: propertyName,
          key: cacheKey,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Higher-order function for caching API route results
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  keyGenerator: (args: Parameters<T>) => string,
  options: CacheDecoratorOptions = {}
) {
  return function (target: T): T {
    return (async (...args: Parameters<T>) => {
      const cacheKey = keyGenerator(args);
      
      // Check if we should skip caching
      if (options.skipCache && options.skipCache(args)) {
        return target(...args);
      }

      try {
        // Try to get from cache
        const cached = await cache.get(cacheKey, {}, options);
        if (cached !== null) {
          options.onCacheHit?.(cacheKey, cached);
          return cached;
        }

        // Cache miss - compute result
        options.onCacheMiss?.(cacheKey);
        const result = await target(...args);
        
        // Store in cache
        await cache.set(cacheKey, result, {}, options);
        
        return result;
      } catch (error) {
        options.onCacheError?.(cacheKey, error as Error);
        logger.error('Cached function execution failed', {
          operation: 'cached_function',
          key: cacheKey,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }) as T;
  };
}

/**
 * Cache invalidation decorator
 */
export function CacheInvalidate(
  patterns: string[],
  options: { keyGenerator?: (args: unknown[]) => string } = {}
) {
  return function (_target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);
      
      // Invalidate cache patterns
      for (const pattern of patterns) {
        const keyGenerator = options.keyGenerator || (() => pattern);
        const cacheKey = keyGenerator(args);
        
        try {
          await cache.invalidatePattern(cacheKey);
          logger.debug('Cache invalidated', {
            operation: 'cache_invalidate',
            pattern: cacheKey,
            method: propertyName
          });
        } catch (error) {
          logger.error('Cache invalidation failed', {
            operation: 'cache_invalidate',
            pattern: cacheKey,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Session-specific caching for user data
 */
export function withSessionCache<T extends (...args: unknown[]) => Promise<unknown>>(
  keyGenerator: (args: Parameters<T>, sessionId?: string) => string,
  options: CacheDecoratorOptions = {}
) {
  return function (target: T): T {
    return (async (...args: Parameters<T>) => {
      // Extract sessionId from args or context
      const sessionArg = args.find(arg => 
        typeof arg === 'object' && 
        arg !== null && 
        'sessionId' in arg && 
        typeof (arg as { sessionId: unknown }).sessionId === 'string'
      );
      const sessionId = sessionArg ? (sessionArg as { sessionId: string }).sessionId : undefined;
      const cacheKey = keyGenerator(args, sessionId);
      
      const sessionOptions: CacheKeyOptions = {
        sessionId,
        ...options
      };

      try {
        // Try to get from cache
        const cached = await cache.get(cacheKey, sessionOptions, options);
        if (cached !== null) {
          options.onCacheHit?.(cacheKey, cached);
          return cached;
        }

        // Cache miss - compute result
        options.onCacheMiss?.(cacheKey);
        const result = await target(...args);
        
        // Store in cache
        await cache.set(cacheKey, result, sessionOptions, options);
        
        return result;
      } catch (error) {
        options.onCacheError?.(cacheKey, error as Error);
        logger.error('Session cached function execution failed', {
          operation: 'session_cached_function',
          key: cacheKey,
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }) as T;
  };
}

/**
 * API route caching wrapper
 */
export function withApiCache(
  keyGenerator: (request: { method?: string }, params?: unknown) => string,
  options: CacheDecoratorOptions = {}
) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(handler: T): T {
    return (async (request: { method?: string }, context?: unknown, params?: unknown) => {
      const cacheKey = keyGenerator(request, params);
      
      // Skip caching for non-GET requests by default
      if (request.method && request.method !== 'GET' && !options.skipCache) {
        return handler(request, context, params);
      }

      try {
        // Try to get from cache
        const cached = await cache.get(cacheKey, {}, options);
        if (cached !== null) {
          options.onCacheHit?.(cacheKey, cached);
          return cached;
        }

        // Cache miss - compute result
        options.onCacheMiss?.(cacheKey);
        const result = await handler(request, context, params);
        
        // Store in cache
        await cache.set(cacheKey, result, {}, options);
        
        return result;
      } catch (error) {
        options.onCacheError?.(cacheKey, error as Error);
        logger.error('API cached handler execution failed', {
          operation: 'api_cached_handler',
          key: cacheKey,
          method: request.method,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }) as T;
  };
}

/**
 * Database query caching
 */
export function withQueryCache<T extends (...args: unknown[]) => Promise<unknown>>(
  keyGenerator: (args: Parameters<T>) => string,
  options: CacheDecoratorOptions = {}
) {
  return function (target: T): T {
    return (async (...args: Parameters<T>) => {
      const cacheKey = `query:${keyGenerator(args)}`;
      
      try {
        // Try to get from cache
        const cached = await cache.get(cacheKey, {}, options);
        if (cached !== null) {
          options.onCacheHit?.(cacheKey, cached);
          return cached;
        }

        // Cache miss - execute query
        options.onCacheMiss?.(cacheKey);
        const result = await target(...args);
        
        // Store in cache
        await cache.set(cacheKey, result, {}, options);
        
        return result;
      } catch (error) {
        options.onCacheError?.(cacheKey, error as Error);
        logger.error('Query cached execution failed', {
          operation: 'query_cached',
          key: cacheKey,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }) as T;
  };
}

/**
 * Cache warming utility
 */
export async function warmUpCache<T>(
  key: string,
  dataProvider: () => Promise<T>,
  options: CacheKeyOptions = {},
  cacheOptions: CacheOptions = {}
): Promise<T> {
  try {
    const data = await dataProvider();
    await cache.set(key, data, options, cacheOptions);
    
    logger.info('Cache warmed up successfully', {
      operation: 'cache_warmup',
      key,
      ttl: cacheOptions.ttl
    });
    
    return data;
  } catch (error) {
    logger.error('Cache warmup failed', {
      operation: 'cache_warmup',
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Batch cache operations
 */
export class BatchCache {
  private operations: Array<{
    type: 'get' | 'set' | 'delete';
    key: string;
    data?: unknown;
    options?: CacheKeyOptions;
    cacheOptions?: CacheOptions;
  }> = [];

  get(key: string, options?: CacheKeyOptions, cacheOptions?: CacheOptions): this {
    this.operations.push({ type: 'get', key, options, cacheOptions });
    return this;
  }

  set<T>(key: string, data: T, options?: CacheKeyOptions, cacheOptions?: CacheOptions): this {
    this.operations.push({ type: 'set', key, data, options, cacheOptions });
    return this;
  }

  delete(key: string, options?: CacheKeyOptions, cacheOptions?: CacheOptions): this {
    this.operations.push({ type: 'delete', key, options, cacheOptions });
    return this;
  }

  async execute(): Promise<Array<unknown>> {
    const results: unknown[] = [];
    
    for (const op of this.operations) {
      try {
        let result: unknown;
        switch (op.type) {
          case 'get':
            result = await cache.get(op.key, op.options, op.cacheOptions);
            break;
          case 'set':
            result = await cache.set(op.key, op.data, op.options, op.cacheOptions);
            break;
          case 'delete':
            result = await cache.delete(op.key, op.options, op.cacheOptions);
            break;
        }
        results.push(result);
      } catch (error) {
        logger.error('Batch cache operation failed', {
          operation: 'batch_cache',
          type: op.type,
          key: op.key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.push(null);
      }
    }
    
    this.operations = [];
    return results;
  }
}

// Export utility functions
export const batchCache = () => new BatchCache();

// Export types
