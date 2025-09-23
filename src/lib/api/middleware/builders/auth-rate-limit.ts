/**
 * Auth + Rate Limit builder
 *
 * Contract: Authenticates request, applies global and streaming-specific rate
 * limiting. On limit, returns standardized 429 with `Retry-After`. Always sets
 * `X-Request-Id` and `Server-Timing` headers. Adds `userInfo` to context.
 */
import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import type { ApiResponse } from '@/lib/api/api-response';
import { setResponseHeaders } from '@/lib/api/middleware/request-utils';
import type { RequestContext, AuthenticatedRequestContext } from '@/lib/api/middleware/factory';

export function buildAuthAndRateLimit(
  deps: {
    toRequestContext: (raw: unknown, fallbackId?: string) => RequestContext;
    createRequestLogger: (req: NextRequest) => unknown;
    validateApiAuth: (req: NextRequest) => Promise<{ isValid: boolean; error?: string }>;
    getClientIPFromRequest: (req: NextRequest) => string;
    getRateLimiter: () => { checkRateLimit: (ip: string, bucket?: string) => Promise<{ allowed: boolean; retryAfter?: number }> };
    getSingleUserInfo: (req: NextRequest) => ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo>;
    recordEndpointError?: (method?: string, url?: string) => void;
    recordEndpointSuccess?: (method?: string, url?: string) => void;
    createAuthenticationErrorResponse: (message: string, requestId: string) => NextResponse<ApiResponse>;
  }
) {
  // Per-instance counters for streaming rate limits
  const streamingCounters: Map<string, { count: number; resetTime: number }> = new Map();
  const inflightCounters: Map<string, number> = new Map();
  function withAuthAndRateLimit<T = unknown>(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<NextResponse<ApiResponse<T>>>,
    options: { maxRequests?: number; windowMs?: number } = {}
  ) {
    return async (
      request: NextRequest,
      routeParams: { params: Promise<Record<string, string>> }
    ): Promise<NextResponse<ApiResponse<T>>> => {
      const requestContext = deps.toRequestContext(deps.createRequestLogger(request));
      const startHighRes = performance.now();
      try {
        const authResult = await deps.validateApiAuth(request);
        if (!authResult.isValid) {
          const unauthorized = deps.createAuthenticationErrorResponse(authResult.error || 'Authentication required', requestContext.requestId) as NextResponse<ApiResponse<T>>;
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(unauthorized, requestContext.requestId, durationMs);
          return unauthorized;
        }

        const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
        const clientIP = deps.getClientIPFromRequest(request);
        const limiter = deps.getRateLimiter();
        const windowMs = Number(process.env.API_WINDOW_MS ?? options.windowMs ?? 5 * 60 * 1000);
        if (!rateLimitDisabled) {
          const result = await limiter.checkRateLimit(clientIP, 'api');
          if (!result.allowed) {
            const retryAfter = String(result.retryAfter || Math.ceil(windowMs / 1000));
            const limited = NextResponse.json(
              {
                success: false,
                error: {
                  message: 'Rate limit exceeded',
                  code: 'RATE_LIMIT_EXCEEDED',
                  details: 'Too many requests made in a short period',
                  suggestedAction: 'Please wait a moment before making another request',
                },
                meta: { timestamp: new Date().toISOString(), requestId: requestContext.requestId },
              },
              { status: 429, headers: { 'Retry-After': retryAfter } }
            ) as NextResponse<ApiResponse<T>>;
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(limited, requestContext.requestId, durationMs);
            return limited;
          }
        }

        const userInfo = deps.getSingleUserInfo(request);
        const authenticatedContext: AuthenticatedRequestContext = { ...requestContext, userInfo } as AuthenticatedRequestContext;
        const res = await handler(request, authenticatedContext, routeParams?.params);
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(res, authenticatedContext.requestId, durationMs);
        return res;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        const resp = NextResponse.json({ success: false, error: { message: err.message } }, { status: 500 }) as NextResponse<ApiResponse<T>>;
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(resp, requestContext.requestId, durationMs);
        return resp;
      }
    };
  }

  function withAuthAndRateLimitStreaming(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<Response>,
    _options: { maxRequests?: number; windowMs?: number; maxConcurrent?: number } = {}
  ) {
    return async (
      request: NextRequest,
      routeParams: { params: Promise<Record<string, string>> }
    ): Promise<Response> => {
      const baseContext = deps.toRequestContext(deps.createRequestLogger(request));
      const startHighRes = performance.now();
      const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
      let didIncrement = false;
      try {
        // Early concurrency control
        const clientIPForEarly = deps.getClientIPFromRequest(request);
        const maxConcurrentEarly = (process.env.CHAT_MAX_CONCURRENCY !== undefined)
          ? Number(process.env.CHAT_MAX_CONCURRENCY)
          : (_options.maxConcurrent ?? 2);
        if (!rateLimitDisabled && process.env.NODE_ENV !== 'development') {
          const inflightEarly = inflightCounters.get(clientIPForEarly) || 0;
          if (inflightEarly >= maxConcurrentEarly) {
            const earlyTooMany = new Response('Too many concurrent requests. Please wait.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(earlyTooMany, baseContext.requestId || 'unknown', durationMs);
            return earlyTooMany;
          }
        }

        const authResult = await deps.validateApiAuth(request);
        if (!authResult.isValid) {
          const unauthorized = new Response(
            JSON.stringify({ error: authResult.error || 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(unauthorized, baseContext.requestId || 'unknown', durationMs);
          return unauthorized;
        }

        const clientIP = deps.getClientIPFromRequest(request);
        if (!rateLimitDisabled) {
          const limiter = deps.getRateLimiter();
          const globalResult = await limiter.checkRateLimit(clientIP, 'chat');
          if (!globalResult.allowed) {
            const retryAfter = String(globalResult.retryAfter || Math.ceil(5 * 60));
            const limited = new Response('Rate limit exceeded. Please try again later.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': retryAfter } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(limited, baseContext.requestId || 'unknown', durationMs);
            try { deps.recordEndpointError?.(baseContext.method, baseContext.url); } catch {}
            return limited;
          }
        }

        const maxRequests = (process.env.CHAT_MAX_REQS !== undefined) ? Number(process.env.CHAT_MAX_REQS) : (_options.maxRequests ?? 120);
        const windowMs = (process.env.CHAT_WINDOW_MS !== undefined) ? Number(process.env.CHAT_WINDOW_MS) : (_options.windowMs ?? 5 * 60 * 1000);
        const maxConcurrent = (process.env.CHAT_MAX_CONCURRENCY !== undefined) ? Number(process.env.CHAT_MAX_CONCURRENCY) : (_options.maxConcurrent ?? 2);
        if (!rateLimitDisabled && process.env.NODE_ENV !== 'development') {
          const now = Date.now();
          const entry = streamingCounters.get(clientIP);
          if (!entry || now > entry.resetTime) {
            streamingCounters.set(clientIP, { count: 1, resetTime: now + windowMs });
          } else if (entry.count >= maxRequests) {
            const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
            return new Response('Rate limit exceeded. Please try again later.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': String(Math.max(retryAfter, 1)) } });
          } else {
            entry.count++;
          }

          const currentInflight = inflightCounters.get(clientIP) || 0;
          if (currentInflight >= maxConcurrent) {
            const tooMany = new Response('Too many concurrent requests. Please wait.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(tooMany, baseContext.requestId || 'unknown', durationMs);
            return tooMany;
          }
          inflightCounters.set(clientIP, currentInflight + 1);
          didIncrement = true;
        }

        const userInfo = deps.getSingleUserInfo(request);
        const authenticatedContext: AuthenticatedRequestContext = {
          requestId: baseContext.requestId || 'unknown',
          method: baseContext.method,
          url: baseContext.url,
          userAgent: baseContext.userAgent,
          userInfo,
        } as const;
        const response = await handler(request, authenticatedContext, routeParams?.params);
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(response, authenticatedContext.requestId, durationMs);
        try { deps.recordEndpointSuccess?.(authenticatedContext.method, authenticatedContext.url); } catch {}
        return response;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        const resp = new Response(
          JSON.stringify({ error: err.message, requestId: baseContext.requestId || 'unknown' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(resp, baseContext.requestId || 'unknown', durationMs);
        try { deps.recordEndpointError?.(baseContext.method, baseContext.url); } catch {}
        return resp;
      } finally {
        if (!rateLimitDisabled && didIncrement) {
          try {
            const key = deps.getClientIPFromRequest(request);
            const current = inflightCounters.get(key) || 0;
            if (current > 0) inflightCounters.set(key, current - 1);
          } catch {}
        }
      }
    };
  }

  return { withAuthAndRateLimit, withAuthAndRateLimitStreaming };
}


