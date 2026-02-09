import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { createServerErrorResponse, type ApiResponse } from '@/lib/api/api-response';
import {
  recordEndpointError,
  recordEndpointSuccess,
  recordEndpointLatency,
} from '@/lib/metrics/metrics';
import { toRequestContext, setResponseHeaders } from '@/lib/api/middleware/request-utils';
import type { RequestContext } from '@/lib/api/middleware/types';

export function withApiMiddleware<T = unknown>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const requestContext = toRequestContext(createRequestLogger(request), 'unknown');
    const startHighRes = performance.now();

    try {
      const res = await handler(request, requestContext, routeParams?.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(res, requestContext.requestId, durationMs);
      try {
        recordEndpointLatency(requestContext.method, requestContext.url, durationMs);
      } catch {}

      logger.info('API request completed', {
        requestId: requestContext.requestId,
        url: requestContext.url,
        method: requestContext.method,
        durationMs,
      });

      try {
        recordEndpointSuccess(requestContext.method, requestContext.url);
      } catch {}

      return res;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const requestId = requestContext.requestId || 'unknown';

      logger.apiError(requestContext.url || 'unknown', err, {
        requestId,
        method: requestContext.method,
        userAgent: requestContext.userAgent,
      });

      const response = createServerErrorResponse(err, requestId, requestContext) as NextResponse<
        ApiResponse<T>
      >;
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(response, requestId, durationMs);

      try {
        recordEndpointLatency(requestContext.method, requestContext.url, durationMs);
      } catch {}
      try {
        recordEndpointError(requestContext.method, requestContext.url);
      } catch {}

      return response;
    }
  };
}
