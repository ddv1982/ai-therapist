import { NextRequest, NextResponse } from 'next/server';
import { createRequestContext } from '@/lib/api/logging';
import { authenticateRequest } from '@/lib/api/auth';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import { createAuthenticationErrorResponse, createServerErrorResponse, type ApiResponse } from '@/lib/api/api-response';

type Bucket = 'default' | 'api' | 'chat';

interface WithApiRouteOptions {
  auth?: boolean;
  stream?: boolean;
  rateLimitBucket?: Bucket;
}

export function withApiRoute<T = unknown>(
  handler: (
    request: NextRequest,
    context: { requestId: string; method?: string; url?: string; userAgent?: string; userInfo?: unknown },
  ) => Promise<NextResponse<ApiResponse<T>> | Response>,
  options: WithApiRouteOptions = {}
) {
  const { auth = false, stream = false, rateLimitBucket } = options;

  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>> | Response> => {
    const base = createRequestContext(request);

    try {
      // Optional auth
      let context = { ...base } as { requestId: string; method?: string; url?: string; userAgent?: string; userInfo?: unknown };
      if (auth) {
        const authResult = await authenticateRequest(request);
        if (!authResult.isAuthenticated) {
          return createAuthenticationErrorResponse(authResult.error, base.requestId) as NextResponse<ApiResponse<T>>;
        }
        context = { ...context, userInfo: authResult.userInfo };
      }

      // Optional rate limit
      if (rateLimitBucket) {
        const limiter = getRateLimiter();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || (request as unknown as { ip?: string }).ip || 'unknown';
        const check = (l: { checkRateLimit: (ip: string, bucket: Bucket) => Promise<{ allowed: boolean; retryAfter?: number }> }, address: string, bucket: Bucket) => l.checkRateLimit(address, bucket);
        const result = await check(limiter as unknown as { checkRateLimit: (ip: string, bucket: Bucket) => Promise<{ allowed: boolean; retryAfter?: number }> }, ip, rateLimitBucket);
        if (!result.allowed) {
          const retryAfter = String(result.retryAfter || 60);
          if (stream) {
            const resp = new Response('Rate limit exceeded', { status: 429, headers: { 'Retry-After': retryAfter } });
            try { resp.headers.set('X-Request-Id', base.requestId); } catch {}
            return resp;
          }
          const resp = NextResponse.json({ success: false, error: { message: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }, meta: { timestamp: new Date().toISOString(), requestId: base.requestId } }, { status: 429, headers: { 'Retry-After': retryAfter } });
          return resp as NextResponse<ApiResponse<T>>;
        }
      }

      const response = await handler(request, context);
      try { (response as NextResponse).headers?.set?.('X-Request-Id', base.requestId); } catch {}
      return response;
    } catch (error) {
      if (stream) {
        const resp = new Response(JSON.stringify({ error: (error as Error).message, requestId: base.requestId }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        try { resp.headers.set('X-Request-Id', base.requestId); } catch {}
        return resp;
      }
      return createServerErrorResponse(error as Error, base.requestId, base) as NextResponse<ApiResponse<T>>;
    }
  };
}


