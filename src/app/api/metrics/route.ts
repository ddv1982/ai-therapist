/**
 * Performance Metrics API Endpoint
 * Exposes performance metrics for monitoring and analytics
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import {
  getMetricsLastN,
  getPerformanceStats,
  getSystemHealth,
  exportMetricsSnapshot,
  MetricType,
} from '@/lib/monitoring/performance-metrics';

/**
 * GET /api/metrics - Get performance metrics
 * Query parameters:
 * - type: Filter by metric type (api_latency, database_query, etc.)
 * - window: Time window in minutes (default: 5)
 * - endpoint: Filter by endpoint name
 * - format: Response format (metrics, stats, health, snapshot)
 */
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const url = new URL(req.url);
    const queryType = url.searchParams.get('type') as MetricType | null;
    const windowRaw = url.searchParams.get('window');
    const window = windowRaw === null ? 5 : Number.parseInt(windowRaw, 10);
    const endpoint = url.searchParams.get('endpoint');
    const format = url.searchParams.get('format') || 'metrics';

    // Validate window parameter
    if (!Number.isFinite(window) || window < 1 || window > 1440) {
      return createErrorResponse('Invalid window parameter', 400, {
        code: 'INVALID_INPUT',
        details: 'Window must be an integer between 1 and 1440 minutes',
        requestId: context.requestId,
      });
    }

    // Get response based on format parameter
    if (format === 'stats') {
      const stats = getPerformanceStats(endpoint || undefined, window);
      return createSuccessResponse(
        { stats, window, generatedAt: new Date() },
        { requestId: context.requestId }
      );
    }

    if (format === 'health') {
      const health = getSystemHealth();
      return createSuccessResponse(
        {
          status: health.warningAlerts === 0 && health.criticalAlerts === 0 ? 'healthy' : 'warning',
          ...health,
          timestamp: new Date(),
        },
        { requestId: context.requestId }
      );
    }

    if (format === 'snapshot') {
      const snapshot = exportMetricsSnapshot();
      return createSuccessResponse(snapshot, { requestId: context.requestId });
    }

    // Default: return raw metrics
    let metrics = getMetricsLastN(window);

    if (queryType) {
      metrics = metrics.filter((m) => m.type === queryType);
    }

    if (endpoint) {
      metrics = metrics.filter((m) => m.endpoint === endpoint);
    }

    return createSuccessResponse(
      {
        count: metrics.length,
        window,
        metrics,
        filters: { type: queryType, endpoint },
      },
      { requestId: context.requestId }
    );
  } catch (error) {
    return createErrorResponse('Failed to retrieve metrics', 500, {
      code: 'INTERNAL_SERVER_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
      requestId: context.requestId,
    });
  }
});
