type EndpointKey = string;

interface EndpointStats {
  success: number;
  error: number;
}

const endpointCounters: Map<EndpointKey, EndpointStats> = new Map();
const modelCounters: Map<string, number> = new Map();
const endpointLatencies: Map<EndpointKey, number[]> = new Map();

function incEndpoint(key: EndpointKey, field: keyof EndpointStats) {
  const current = endpointCounters.get(key) || { success: 0, error: 0 };
  current[field] += 1;
  endpointCounters.set(key, current);
}

export function recordEndpointSuccess(method: string | undefined, url: string | undefined): void {
  const key = `${(method || 'GET').toUpperCase()} ${url || 'unknown'}`;
  incEndpoint(key, 'success');
}

export function recordEndpointError(method: string | undefined, url: string | undefined): void {
  const key = `${(method || 'GET').toUpperCase()} ${url || 'unknown'}`;
  incEndpoint(key, 'error');
}

export function recordModelUsage(modelId: string, toolChoice: string): void {
  const key = `${modelId}::${toolChoice}`;
  modelCounters.set(key, (modelCounters.get(key) || 0) + 1);
}

export function recordEndpointLatency(
  method: string | undefined,
  url: string | undefined,
  durationMs: number | undefined
): void {
  if (!Number.isFinite(durationMs)) return;
  const key = `${(method || 'GET').toUpperCase()} ${url || 'unknown'}`;
  const list = endpointLatencies.get(key) || [];
  list.push(Math.max(0, Number(durationMs)));
  // keep last 50 samples per endpoint to bound memory
  if (list.length > 50) list.splice(0, list.length - 50);
  endpointLatencies.set(key, list);
}

export function getMetricsSnapshot(): {
  endpoints: Record<string, EndpointStats>;
  models: Record<string, number>;
  latency: Record<string, { count: number; avgMs: number; p95Ms: number; maxMs: number }>;
} {
  const latency: Record<string, { count: number; avgMs: number; p95Ms: number; maxMs: number }> =
    {};
  endpointLatencies.forEach((samples, key) => {
    const count = samples.length;
    const sum = samples.reduce((a, b) => a + b, 0);
    const sorted = [...samples].sort((a, b) => a - b);
    const p95Index = Math.max(0, Math.ceil(0.95 * sorted.length) - 1);
    const p95 = sorted.length ? sorted[p95Index] : 0;
    const max = sorted.length ? sorted[sorted.length - 1] : 0;
    latency[key] = {
      count,
      avgMs: count ? Math.round((sum / count) * 100) / 100 : 0,
      p95Ms: Math.round(p95 * 100) / 100,
      maxMs: Math.round(max * 100) / 100,
    };
  });
  return {
    endpoints: Object.fromEntries(endpointCounters.entries()),
    models: Object.fromEntries(modelCounters.entries()),
    latency,
  };
}
