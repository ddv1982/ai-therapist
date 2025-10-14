import { checkDatabaseHealth, prisma } from '@/lib/database/db';
import { withRateLimitUnauthenticated } from '@/lib/api/api-middleware';
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
  details: {
    deduplication: {
      activeRequests: number;
      totalKeys: number;
    };
    circuitBreaker: ReturnType<typeof getCircuitBreakerStatus>['summary'];
  };
}

/**
 * Enhanced database health check
 */
async function checkDatabaseHealthExtended(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const dbHealth = await checkDatabaseHealth();
    const responseTime = Date.now() - start;

    return {
      service: 'database',
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      responseTime,
      details: {
        connection: dbHealth.healthy ? 'connected' : 'failed',
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
    const [config, session] = await Promise.all([
      prisma.authConfig.findFirst({ select: { id: true } }),
      prisma.authSession.findFirst({ select: { id: true } }),
    ]);

    return {
      service: 'authentication',
      status: config ? 'healthy' : 'degraded',
      responseTime: Date.now() - start,
      details: {
        totpConfigured: Boolean(config),
        activeSessionPresent: Boolean(session),
        setupRequired: !config
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
        error: 'Encryption key not configured'
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
        error: 'Primary AI provider not configured'
      };
    }

    return {
      service: 'ai-service',
      status: 'healthy',
      responseTime: Date.now() - start,
      details: {
        providerConfigured: true
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
    const heapUtilization = memoryUsage.heapTotal > 0
      ? (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      : 0;

    const status = heapUtilization > 80 ? 'degraded' : 'healthy';

    return {
      service: 'system-metrics',
      status,
      responseTime: Date.now() - start,
      details: {
        uptimeSeconds: Math.floor(process.uptime()),
        heapUtilization: Math.round(heapUtilization)
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

export const GET = withRateLimitUnauthenticated(async (request, context) => {
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
      details: {
        deduplication: {
          activeRequests: deduplicationStats.activeRequests,
          totalKeys: deduplicationStats.totalKeys,
        },
        circuitBreaker: circuitBreakerStatus.summary,
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
      return createErrorResponse('System health check failed', 503, { requestId: context.requestId });
    } else {
      // Support compact vs verbose modes
      let url: URL | null = null;
      try { url = new URL(request.url); } catch {}
      const verbose = url?.searchParams.get('verbose') === '1';

      if (verbose) {
        return createSuccessResponse(healthResponse, { requestId: context.requestId });
      }

      const minimal = {
        status: healthResponse.status,
        timestamp: healthResponse.timestamp,
        version: healthResponse.version,
        uptime: healthResponse.uptime,
        summary: healthResponse.summary,
        details: healthResponse.details,
      };
      return createSuccessResponse(minimal, { requestId: context.requestId });
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
}, { bucket: 'api' });

/**
 * Liveness probe - simple endpoint to check if the API is responsive
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}