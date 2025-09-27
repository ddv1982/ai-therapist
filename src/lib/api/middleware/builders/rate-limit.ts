/**
 * Rate limit builder
 *
 * Contract: Wraps a handler with IP-based rate limiting. On limit, returns
 * standardized ApiResponse with 429 and sets `Retry-After`, `X-Request-Id`,
 * and `Server-Timing` headers (the latter two via the core middleware).
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse } from '@/lib/api/api-response';
import type { RequestContext } from '@/lib/api/middleware/factory';

export type WithApiMiddleware = <T = unknown>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    params?: unknown
  ) => Promise<NextResponse<ApiResponse<T>>>
) => (
  request: NextRequest,
  routeParams: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<ApiResponse<T>>>;

export function buildRateLimit(
  deps: {
    withApiMiddleware: WithApiMiddleware;
    getClientIPFromRequest: (req: NextRequest) => string;
    getRateLimiter: () => { checkRateLimit: (ip: string, bucket?: string) => Promise<{ allowed: boolean; retryAfter?: number }> };
  }
) {
  function withRateLimitUnauthenticated<T = unknown>(
    handler: (
      request: NextRequest,
      context: RequestContext,
      params?: unknown
    ) => Promise<NextResponse<ApiResponse<T>>>,
    options: { bucket?: 'api' | 'chat' | 'default'; windowMs?: number } = {}
  ) {
    return deps.withApiMiddleware<T>(async (request, context, params) => {
      const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true' && process.env.NODE_ENV !== 'production';
      if (!rateLimitDisabled) {
        const clientIP = deps.getClientIPFromRequest(request);
        const limiter = deps.getRateLimiter();
        const bucket = options.bucket || 'api';
        const windowMs = Number(
          (bucket === 'chat' ? process.env.CHAT_WINDOW_MS : bucket === 'api' ? process.env.API_WINDOW_MS : process.env.RATE_LIMIT_WINDOW_MS) ??
          options.windowMs ?? 5 * 60 * 1000
        );
        const result = await limiter.checkRateLimit(clientIP, bucket);
        if (!result.allowed) {
          const retryAfter = String(result.retryAfter || Math.ceil(windowMs / 1000));
          const body = {
            success: false,
            error: { message: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED', details: 'Too many requests made in a short period', suggestedAction: 'Please wait a moment before making another request' },
            meta: { timestamp: new Date().toISOString(), requestId: context.requestId }
          } as const;
          const headers = { 'Retry-After': retryAfter } as Record<string, string>;
          return NextResponse.json(body, { status: 429, headers }) as NextResponse<ApiResponse<T>>;
        }
      }
      return handler(request, context, params);
    });
  }

  return { withRateLimitUnauthenticated };
}


