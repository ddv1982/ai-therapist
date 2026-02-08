/**
 * API-Specific Caching Implementation
 *
 * Provides specialized caching strategies for different API endpoints
 * in the AI Therapist application, with appropriate TTLs and invalidation patterns.
 *
 * Features:
 * - Session-specific caching
 * - Message caching with streaming support
 * - CBT data caching
 * - Report generation caching
 * - User session caching
 */

import { cache } from './cache-utils';
import { logger } from '@/lib/utils/logger';

// Type definitions for cached data
interface SessionData {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageData {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: Date;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  SESSION_DATA: 30 * 60, // 30 minutes
  MESSAGES: 15 * 60, // 15 minutes
} as const;

// Cache key patterns
export const CACHE_KEYS = {
  SESSION: (sessionId: string) => `session:${sessionId}`,
  MESSAGES: (sessionId: string, page?: number, limit?: number) => {
    let key = `messages:${sessionId}`;
    if (typeof page === 'number') {
      key += `:page:${page}`;
    }
    if (typeof limit === 'number') {
      key += `:limit:${limit}`;
    }
    return key;
  },
} as const;

/**
 * Session data caching
 */
export class SessionCache {
  /**
   * Get session data from cache
   */
  static async get(sessionId: string) {
    return cache.get(
      CACHE_KEYS.SESSION(sessionId),
      {},
      {
        ttl: CACHE_TTL.SESSION_DATA,
        prefix: 'therapist',
      }
    );
  }

  /**
   * Set session data in cache
   */
  static async set(sessionId: string, data: SessionData) {
    return cache.set(
      CACHE_KEYS.SESSION(sessionId),
      data,
      {},
      {
        ttl: CACHE_TTL.SESSION_DATA,
        prefix: 'therapist',
      }
    );
  }

  /**
   * Invalidate session cache
   */
  static async invalidate(sessionId: string) {
    return cache.delete(
      CACHE_KEYS.SESSION(sessionId),
      {},
      {
        prefix: 'therapist',
      }
    );
  }

  /**
   * Invalidate all session-related caches
   */
  static async invalidateAll(sessionId: string) {
    const patterns = [CACHE_KEYS.SESSION(sessionId), `messages:${sessionId}*`];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await cache.invalidatePattern(pattern, {}, { prefix: 'therapist' });
      totalDeleted += deleted;
    }

    logger.info('Session cache invalidated', {
      operation: 'session_cache_invalidate',
      sessionId,
      deletedCount: totalDeleted,
    });

    return totalDeleted;
  }
}

/**
 * Message caching with pagination support
 */
export class MessageCache {
  /**
   * Get messages from cache
   */
  static async get(sessionId: string, page?: number, limit?: number) {
    return cache.get(
      CACHE_KEYS.MESSAGES(sessionId, page, limit),
      {},
      {
        ttl: CACHE_TTL.MESSAGES,
        prefix: 'therapist',
      }
    );
  }

  /**
   * Set messages in cache
   */
  static async set(sessionId: string, data: MessageData[], page?: number, limit?: number) {
    return cache.set(
      CACHE_KEYS.MESSAGES(sessionId, page, limit),
      data,
      {},
      {
        ttl: CACHE_TTL.MESSAGES,
        prefix: 'therapist',
      }
    );
  }

  /**
   * Invalidate message cache for a session
   */
  static async invalidate(sessionId: string) {
    return cache.invalidatePattern(`messages:${sessionId}*`, {}, { prefix: 'therapist' });
  }

  /**
   * Add new message to cache (invalidate to force refresh)
   */
  static async addMessage(sessionId: string) {
    return this.invalidate(sessionId);
  }
}

/**
 * Cache health monitoring
 */
export class CacheHealthMonitor {
  /**
   * Get comprehensive cache health information
   */
  static async getHealthInfo() {
    const health = await cache.health();
    const stats = cache.getStats();

    return {
      backend: health.backend,
      shared: health.shared,
      totalKeys: health.totalKeys,
      stats: stats instanceof Map ? Object.fromEntries(stats) : stats,
      cacheTypes: {
        sessions: await this.getCacheTypeHealth('session'),
        messages: await this.getCacheTypeHealth('messages'),
      },
    };
  }

  /**
   * Get health info for a specific cache type
   */
  private static async getCacheTypeHealth(type: string) {
    try {
      const pattern = `${type}:*`;
      const keyCount = await cache.countPattern(pattern, {}, { prefix: 'therapist' });
      return { available: true, keyCount };
    } catch (error) {
      return { available: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// All cache classes are already exported through their class declarations above
