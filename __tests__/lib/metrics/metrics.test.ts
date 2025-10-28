import { getMetricsSnapshot, recordEndpointError, recordEndpointLatency, recordEndpointSuccess, recordModelUsage } from '@/lib/metrics/metrics';

describe('metrics', () => {
  it('records successes and errors per endpoint', () => {
    recordEndpointSuccess('get', '/api/x');
    recordEndpointError('post', '/api/x');
    const snap = getMetricsSnapshot();
    expect(snap.endpoints['GET /api/x']?.success).toBeGreaterThanOrEqual(1);
    expect(snap.endpoints['POST /api/x']?.error).toBeGreaterThanOrEqual(1);
  });

  it('records model usage by id and tool choice', () => {
    recordModelUsage('gpt', 'auto');
    const snap = getMetricsSnapshot();
    expect(snap.models['gpt::auto']).toBeGreaterThanOrEqual(1);
  });

  it('records endpoint latency and trims to 50 samples', () => {
    for (let i = 0; i < 60; i++) recordEndpointLatency('get', '/api/y', i);
    // invalid durations are ignored
    recordEndpointLatency('get', '/api/y', Number.NaN as any);
    const snap = getMetricsSnapshot();
    const y = snap.latency['GET /api/y'];
    expect(y.count).toBeLessThanOrEqual(50);
    expect(y.maxMs).toBeGreaterThan(0);
  });
});
