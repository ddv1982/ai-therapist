import { NextRequest } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';
import { withApiMiddleware } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      message: string;
      responseTime?: number;
    };
    api: {
      status: 'healthy';
      message: string;
    };
  };
  uptime: number;
}

export const GET = withApiMiddleware(async (request, context) => {
  const startTime = Date.now();
  
  try {
    // Check database health
    const dbStart = Date.now();
    const dbHealth = await checkDatabaseHealth();
    const dbResponseTime = Date.now() - dbStart;

    // Determine overall health status
    const overallStatus = dbHealth.healthy ? 'healthy' : 'degraded';

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: dbHealth.healthy ? 'healthy' : 'unhealthy',
          message: dbHealth.message,
          responseTime: dbResponseTime,
        },
        api: {
          status: 'healthy',
          message: 'API is responding correctly',
        },
      },
      uptime: process.uptime(),
    };

    // Return appropriate status code based on health
    if (overallStatus === 'healthy') {
      return createSuccessResponse(healthResponse, { requestId: context.requestId });
    } else {
      return createErrorResponse(
        'System health check failed',
        503,
        {
          code: 'HEALTH_CHECK_FAILED',
          details: 'Some system components are not healthy',
          requestId: context.requestId,
        }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown health check error';
    
    const unhealthyResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'unhealthy',
          message: 'Health check failed',
        },
        api: {
          status: 'healthy',
          message: 'API is responding but health check encountered errors',
        },
      },
      uptime: process.uptime(),
    };

    return createErrorResponse(
      'Health check failed',
      503,
      {
        code: 'HEALTH_CHECK_ERROR',
        details: errorMessage,
        requestId: context.requestId,
      }
    );
  }
});

/**
 * Liveness probe - simple endpoint to check if the API is responsive
 */
export async function HEAD(request: NextRequest) {
  return new Response(null, { status: 200 });
}