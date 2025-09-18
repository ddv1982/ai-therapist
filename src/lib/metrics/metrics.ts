type EndpointKey = string;

interface EndpointStats {
  success: number;
  error: number;
}

const endpointCounters: Map<EndpointKey, EndpointStats> = new Map();
const modelCounters: Map<string, number> = new Map();

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

export function getMetricsSnapshot(): {
  endpoints: Record<string, EndpointStats>;
  models: Record<string, number>;
} {
  return {
    endpoints: Object.fromEntries(endpointCounters.entries()),
    models: Object.fromEntries(modelCounters.entries()),
  };
}


