import { checkDatabaseHealth, prisma } from '@/lib/database/db';
import { withApiRoute } from '@/lib/api/with-route';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { getCircuitBreakerStatus } from '@/lib/utils/graceful-degradation';
import { getDeduplicationStats } from '@/lib/utils/request-deduplication';
import { logger } from '@/lib/utils/logger';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  performance: {
    deduplication: ReturnType<typeof getDeduplicationStats>;
    circuitBreaker: ReturnType<typeof getCircuitBreakerStatus>;
  };
}

/**
 * Enhanced database health check
 */
async function checkDatabaseHealthExtended(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const dbHealth = await checkDatabaseHealth();
    
    // Additional checks for tables and data
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const authConfigCount = await prisma.authConfig.count();
    
    const responseTime = Date.now() - start;
    
    return {
      service: 'database',
      status: dbHealth.healthy && responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      details: {
        connection: dbHealth.healthy ? 'connected' : 'failed',
        userCount,
        sessionCount,
        authConfigured: authConfigCount > 0,
        queryTime: `${responseTime}ms`,
        message: dbHealth.message
      }
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * Check authentication system health
 */
async function checkAuthentication(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const configCount = await prisma.authConfig.count();
    const deviceCount = await prisma.trustedDevice.count();
    const sessionCount = await prisma.authSession.count();
    
    return {
      service: 'authentication',
      status: 'healthy',
      responseTime: Date.now() - start,
      details: {
        totpConfigured: configCount > 0,
        trustedDevices: deviceCount,
        activeSessions: sessionCount,
        setupRequired: configCount === 0
      }
    };
  } catch (error) {
    return {
      service: 'authentication',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Auth system check failed'
    };
  }
}

/**
 * Check encryption configuration
 */
async function checkEncryption(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;
    
    if (!hasEncryptionKey) {
      return {
        service: 'encryption',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: 'ENCRYPTION_KEY environment variable not set'
      };
    }

    const keyLength = process.env.ENCRYPTION_KEY?.length || 0;
    const hasValidKeyLength = keyLength >= 32;
    
    return {
      service: 'encryption',
      status: hasValidKeyLength ? 'healthy' : 'degraded',
      responseTime: Date.now() - start,
      details: {
        keyConfigured: true,
        keyLength: keyLength >= 32 ? 'adequate' : 'too_short',
        recommendation: !hasValidKeyLength ? 'Use a 32+ character encryption key' : undefined
      }
    };
  } catch (error) {
    return {
      service: 'encryption',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Encryption check failed'
    };
  }
}

/**
 * Check AI service configuration
 */
async function checkAIService(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const hasGroqKey = !!process.env.GROQ_API_KEY;
    
    if (!hasGroqKey) {
      return {
        service: 'ai-service',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: 'GROQ_API_KEY environment variable not set'
      };
    }

    return {
      service: 'ai-service',
      status: 'healthy',
      responseTime: Date.now() - start,
      details: {
        provider: 'groq',
        keyConfigured: true,
        note: 'API key present (full connectivity requires actual API call)'
      }
    };
  } catch (error) {
    return {
      service: 'ai-service',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'AI service check failed'
    };
  }
}

/**
 * Check system metrics and performance
 */
function checkSystemMetrics(): HealthCheck {
  const start = Date.now();
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const heapUtilization = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    // Consider degraded if heap utilization > 80% or heap > 512MB
    const status = (heapUtilization > 80 || heapTotalMB > 512) ? 'degraded' : 'healthy';
    
    return {
      service: 'system-metrics',
      status,
      responseTime: Date.now() - start,
      details: {
        uptime: `${Math.floor(process.uptime())} seconds`,
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapUtilization: `${Math.round(heapUtilization)}%`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
      }
    };
  } catch (error) {
    return {
      service: 'system-metrics',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'System metrics check failed'
    };
  }
}

export const GET = withApiRoute(async (_request, context) => {
  try {
    logger.debug('Comprehensive health check requested', { requestId: context.requestId });
    
    // Run all health checks in parallel for faster response
    const checks = await Promise.all([
      checkDatabaseHealthExtended(),
      checkAuthentication(),
      checkEncryption(),
      checkAIService(),
      Promise.resolve(checkSystemMetrics())
    ]);
    
    // Calculate overall health status
    const healthyCounts = checks.filter(c => c.status === 'healthy').length;
    const degradedCounts = checks.filter(c => c.status === 'degraded').length;
    const unhealthyCounts = checks.filter(c => c.status === 'unhealthy').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCounts > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCounts > 0) {
      overallStatus = 'degraded';
    }
    
    // Get performance metrics
    const deduplicationStats = getDeduplicationStats();
    const circuitBreakerStatus = getCircuitBreakerStatus();
    
    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks,
      summary: {
        total: checks.length,
        healthy: healthyCounts,
        degraded: degradedCounts,
        unhealthy: unhealthyCounts
      },
      performance: {
        deduplication: deduplicationStats,
        circuitBreaker: circuitBreakerStatus
      }
    };
    
    logger.info('Health check completed', {
      requestId: context.requestId,
      overallStatus,
      healthy: healthyCounts,
      degraded: degradedCounts,
      unhealthy: unhealthyCounts
    });
    
    // Return appropriate status based on health
    if (overallStatus === 'unhealthy') {
      return createErrorResponse(
        'System health check failed',
        503,
        {
          code: 'HEALTH_CHECK_FAILED',
          details: `${unhealthyCounts} services unhealthy, ${degradedCounts} degraded`,
          requestId: context.requestId,
        }
      );
    } else {
      return createSuccessResponse(healthResponse, { requestId: context.requestId });
    }
    
  } catch (error) {
    logger.error('Health check failed', {
      requestId: context.requestId,
      error: error instanceof Error ? error.message : 'Unknown health check error'
    });
    
    return createErrorResponse(
      'Health check failed',
      500,
      { requestId: context.requestId }
    );
  }
});

/**
 * Liveness probe - simple endpoint to check if the API is responsive
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}