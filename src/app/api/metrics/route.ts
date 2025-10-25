import { withRateLimitUnauthenticated } from '@/lib/api/api-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { getMetricsSnapshot } from '@/lib/metrics/metrics';
import { env } from '@/config/env';

export const GET = withRateLimitUnauthenticated(async (_request, context) => {
  const enabled = env.ENABLE_METRICS_ENDPOINT || env.NODE_ENV !== 'production';
  if (!enabled) {
    return createErrorResponse('Not found', 404, { requestId: context.requestId });
  }
  const snapshot = getMetricsSnapshot();
  return createSuccessResponse(snapshot, { requestId: context.requestId });
}, { bucket: 'api' });

