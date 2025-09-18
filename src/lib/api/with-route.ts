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
    // Derive a safe request id regardless of mocking nuances in tests
    const headerGet = (req: unknown, key: string): string | undefined => {
      try {
        const headersLike = (req as { headers?: { get?: (k: string) => string | null } | Map<string, string> }).headers;
        if (!headersLike) return undefined;
        if (headersLike instanceof Map) {
          const value = headersLike.get(key);
          return typeof value === 'string' ? value : undefined;
        }
        if (typeof (headersLike as { get?: (k: string) => string | null }).get === 'function') {
          const value = (headersLike as { get: (k: string) => string | null }).get(key);
          return value === null ? undefined : value;
        }
        return undefined;
      } catch {
        return undefined;
      }
    };
    const requestId = base?.requestId || headerGet(request, 'x-request-id') || headerGet(request, 'X-Request-Id') || 'unknown';

    try {
      // Optional auth
      let context = { ...base } as { requestId: string; method?: string; url?: string; userAgent?: string; userInfo?: unknown };
      if (auth) {
        try {
          const authResult = await authenticateRequest(request);
          if (!authResult.isAuthenticated) {
            return createAuthenticationErrorResponse(authResult.error || 'Authentication required', requestId) as NextResponse<ApiResponse<T>>;
          }
          context = { ...context, userInfo: authResult.userInfo };
        } catch {
          return createAuthenticationErrorResponse('Authentication error', requestId) as NextResponse<ApiResponse<T>>;
        }
      }

      // Optional rate limit
      if (rateLimitBucket) {
        const limiter = getRateLimiter();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || (request as unknown as { ip?: string }).ip || 'unknown';
        const check = (
          l: { checkRateLimit: (ip: string, bucket: Bucket) => Promise<{ allowed: boolean; retryAfter?: number }> },
          address: string,
          bucket: Bucket,
        ) => l.checkRateLimit(address, bucket);
        const result = await check(
          limiter as unknown as { checkRateLimit: (ip: string, bucket: Bucket) => Promise<{ allowed: boolean; retryAfter?: number }> },
          ip,
          rateLimitBucket,
        );
        if (!result.allowed) {
          const retryAfter = String(result.retryAfter || 60);
          if (stream) {
            const resp = new Response('Rate limit exceeded', { status: 429, headers: { 'Retry-After': retryAfter } });
            try { resp.headers.set('X-Request-Id', requestId); } catch {}
            return resp;
          }
          const resp = NextResponse.json(
            {
              success: false,
              error: { message: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
              meta: { timestamp: new Date().toISOString(), requestId },
            },
            { status: 429, headers: { 'Retry-After': retryAfter } },
          );
          return resp as NextResponse<ApiResponse<T>>;
        }
      }

      const response = await handler(request, context);
      try {
        type HeadersWrapper = {
          get?: (k: string) => string | undefined;
          set?: (k: string, v: string) => void;
          entries?: () => IterableIterator<[string, string]>;
        };
        const respObj = response as unknown as { headers?: HeadersWrapper } & Record<string, unknown>;
        // Normalize headers into a consistent wrapper and ensure X-Request-Id is present
        const headerMap = new Map<string, string>();
        if (respObj.headers) {
          try {
            const maybeEntries = respObj.headers.entries?.();
            if (maybeEntries && typeof maybeEntries[Symbol.iterator] === 'function') {
              for (const [key, value] of maybeEntries as Iterable<[string, string]>) {
                headerMap.set(String(key), String(value));
              }
            }
          } catch {}
        }
        const wrappedHeaders: HeadersWrapper = {
          get: (k: string) => headerMap.get(k),
          set: (k: string, v: string) => { headerMap.set(k, String(v)); },
          entries: () => headerMap.entries(),
        };
        wrappedHeaders.set?.('X-Request-Id', requestId);
        wrappedHeaders.set?.('x-request-id', requestId);
        (respObj as { headers?: HeadersWrapper }).headers = wrappedHeaders;
      } catch {}
      return response;
    } catch (error) {
      if (stream) {
        const resp = new Response(JSON.stringify({ error: (error as Error).message, requestId }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        try { resp.headers.set('X-Request-Id', requestId); } catch {}
        return resp;
      }
      const safeContext = base || {};
      return createServerErrorResponse(error as Error, requestId, safeContext) as NextResponse<ApiResponse<T>>;
    }
  };
}


