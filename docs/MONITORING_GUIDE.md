# Performance Monitoring Guide

Guide for using the performance monitoring system to track, analyze, and improve application performance.

## Overview

The AI Therapist application includes comprehensive performance monitoring that tracks:
- API endpoint response times
- Database query performance
- Streaming response times
- Error rates and patterns
- System health metrics

All metrics are collected in-memory with automatic threshold alerts.

---

## Getting Started

### Accessing Metrics API

All metrics are accessible via the `/api/metrics` endpoint:

```bash
# Get all metrics from last 5 minutes
curl http://localhost:3000/api/metrics

# Get metrics from last 30 minutes
curl http://localhost:3000/api/metrics?window=30

# Get specific metric type
curl http://localhost:3000/api/metrics?type=api_latency

# Get statistics
curl http://localhost:3000/api/metrics?format=stats

# Get system health
curl http://localhost:3000/api/metrics?format=health

# Get full snapshot
curl http://localhost:3000/api/metrics?format=snapshot
```

### Response Format

```json
{
  "success": true,
  "data": {
    "count": 125,
    "window": 5,
    "metrics": [
      {
        "type": "api_latency",
        "endpoint": "/api/chat",
        "duration": 234,
        "timestamp": "2025-10-25T16:30:00.000Z",
        "statusCode": 200,
        "error": false,
        "metadata": {
          "method": "POST"
        }
      }
    ],
    "filters": {
      "type": null,
      "endpoint": null
    }
  },
  "meta": {
    "timestamp": "2025-10-25T16:30:00.000Z",
    "requestId": "req-12345-abcde"
  }
}
```

---

## Monitoring in Code

### Recording API Latency

Use the `trackApiLatency` decorator to automatically measure API endpoint performance:

```typescript
import { trackApiLatency } from '@/lib/monitoring/performance-metrics';

// In your API route
export const GET = trackApiLatency('/api/sessions')(async (req, context) => {
  // Your handler code
  return createSuccessResponse(data);
});
```

### Recording Database Query Performance

```typescript
import { trackDatabaseQuery } from '@/lib/monitoring/performance-metrics';

export async function getUserSessions(userId: string) {
  return trackDatabaseQuery('getUserSessions', async () => {
    const client = getConvexHttpClient();
    return await client.query(anyApi.sessions.listByUser, { userId });
  });
}
```

### Manual Metric Recording

```typescript
import { PerformanceTimer, recordMetric, MetricType } from '@/lib/monitoring/performance-metrics';

// Using timer
const timer = new PerformanceTimer('/api/custom', 'operation');
try {
  // Do work
  const duration = timer.end(MetricType.API_LATENCY);
  console.log(`Operation took ${duration}ms`);
} catch (error) {
  timer.end(MetricType.API_LATENCY, { error: true });
}

// Or record directly
recordMetric({
  type: MetricType.API_LATENCY,
  endpoint: '/api/chat',
  duration: 125,
  timestamp: new Date(),
  statusCode: 200,
  metadata: { model: 'gpt-4' }
});
```

---

## Performance Thresholds

The system automatically alerts when metrics exceed defined thresholds:

| Metric | Warning | Critical |
|--------|---------|----------|
| API Latency | 500ms | 1000ms |
| Database Query | 200ms | 500ms |
| Streaming Response | 2000ms | 5000ms |
| Error Rate | 5% | 10% |

Exceeding thresholds generates log warnings visible in application logs.

---

## Querying Metrics

### Get Metrics by Type

```bash
# All API latency metrics
curl http://localhost:3000/api/metrics?type=api_latency

# Database query metrics
curl http://localhost:3000/api/metrics?type=database_query

# Streaming responses
curl http://localhost:3000/api/metrics?type=streaming_response
```

### Get Metrics for Specific Endpoint

```bash
# Chat endpoint only
curl http://localhost:3000/api/metrics?endpoint=/api/chat

# With statistics
curl http://localhost:3000/api/metrics?endpoint=/api/chat&format=stats
```

### Time Window Options

```bash
# Last 5 minutes (default)
curl http://localhost:3000/api/metrics?window=5

# Last hour
curl http://localhost:3000/api/metrics?window=60

# Last 24 hours
curl http://localhost:3000/api/metrics?window=1440
```

---

## Performance Statistics

Get statistical summaries of endpoint performance:

```bash
curl http://localhost:3000/api/metrics?format=stats
```

Returns:

```json
{
  "data": {
    "stats": [
      {
        "endpoint": "/api/chat",
        "requestCount": 125,
        "avgLatency": 245,
        "p50Latency": 200,
        "p95Latency": 450,
        "p99Latency": 800,
        "maxLatency": 950,
        "minLatency": 50,
        "errorCount": 2,
        "errorRate": 0.016,
        "lastUpdated": "2025-10-25T16:30:00.000Z"
      }
    ],
    "window": 5,
    "generatedAt": "2025-10-25T16:30:00.000Z"
  }
}
```

### Understanding P-percentiles

- **P50 (Median)**: 50% of requests are faster than this
- **P95**: 95% of requests are faster than this (tail latency)
- **P99**: 99% of requests are faster than this (worst-case typical)

### Using Statistics for Analysis

```bash
# Get stats for /api/chat endpoint over last hour
curl "http://localhost:3000/api/metrics?endpoint=/api/chat&window=60&format=stats"

# If P95 > 500ms, endpoint needs optimization
# If errorRate > 0.05 (5%), investigate error causes
# If p99Latency > 1s, check slow query logs
```

---

## System Health

Check overall system health:

```bash
curl http://localhost:3000/api/metrics?format=health
```

Returns:

```json
{
  "data": {
    "status": "healthy",
    "uptime": 3600000,
    "totalMetrics": 5234,
    "metricsPerMinute": 87.2,
    "criticalAlerts": 0,
    "warningAlerts": 3,
    "timestamp": "2025-10-25T16:30:00.000Z"
  }
}
```

### Interpreting Health Status

- **healthy**: No critical alerts, < 3 warning alerts
- **warning**: < 5 critical alerts OR > 3 warning alerts
- **critical**: > 5 critical alerts OR sustained high error rate

---

## Metrics Snapshot

Export full metrics snapshot for analysis or external storage:

```bash
curl http://localhost:3000/api/metrics?format=snapshot > metrics-snapshot.json
```

Useful for:
- Long-term trend analysis
- Capacity planning
- Performance regression detection
- Sharing with performance team

---

## Integration with Monitoring Systems

### Send Metrics to External Service

Create a periodic job to export metrics to your monitoring service:

```typescript
import { exportMetricsSnapshot } from '@/lib/monitoring/performance-metrics';

async function sendMetricsToMonitoring() {
  const snapshot = exportMetricsSnapshot();

  // Send to Datadog, New Relic, Prometheus, etc.
  await fetch('https://api.monitoring-service.com/metrics', {
    method: 'POST',
    body: JSON.stringify(snapshot),
    headers: { 'Authorization': `Bearer ${process.env.MONITORING_API_KEY}` }
  });
}

// Run every 5 minutes
setInterval(sendMetricsToMonitoring, 5 * 60 * 1000);
```

### Prometheus Export Format

```typescript
// Convert to Prometheus format
function toPrometheusFormat(stats) {
  const lines = [];

  stats.forEach(stat => {
    const endpoint = stat.endpoint.replace(/\//g, '_');
    lines.push(`api_latency_p50{endpoint="${endpoint}"} ${stat.p50Latency}`);
    lines.push(`api_latency_p95{endpoint="${endpoint}"} ${stat.p95Latency}`);
    lines.push(`api_requests_total{endpoint="${endpoint}"} ${stat.requestCount}`);
    lines.push(`api_errors_total{endpoint="${endpoint}"} ${stat.errorCount}`);
  });

  return lines.join('\n');
}
```

---

## Troubleshooting Performance

### Identifying Slow Endpoints

```bash
# Get stats and sort by p95 latency
curl http://localhost:3000/api/metrics?format=stats | \
  jq '.data.stats | sort_by(.p95Latency) | reverse'
```

### Analyzing Error Patterns

```bash
# Get metrics with errors in last hour
curl "http://localhost:3000/api/metrics?window=60" | \
  jq '.data.metrics | map(select(.error == true))'
```

### Performance Regression Detection

Compare current performance to historical baseline:

```bash
# Export snapshot for comparison
CURRENT=$(curl http://localhost:3000/api/metrics?format=snapshot)
BASELINE=$(cat baseline-metrics.json)

# Compare P95 latencies
# If current P95 > baseline P95 * 1.2, investigate regression
```

### Database Query Optimization

```bash
# Get slowest queries
curl "http://localhost:3000/api/metrics?type=database_query" | \
  jq '.data.metrics | sort_by(.duration) | reverse | .[0:10]'

# If query > 500ms, optimize:
# 1. Add database indexes
# 2. Reduce returned fields
# 3. Use pagination
# 4. Consider caching
```

---

## Best Practices

### 1. Regular Monitoring

- Check health status daily: `curl http://localhost:3000/api/metrics?format=health`
- Review weekly trends for performance degradation
- Alert on critical thresholds

### 2. Baseline Establishment

```bash
# Establish performance baseline
curl http://localhost:3000/api/metrics?format=snapshot > baseline-metrics.json

# Compare against baseline periodically
# Alert if P95 increases by > 20%
```

### 3. Optimization Process

1. Identify slow endpoints using stats
2. Review request logs for that endpoint
3. Profile database queries
4. Optimize top queries or cache frequently-accessed data
5. Deploy optimization
6. Verify improvement with metrics

### 4. Capacity Planning

Use metrics to forecast infrastructure needs:

```bash
# If metricsPerMinute > 1000 requests/min
# AND avgLatency > 400ms
# Consider scaling
```

### 5. Alerting Configuration

Set up alerts for:
- **Critical**: P95 latency > 1000ms
- **Warning**: Error rate > 5%
- **Info**: Any endpoint > 500ms

---

## API Reference

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | - | Metric type filter |
| `endpoint` | string | - | Endpoint name filter |
| `window` | number | 5 | Time window in minutes (1-1440) |
| `format` | string | metrics | Response format (metrics, stats, health, snapshot) |

### Metric Types

```typescript
enum MetricType {
  API_LATENCY = 'api_latency',
  DATABASE_QUERY = 'database_query',
  STREAMING_RESPONSE = 'streaming_response',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  ERROR_RATE = 'error_rate'
}
```

### Response Objects

See [Metrics API Response Structure](#response-format) and [Statistics Response](#performance-statistics)

---

## Related Documentation

- **Architecture**: See `CLAUDE.md` for system design
- **Error Handling**: See `ERROR_CODES.md` for error tracking
- **Implementation Guide**: See `IMPLEMENTATION_GUIDE.md` for adding metrics to new features

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
