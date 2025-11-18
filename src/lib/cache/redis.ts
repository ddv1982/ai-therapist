/**
 * Simple Redis Wrapper using ioredis
 *
 * Lightweight wrapper around ioredis with automatic reconnection
 * and graceful fallback when Redis is unavailable.
 */

import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/lib/utils/logger';

const isNodeRuntime = typeof globalThis.process?.versions?.node === 'string';

let client: Redis | null = null;

/**
 * Get or create Redis client with lazy connection
 */
export function getRedisClient(): Redis | null {
  if (!isNodeRuntime) {
    return null;
  }

  if (!client && env.REDIS_URL) {
    try {
      client = new Redis(env.REDIS_URL, {
        retryStrategy: (times) => {
          if (times > 5) {
            logger.error('Redis max reconnection attempts reached', {
              operation: 'redis_connect',
            });
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          logger.warn('Redis reconnecting', { operation: 'redis_reconnect', attempt: times, delayMs: delay });
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });

      client.on('error', (err) => {
        logger.error('Redis error', { operation: 'redis_error' }, err);
      });

      client.on('connect', () => {
        logger.info('Redis connected', { operation: 'redis_connect' });
      });

      client.on('ready', () => {
        logger.info('Redis ready', { operation: 'redis_ready' });
      });

      client.on('close', () => {
        logger.warn('Redis connection closed', { operation: 'redis_close' });
      });

      if (isNodeRuntime && typeof process !== 'undefined' && typeof process.on !== 'undefined') {
        process.once('SIGINT', () => disconnect());
        process.once('SIGTERM', () => disconnect());
      }

      logger.info('Redis client initialized', { operation: 'redis_init' });
    } catch (error) {
      logger.error('Redis client initialization failed', { operation: 'redis_init' }, error instanceof Error ? error : new Error('Redis init failed'));
      client = null;
    }
  }

  return client;
}

/**
 * Get value from Redis
 */
export async function get(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    return await redis.get(key);
  } catch (error) {
    logger.error('Redis get failed', { operation: 'redis_get', key }, error instanceof Error ? error : new Error('Get failed'));
    return null;
  }
}

/**
 * Set value in Redis with optional TTL
 */
export async function set(key: string, value: string, ttl?: number): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    if (ttl) {
      return await redis.setex(key, ttl, value);
    }
    return await redis.set(key, value);
  } catch (error) {
    logger.error('Redis set failed', { operation: 'redis_set', key }, error instanceof Error ? error : new Error('Set failed'));
    return null;
  }
}

/**
 * Set value with expiration (alias for consistency with old API)
 */
export async function setEx(key: string, ttl: number, value: string): Promise<string | null> {
  return set(key, value, ttl);
}

/**
 * Delete one or more keys
 */
export async function del(...keys: string[]): Promise<number> {
  const redis = getRedisClient();
  if (!redis || keys.length === 0) return 0;

  try {
    return await redis.del(...keys);
  } catch (error) {
    logger.error('Redis del failed', { operation: 'redis_del', keys }, error instanceof Error ? error : new Error('Del failed'));
    return 0;
  }
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;

  try {
    return await redis.exists(key);
  } catch (error) {
    logger.error('Redis exists failed', { operation: 'redis_exists', key }, error instanceof Error ? error : new Error('Exists failed'));
    return 0;
  }
}

/**
 * Scan keys with pattern matching
 */
export async function scan(cursor: string, options: { MATCH: string; COUNT: number }): Promise<{ cursor: string; keys: string[] }> {
  const redis = getRedisClient();
  if (!redis) return { cursor: '0', keys: [] };

  try {
    const result = await redis.scan(cursor, 'MATCH', options.MATCH, 'COUNT', options.COUNT);
    return {
      cursor: result[0],
      keys: result[1],
    };
  } catch (error) {
    logger.error('Redis scan failed', { operation: 'redis_scan', cursor }, error instanceof Error ? error : new Error('Scan failed'));
    return { cursor: '0', keys: [] };
  }
}

/**
 * Get database size
 */
export async function dbSize(): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;

  try {
    return await redis.dbsize();
  } catch (error) {
    logger.error('Redis dbsize failed', { operation: 'redis_dbsize' }, error instanceof Error ? error : new Error('DbSize failed'));
    return 0;
  }
}

/**
 * Ping Redis server
 */
export async function ping(): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    return await redis.ping();
  } catch (error) {
    logger.error('Redis ping failed', { operation: 'redis_ping' }, error instanceof Error ? error : new Error('Ping failed'));
    return null;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnect(): Promise<void> {
  if (client) {
    try {
      await client.quit();
      logger.info('Redis disconnected', { operation: 'redis_disconnect' });
    } catch {
      logger.warn('Redis disconnect error', { operation: 'redis_disconnect' });
    }
    client = null;
  }
}

/**
 * Health check for Redis connection
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  connected: boolean;
  ready: boolean;
  error?: string;
}> {
  try {
    if (!isNodeRuntime) {
      return {
        healthy: false,
        connected: false,
        ready: false,
        error: 'Redis not available in this runtime',
      };
    }

    const redis = getRedisClient();
    if (!redis) {
      return {
        healthy: false,
        connected: false,
        ready: false,
        error: 'Client not initialized',
      };
    }

    const pong = await ping();
    const isConnected = redis.status === 'ready' || redis.status === 'connect';

    return {
      healthy: pong === 'PONG',
      connected: isConnected,
      ready: redis.status === 'ready',
      error: pong !== 'PONG' ? 'Ping failed' : undefined,
    };
  } catch (error) {
    return {
      healthy: false,
      connected: false,
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if client is ready
 */
export function isReady(): boolean {
  return client?.status === 'ready' || false;
}
