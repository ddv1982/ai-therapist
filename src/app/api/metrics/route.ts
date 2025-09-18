import { withApiRoute } from '@/lib/api/with-route';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { getMetricsSnapshot } from '@/lib/metrics/metrics';

export const GET = withApiRoute(async (_request, context) => {
  const enabled = process.env.ENABLE_METRICS_ENDPOINT === 'true' || process.env.NODE_ENV !== 'production';
  if (!enabled) {
    return createErrorResponse('Not found', 404, { requestId: context.requestId });
  }
  const snapshot = getMetricsSnapshot();
  return createSuccessResponse(snapshot, { requestId: context.requestId });
});


