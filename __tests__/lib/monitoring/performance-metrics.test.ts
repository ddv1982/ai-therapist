import {
  MetricType,
  PerformanceTimer,
  clearMetrics,
  exportMetricsSnapshot,
  getMetrics,
  getMetricsLastN,
  getPerformanceStats,
  getSystemHealth,
  recordMetric,
  trackApiLatency,
  trackDatabaseQuery,
} from '@/lib/monitoring/performance-metrics';

describe('monitoring/performance-metrics', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('records metrics and triggers threshold branches', () => {
    // Below warning (no log branch)
    recordMetric({
      type: MetricType.API_LATENCY,
      endpoint: '/api/a',
      duration: 100,
      timestamp: new Date(),
    });
    // Warning branch
    recordMetric({
      type: MetricType.API_LATENCY,
      endpoint: '/api/a',
      duration: 700,
      timestamp: new Date(),
    });
    // Critical branch
    recordMetric({
      type: MetricType.API_LATENCY,
      endpoint: '/api/a',
      duration: 1500,
      timestamp: new Date(),
    });

    // DB warning and critical
    recordMetric({
      type: MetricType.DATABASE_QUERY,
      operation: 'read',
      duration: 300,
      timestamp: new Date(),
    });
    recordMetric({
      type: MetricType.DATABASE_QUERY,
      operation: 'read',
      duration: 800,
      timestamp: new Date(),
    });

    // Streaming warning and critical
    recordMetric({
      type: MetricType.STREAMING_RESPONSE,
      endpoint: '/api/stream',
      duration: 3000,
      timestamp: new Date(),
    });
    recordMetric({
      type: MetricType.STREAMING_RESPONSE,
      endpoint: '/api/stream',
      duration: 6000,
      timestamp: new Date(),
    });

    const all = getMetrics();
    expect(all.length).toBeGreaterThanOrEqual(7);
  });

  it('PerformanceTimer records elapsed and end()', () => {
    const t = new PerformanceTimer('/api/t');
    expect(t.elapsed()).toBeGreaterThanOrEqual(0);
    const d = t.end(MetricType.API_LATENCY, { method: 'GET' }, 200);
    expect(typeof d).toBe('number');
  });

  it('trackApiLatency wraps handler and records success and error', async () => {
    const okHandler = async () => new Response('ok', { status: 200 });
    const wrappedOk = trackApiLatency('/api/wrap')(okHandler);
    const r1 = await wrappedOk(new Request('http://x', { method: 'GET' }));
    expect((r1 as Response).status).toBe(200);

    const errHandler = async () => {
      throw new Error('boom');
    };
    const wrappedErr = trackApiLatency('/api/wrap')(errHandler as any);
    await expect(wrappedErr(new Request('http://x', { method: 'POST' }))).rejects.toThrow('boom');
  });

  it('trackDatabaseQuery measures both success and error paths', async () => {
    const res = await trackDatabaseQuery('op', async () => 42);
    expect(res).toBe(42);
    await expect(
      trackDatabaseQuery('op', async () => {
        throw new Error('db');
      })
    ).rejects.toThrow('db');
  });

  it('provides metrics since N minutes and aggregated stats', () => {
    // Older than window
    recordMetric({
      type: MetricType.API_LATENCY,
      endpoint: '/api/a',
      duration: 10,
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    });
    // Recent metrics
    for (let i = 0; i < 5; i++) {
      recordMetric({
        type: MetricType.API_LATENCY,
        endpoint: '/api/a',
        duration: 100 + i,
        timestamp: new Date(),
        error: i % 2 === 0,
      });
      recordMetric({
        type: MetricType.API_LATENCY,
        endpoint: '/api/b',
        duration: 200 + i,
        timestamp: new Date(),
        error: false,
      });
    }
    const recent = getMetricsLastN(5);
    expect(recent.length).toBeGreaterThan(0);

    const statsAll = getPerformanceStats();
    const statsA = getPerformanceStats('/api/a');
    expect(statsAll.length).toBeGreaterThanOrEqual(2);
    expect(statsA.length).toBe(1);
    expect(statsA[0].endpoint).toBe('/api/a');
    expect(statsA[0].requestCount).toBeGreaterThan(0);
  });

  it('computes system health and exports snapshot', () => {
    recordMetric({
      type: MetricType.API_LATENCY,
      endpoint: '/api/a',
      duration: 800,
      timestamp: new Date(),
    });
    recordMetric({
      type: MetricType.API_LATENCY,
      endpoint: '/api/a',
      duration: 1200,
      timestamp: new Date(),
    });
    const health = getSystemHealth();
    expect(health.totalMetrics).toBeGreaterThan(0);
    expect(health.warningAlerts + health.criticalAlerts).toBeGreaterThan(0);

    const snap = exportMetricsSnapshot();
    expect(Array.isArray(snap.metrics)).toBe(true);
    expect(Array.isArray(snap.stats)).toBe(true);
    expect(typeof snap.timestamp).toBe('object');
  });
});
