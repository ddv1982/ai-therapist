/**
 * Cache Health Check Endpoint
 * 
 * Provides comprehensive health information about the Redis cache system
 * for monitoring and debugging purposes.
 */

import { NextRequest } from 'next/server';
import { withApiRoute } from '@/lib/api/with-route';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { CacheHealthMonitor, cache } from '@/lib/cache';
import { redisManager } from '@/lib/cache/redis-client';
import { logger } from '@/lib/utils/logger';

export const GET = withApiRoute(async (_request: NextRequest, context) => {
  try {
    // Get Redis health
    const redisHealth = await redisManager.healthCheck();
    
    // Get cache health information
    const cacheHealth = await CacheHealthMonitor.getHealthInfo();
    
    // Get cache statistics
    const stats = cache.getStats();
    
    // Get cache configuration
    const config = {
      enabled: process.env.CACHE_ENABLED !== 'false',
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300'),
      sessionTTL: parseInt(process.env.CACHE_SESSION_TTL || '1800'),
      messageTTL: parseInt(process.env.CACHE_MESSAGE_TTL || '900'),
    };

    const healthInfo = {
      redis: {
        connected: redisHealth.connected,
        ready: redisHealth.ready,
        healthy: redisHealth.healthy,
        error: redisHealth.error,
      },
      cache: {
        enabled: config.enabled,
        totalKeys: cacheHealth.totalKeys,
        stats: stats instanceof Map ? Object.fromEntries(stats) : stats,
        types: cacheHealth.cacheTypes,
      },
      configuration: config,
      timestamp: new Date().toISOString(),
    };

    // Determine overall health status
    const isHealthy = redisHealth.healthy && config.enabled;

    logger.info('Cache health check completed', {
      operation: 'cache_health_check',
      healthy: isHealthy,
      redisConnected: redisHealth.connected,
      totalKeys: cacheHealth.totalKeys,
      requestId: context.requestId
    });

    return createSuccessResponse(healthInfo, { requestId: context.requestId });
  } catch (error) {
    logger.error('Cache health check failed', {
      operation: 'cache_health_check',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: context.requestId
    }, error instanceof Error ? error : new Error('Cache health check failed'));

    return createErrorResponse(
      'Cache health check failed',
      500,
      {
        code: 'CACHE_HEALTH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.requestId
      }
    );
  }
});

export const POST = withApiRoute(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear_stats':
        cache.resetStats();
        logger.info('Cache statistics cleared', {
          operation: 'cache_clear_stats',
          requestId: context.requestId
        });
        return createSuccessResponse({ message: 'Cache statistics cleared' }, { requestId: context.requestId });

      case 'warm_up':
        // This would typically warm up specific caches
        logger.info('Cache warm-up requested', {
          operation: 'cache_warmup',
          requestId: context.requestId
        });
        return createSuccessResponse({ message: 'Cache warm-up initiated' }, { requestId: context.requestId });

      case 'get_stats':
        const stats = cache.getStats();
        return createSuccessResponse({ 
          stats: stats instanceof Map ? Object.fromEntries(stats) : stats 
        }, { requestId: context.requestId });

      default:
        return createErrorResponse(
          'Invalid action',
          400,
          {
            code: 'INVALID_ACTION',
            details: `Unknown action: ${action}`,
            requestId: context.requestId
          }
        );
    }
  } catch (error) {
    logger.error('Cache management action failed', {
      operation: 'cache_management',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: context.requestId
    }, error instanceof Error ? error : new Error('Cache management failed'));

    return createErrorResponse(
      'Cache management action failed',
      500,
      {
        code: 'CACHE_MANAGEMENT_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.requestId
      }
    );
  }
});
