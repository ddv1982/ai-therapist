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
export interface SessionData {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'inactive' | 'archived';
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

export interface CBTData {
  sessionId: string;
  data: Record<string, unknown>;
  lastUpdated: Date;
}

export interface ReportData {
  id: string;
  sessionId: string;
  type: string;
  content: Record<string, unknown>;
  generatedAt: Date;
}

export interface UserSessionData {
  userId: string;
  sessions: SessionData[];
  lastActive: Date;
}

export interface AuthConfigData {
  totpEnabled: boolean;
  rateLimitEnabled: boolean;
  encryptionEnabled: boolean;
  lastUpdated: Date;
}

export interface DeviceData {
  id: string;
  fingerprint: string;
  userAgent: string;
  lastSeen: Date;
  trusted: boolean;
}

export interface TherapyPromptData {
  type: string;
  content: string;
  version: string;
  lastUpdated: Date;
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SESSION_DATA: 30 * 60, // 30 minutes
  MESSAGES: 15 * 60, // 15 minutes
  CBT_DATA: 60 * 60, // 1 hour
  REPORTS: 2 * 60 * 60, // 2 hours
  USER_SESSIONS: 10 * 60, // 10 minutes
  AUTH_CONFIG: 5 * 60, // 5 minutes
  DEVICE_INFO: 20 * 60, // 20 minutes
  THERAPY_PROMPTS: 24 * 60 * 60, // 24 hours
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
  CBT_DATA: (sessionId: string) => `cbt:${sessionId}`,
  REPORT: (sessionId: string, reportId?: string) => 
    `report:${sessionId}${reportId ? `:${reportId}` : ''}`,
  USER_SESSION: (userId: string) => `user_session:${userId}`,
  AUTH_CONFIG: () => 'auth:config',
  DEVICE: (deviceId: string) => `device:${deviceId}`,
  THERAPY_PROMPT: (type: string) => `therapy_prompt:${type}`,
} as const;

/**
 * Session data caching
 */
export class SessionCache {
  /**
   * Get session data from cache
   */
  static async get(sessionId: string) {
    return cache.get(CACHE_KEYS.SESSION(sessionId), {}, {
      ttl: CACHE_TTL.SESSION_DATA,
      prefix: 'therapist'
    });
  }

  /**
   * Set session data in cache
   */
  static async set(sessionId: string, data: SessionData) {
    return cache.set(CACHE_KEYS.SESSION(sessionId), data, {}, {
      ttl: CACHE_TTL.SESSION_DATA,
      prefix: 'therapist'
    });
  }

  /**
   * Invalidate session cache
   */
  static async invalidate(sessionId: string) {
    return cache.delete(CACHE_KEYS.SESSION(sessionId), {}, {
      prefix: 'therapist'
    });
  }

  /**
   * Invalidate all session-related caches
   */
  static async invalidateAll(sessionId: string) {
    const patterns = [
      CACHE_KEYS.SESSION(sessionId),
      `messages:${sessionId}*`,
      CACHE_KEYS.CBT_DATA(sessionId),
      `report:${sessionId}*`
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await cache.invalidatePattern(pattern, {}, { prefix: 'therapist' });
      totalDeleted += deleted;
    }

    logger.info('Session cache invalidated', {
      operation: 'session_cache_invalidate',
      sessionId,
      deletedCount: totalDeleted
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
    return cache.get(CACHE_KEYS.MESSAGES(sessionId, page, limit), {}, {
      ttl: CACHE_TTL.MESSAGES,
      prefix: 'therapist'
    });
  }

  /**
   * Set messages in cache
   */
  static async set(sessionId: string, data: MessageData[], page?: number, limit?: number) {
    return cache.set(CACHE_KEYS.MESSAGES(sessionId, page, limit), data, {}, {
      ttl: CACHE_TTL.MESSAGES,
      prefix: 'therapist'
    });
  }

  /**
   * Invalidate message cache for a session
   */
  static async invalidate(sessionId: string) {
    return cache.invalidatePattern(
      `messages:${sessionId}*`, 
      {}, 
      { prefix: 'therapist' }
    );
  }

  /**
   * Add new message to cache (invalidate to force refresh)
   */
  static async addMessage(sessionId: string) {
    return this.invalidate(sessionId);
  }
}

/**
 * CBT data caching
 */
export class CBTDataCache {
  /**
   * Get CBT data from cache
   */
  static async get(sessionId: string) {
    return cache.get(CACHE_KEYS.CBT_DATA(sessionId), {}, {
      ttl: CACHE_TTL.CBT_DATA,
      prefix: 'therapist'
    });
  }

  /**
   * Set CBT data in cache
   */
  static async set(sessionId: string, data: CBTData) {
    return cache.set(CACHE_KEYS.CBT_DATA(sessionId), data, {}, {
      ttl: CACHE_TTL.CBT_DATA,
      prefix: 'therapist'
    });
  }

  /**
   * Update CBT data in cache
   */
  static async update(sessionId: string, updates: Partial<CBTData>) {
    const existing = await this.get(sessionId);
    if (existing && typeof existing === 'object' && 'data' in existing && 'lastUpdated' in existing) {
      const existingData = existing as CBTData;
      const updated: CBTData = {
        sessionId,
        data: updates.data ?? existingData.data,
        lastUpdated: updates.lastUpdated ?? existingData.lastUpdated
      };
      return this.set(sessionId, updated);
    }
    return false;
  }

  /**
   * Invalidate CBT data cache
   */
  static async invalidate(sessionId: string) {
    return cache.delete(CACHE_KEYS.CBT_DATA(sessionId), {}, {
      prefix: 'therapist'
    });
  }
}

/**
 * Report caching
 */
export class ReportCache {
  /**
   * Get report from cache
   */
  static async get(sessionId: string, reportId?: string) {
    return cache.get(CACHE_KEYS.REPORT(sessionId, reportId), {}, {
      ttl: CACHE_TTL.REPORTS,
      prefix: 'therapist'
    });
  }

  /**
   * Set report in cache
   */
  static async set(sessionId: string, data: ReportData, reportId?: string) {
    return cache.set(CACHE_KEYS.REPORT(sessionId, reportId), data, {}, {
      ttl: CACHE_TTL.REPORTS,
      prefix: 'therapist'
    });
  }

  /**
   * Invalidate report cache
   */
  static async invalidate(sessionId: string, reportId?: string) {
    if (reportId) {
      return cache.delete(CACHE_KEYS.REPORT(sessionId, reportId), {}, {
        prefix: 'therapist'
      });
    } else {
      return cache.invalidatePattern(
        `report:${sessionId}*`, 
        {}, 
        { prefix: 'therapist' }
      );
    }
  }
}

/**
 * User session caching
 */
export class UserSessionCache {
  /**
   * Get user session from cache
   */
  static async get(userId: string) {
    return cache.get(CACHE_KEYS.USER_SESSION(userId), {}, {
      ttl: CACHE_TTL.USER_SESSIONS,
      prefix: 'therapist'
    });
  }

  /**
   * Set user session in cache
   */
  static async set(userId: string, data: UserSessionData) {
    return cache.set(CACHE_KEYS.USER_SESSION(userId), data, {}, {
      ttl: CACHE_TTL.USER_SESSIONS,
      prefix: 'therapist'
    });
  }

  /**
   * Invalidate user session cache
   */
  static async invalidate(userId: string) {
    return cache.delete(CACHE_KEYS.USER_SESSION(userId), {}, {
      prefix: 'therapist'
    });
  }
}

/**
 * Authentication config caching
 */
export class AuthConfigCache {
  /**
   * Get auth config from cache
   */
  static async get() {
    return cache.get(CACHE_KEYS.AUTH_CONFIG(), {}, {
      ttl: CACHE_TTL.AUTH_CONFIG,
      prefix: 'therapist'
    });
  }

  /**
   * Set auth config in cache
   */
  static async set(data: AuthConfigData) {
    return cache.set(CACHE_KEYS.AUTH_CONFIG(), data, {}, {
      ttl: CACHE_TTL.AUTH_CONFIG,
      prefix: 'therapist'
    });
  }

  /**
   * Invalidate auth config cache
   */
  static async invalidate() {
    return cache.delete(CACHE_KEYS.AUTH_CONFIG(), {}, {
      prefix: 'therapist'
    });
  }
}

/**
 * Device info caching
 */
export class DeviceCache {
  /**
   * Get device info from cache
   */
  static async get(deviceId: string) {
    return cache.get(CACHE_KEYS.DEVICE(deviceId), {}, {
      ttl: CACHE_TTL.DEVICE_INFO,
      prefix: 'therapist'
    });
  }

  /**
   * Set device info in cache
   */
  static async set(deviceId: string, data: DeviceData) {
    return cache.set(CACHE_KEYS.DEVICE(deviceId), data, {}, {
      ttl: CACHE_TTL.DEVICE_INFO,
      prefix: 'therapist'
    });
  }

  /**
   * Invalidate device cache
   */
  static async invalidate(deviceId: string) {
    return cache.delete(CACHE_KEYS.DEVICE(deviceId), {}, {
      prefix: 'therapist'
    });
  }
}

/**
 * Therapy prompts caching
 */
export class TherapyPromptCache {
  /**
   * Get therapy prompt from cache
   */
  static async get(type: string) {
    return cache.get(CACHE_KEYS.THERAPY_PROMPT(type), {}, {
      ttl: CACHE_TTL.THERAPY_PROMPTS,
      prefix: 'therapist'
    });
  }

  /**
   * Set therapy prompt in cache
   */
  static async set(type: string, data: TherapyPromptData) {
    return cache.set(CACHE_KEYS.THERAPY_PROMPT(type), data, {}, {
      ttl: CACHE_TTL.THERAPY_PROMPTS,
      prefix: 'therapist'
    });
  }

  /**
   * Invalidate therapy prompt cache
   */
  static async invalidate(type?: string) {
    if (type) {
      return cache.delete(CACHE_KEYS.THERAPY_PROMPT(type), {}, {
        prefix: 'therapist'
      });
    } else {
      return cache.invalidatePattern('therapy_prompt:*', {}, {
        prefix: 'therapist'
      });
    }
  }
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm up session caches
   */
  static async warmUpSessions(sessions: Array<{ id: string; data: SessionData }>) {
    const operations = sessions.map(session => 
      SessionCache.set(session.id, session.data)
    );
    
    await Promise.allSettled(operations);
    
    logger.info('Session caches warmed up', {
      operation: 'cache_warmup',
      type: 'sessions',
      count: sessions.length
    });
  }

  /**
   * Warm up therapy prompts
   */
  static async warmUpTherapyPrompts(prompts: Array<{ type: string; content: TherapyPromptData }>) {
    const operations = prompts.map(prompt => 
      TherapyPromptCache.set(prompt.type, prompt.content)
    );
    
    await Promise.allSettled(operations);
    
    logger.info('Therapy prompt caches warmed up', {
      operation: 'cache_warmup',
      type: 'therapy_prompts',
      count: prompts.length
    });
  }

  /**
   * Warm up auth config
   */
  static async warmUpAuthConfig(config: AuthConfigData) {
    await AuthConfigCache.set(config);
    
    logger.info('Auth config cache warmed up', {
      operation: 'cache_warmup',
      type: 'auth_config'
    });
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
      redis: health.redis,
      totalKeys: health.totalKeys,
      stats: stats instanceof Map ? Object.fromEntries(stats) : stats,
      cacheTypes: {
        sessions: await this.getCacheTypeHealth('session'),
        messages: await this.getCacheTypeHealth('messages'),
        cbt: await this.getCacheTypeHealth('cbt'),
        reports: await this.getCacheTypeHealth('report'),
        auth: await this.getCacheTypeHealth('auth'),
        devices: await this.getCacheTypeHealth('device'),
        prompts: await this.getCacheTypeHealth('therapy_prompt')
      }
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
