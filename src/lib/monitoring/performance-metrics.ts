/**
 * Performance Metrics Collection
 * Tracks API response times, database query performance, and streaming metrics
 */

import { logger } from '@/lib/utils/logger';

/**
 * Performance metric types
 */
export enum MetricType {
  API_LATENCY = 'api_latency',
  DATABASE_QUERY = 'database_query',
  STREAMING_RESPONSE = 'streaming_response',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  ERROR_RATE = 'error_rate',
}

/**
 * Metric data structure
 */
export interface Metric {
  type: MetricType;
  endpoint?: string;
  operation?: string;
  duration: number; // milliseconds
  timestamp: Date;
  statusCode?: number;
  error?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Performance thresholds for alerting
 */
const PERFORMANCE_THRESHOLDS = {
  API_LATENCY_WARNING: 500, // ms
  API_LATENCY_CRITICAL: 1000, // ms
  DATABASE_QUERY_WARNING: 200, // ms
  DATABASE_QUERY_CRITICAL: 500, // ms
  STREAMING_WARNING: 2000, // ms
  STREAMING_CRITICAL: 5000, // ms
  ERROR_RATE_WARNING: 0.05, // 5%
  ERROR_RATE_CRITICAL: 0.1, // 10%
};

/**
 * In-memory metrics buffer (circular buffer for limited memory usage)
 */
class MetricsBuffer {
  private metrics: Metric[] = [];
  private maxSize = 10000; // Keep last 10k metrics
  private startTime = Date.now();

  add(metric: Metric): void {
    this.metrics.push(metric);

    // Maintain circular buffer
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }
  }

  getMetrics(type?: MetricType): Metric[] {
    if (!type) {
      return [...this.metrics];
    }

    return this.metrics.filter((m) => m.type === type);
  }

  getMetricsSince(minutes: number): Metric[] {
    const since = Date.now() - minutes * 60 * 1000;
    return this.metrics.filter((m) => m.timestamp.getTime() > since);
  }

  clear(): void {
    this.metrics = [];
  }

  getStats(): {
    totalMetrics: number;
    uptime: number;
    metricsPerMinute: number;
  } {
    const uptime = Date.now() - this.startTime;
    const minutes = uptime / 60000;
    return {
      totalMetrics: this.metrics.length,
      uptime,
      metricsPerMinute: this.metrics.length / minutes,
    };
  }
}

const buffer = new MetricsBuffer();

/**
 * Record a performance metric
 */
export function recordMetric(metric: Metric): void {
  buffer.add(metric);

  // Check thresholds and log warnings
  checkThresholds(metric);
}

/**
 * Check if metric exceeds performance thresholds
 */
function checkThresholds(metric: Metric): void {
  switch (metric.type) {
    case MetricType.API_LATENCY: {
      if (metric.duration > PERFORMANCE_THRESHOLDS.API_LATENCY_CRITICAL) {
        logger.warn('API latency critical', {
          endpoint: metric.endpoint,
          duration: metric.duration,
          threshold: PERFORMANCE_THRESHOLDS.API_LATENCY_CRITICAL,
        });
      } else if (metric.duration > PERFORMANCE_THRESHOLDS.API_LATENCY_WARNING) {
        logger.info('API latency warning', {
          endpoint: metric.endpoint,
          duration: metric.duration,
          threshold: PERFORMANCE_THRESHOLDS.API_LATENCY_WARNING,
        });
      }
      break;
    }

    case MetricType.DATABASE_QUERY: {
      if (metric.duration > PERFORMANCE_THRESHOLDS.DATABASE_QUERY_CRITICAL) {
        logger.warn('Database query critical', {
          operation: metric.operation,
          duration: metric.duration,
          threshold: PERFORMANCE_THRESHOLDS.DATABASE_QUERY_CRITICAL,
        });
      } else if (metric.duration > PERFORMANCE_THRESHOLDS.DATABASE_QUERY_WARNING) {
        logger.info('Database query warning', {
          operation: metric.operation,
          duration: metric.duration,
          threshold: PERFORMANCE_THRESHOLDS.DATABASE_QUERY_WARNING,
        });
      }
      break;
    }

    case MetricType.STREAMING_RESPONSE: {
      if (metric.duration > PERFORMANCE_THRESHOLDS.STREAMING_CRITICAL) {
        logger.warn('Streaming response critical', {
          endpoint: metric.endpoint,
          duration: metric.duration,
          threshold: PERFORMANCE_THRESHOLDS.STREAMING_CRITICAL,
        });
      } else if (metric.duration > PERFORMANCE_THRESHOLDS.STREAMING_WARNING) {
        logger.info('Streaming response warning', {
          endpoint: metric.endpoint,
          duration: metric.duration,
          threshold: PERFORMANCE_THRESHOLDS.STREAMING_WARNING,
        });
      }
      break;
    }
  }
}

/**
 * Timer utility for measuring operation duration
 */
export class PerformanceTimer {
  private startTime: number;
  private endpoint?: string;
  private operation?: string;

  constructor(endpoint?: string, operation?: string) {
    this.startTime = Date.now();
    this.endpoint = endpoint;
    this.operation = operation;
  }

  /**
   * End timer and record metric
   */
  end(type: MetricType, metadata?: Record<string, unknown>, statusCode?: number): number {
    const duration = Date.now() - this.startTime;

    recordMetric({
      type,
      endpoint: this.endpoint,
      operation: this.operation,
      duration,
      timestamp: new Date(),
      statusCode,
      metadata,
    });

    return duration;
  }

  /**
   * Get elapsed time without recording
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * API latency tracker middleware
 * Use in API routes to track response times
 */
export function trackApiLatency(
  endpoint: string
): (
  handler: (request: Request, ...args: unknown[]) => Promise<Response>
) => (request: Request, ...args: unknown[]) => Promise<unknown> {
  return (handler: (request: Request, ...args: unknown[]) => Promise<Response>) => {
    return async (request: Request, ...args: unknown[]) => {
      const timer = new PerformanceTimer(endpoint);

      try {
        const response = await handler(request, ...args);
        const status = (response as Response).status || 200;

        timer.end(MetricType.API_LATENCY, { method: request.method }, status);

        return response;
      } catch (error) {
        timer.end(MetricType.API_LATENCY, { method: request.method, error: true }, 500);

        throw error;
      }
    };
  };
}

/**
 * Database query tracker
 * Use in database query functions
 */
export async function trackDatabaseQuery<T>(
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer(undefined, operation);

  try {
    const result = await queryFn();
    timer.end(MetricType.DATABASE_QUERY);
    return result;
  } catch (error) {
    timer.end(MetricType.DATABASE_QUERY, { error: true });
    throw error;
  }
}

/**
 * Get current performance metrics
 */
export function getMetrics(type?: MetricType): Metric[] {
  return buffer.getMetrics(type);
}

/**
 * Get metrics from last N minutes
 */
export function getMetricsLastN(minutes: number): Metric[] {
  return buffer.getMetricsSince(minutes);
}

/**
 * Calculate performance statistics
 */
export interface PerformanceStats {
  endpoint: string;
  requestCount: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  minLatency: number;
  errorCount: number;
  errorRate: number;
  lastUpdated: Date;
}

export function getPerformanceStats(endpoint?: string, minutesWindow = 5): PerformanceStats[] {
  const metrics = buffer
    .getMetricsSince(minutesWindow)
    .filter((m) => m.type === MetricType.API_LATENCY && (!endpoint || m.endpoint === endpoint));

  if (!metrics.length) {
    return [];
  }

  if (endpoint) {
    return [calculateEndpointStats(endpoint, metrics)];
  }

  // Group by endpoint
  const byEndpoint = new Map<string, Metric[]>();

  metrics.forEach((m) => {
    const ep = m.endpoint || 'unknown';
    if (!byEndpoint.has(ep)) {
      byEndpoint.set(ep, []);
    }
    byEndpoint.get(ep)!.push(m);
  });

  return Array.from(byEndpoint.entries()).map(([ep, ms]) => calculateEndpointStats(ep, ms));
}

function calculateEndpointStats(endpoint: string, metrics: Metric[]): PerformanceStats {
  const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
  const errors = metrics.filter((m) => m.error).length;

  return {
    endpoint,
    requestCount: metrics.length,
    avgLatency: durations.reduce((a, b) => a + b, 0) / durations.length,
    p50Latency: durations[Math.floor(durations.length * 0.5)],
    p95Latency: durations[Math.floor(durations.length * 0.95)],
    p99Latency: durations[Math.floor(durations.length * 0.99)],
    maxLatency: Math.max(...durations),
    minLatency: Math.min(...durations),
    errorCount: errors,
    errorRate: errors / metrics.length,
    lastUpdated: new Date(),
  };
}

/**
 * Get overall system health metrics
 */
export interface SystemHealth {
  uptime: number; // milliseconds
  totalMetrics: number;
  metricsPerMinute: number;
  criticalAlerts: number;
  warningAlerts: number;
}

export function getSystemHealth(): SystemHealth {
  const stats = buffer.getStats();
  const allMetrics = buffer.getMetrics();

  // Count critical and warning alerts
  let criticalAlerts = 0;
  let warningAlerts = 0;

  allMetrics.forEach((m) => {
    if (m.type === MetricType.API_LATENCY) {
      if (m.duration > PERFORMANCE_THRESHOLDS.API_LATENCY_CRITICAL) {
        criticalAlerts++;
      } else if (m.duration > PERFORMANCE_THRESHOLDS.API_LATENCY_WARNING) {
        warningAlerts++;
      }
    }
  });

  return {
    uptime: stats.uptime,
    totalMetrics: stats.totalMetrics,
    metricsPerMinute: stats.metricsPerMinute,
    criticalAlerts,
    warningAlerts,
  };
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics(): void {
  buffer.clear();
}

/**
 * Export metrics as JSON for external storage
 */
export function exportMetricsSnapshot(): {
  timestamp: Date;
  metrics: Metric[];
  stats: PerformanceStats[];
  health: SystemHealth;
} {
  return {
    timestamp: new Date(),
    metrics: buffer.getMetrics(),
    stats: getPerformanceStats(),
    health: getSystemHealth(),
  };
}
