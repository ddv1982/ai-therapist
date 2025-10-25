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
import { env } from '@/config/env';

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
  const inflightCounters: Map<string, { count: number; lastUpdated: number }> = new Map();
  const cleanupIntervalMs = Math.max(env.CHAT_CLEANUP_INTERVAL_MS, 5_000);
  let lastCleanupAt = Date.now();
  let cleanupTimer: NodeJS.Timeout | null = null;
  let cleanupListenersAttached = false;
  const boundListeners: Array<{ event: string; handler: () => void }> = [];

  function cleanupExpiredCounters(now: number, windowMs: number): void {
    streamingCounters.forEach((entry, key) => {
      if (entry.resetTime <= now) {
        streamingCounters.delete(key);
      }
    });
    const inflightExpiryWindow = Math.max(windowMs, 60_000);
    inflightCounters.forEach((entry, key) => {
      if (entry.count <= 0 && entry.lastUpdated + inflightExpiryWindow <= now) {
        inflightCounters.delete(key);
      }
    });
  }

  const scheduleCleanup = () => {
    if (cleanupTimer || typeof setTimeout === 'undefined') return;
    cleanupTimer = setTimeout(() => {
      cleanupTimer = null;
      const now = Date.now();
      cleanupExpiredCounters(now, env.CHAT_WINDOW_MS);
      lastCleanupAt = now;
      scheduleCleanup();
    }, cleanupIntervalMs);
  };
  scheduleCleanup();

  if (!cleanupListenersAttached && typeof process !== 'undefined' && process.on) {
    cleanupListenersAttached = true;
    const clearTimer = () => {
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        cleanupTimer = null;
      }
    };
    const register = (event: string) => {
      const handler = () => {
        clearTimer();
        if (typeof process !== 'undefined' && process?.off) {
          boundListeners.forEach((entry) => process.off(entry.event, entry.handler));
          boundListeners.length = 0;
        }
      };
      process.on(event, handler);
      boundListeners.push({ event, handler });
    };
    register('exit');
    register('SIGINT');
    register('SIGTERM');
  }
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

        const rateLimitDisabled = env.RATE_LIMIT_DISABLED && env.NODE_ENV !== 'production';
        const clientIP = deps.getClientIPFromRequest(request);
        const limiter = deps.getRateLimiter();
        const windowMs = options.windowMs ?? env.API_WINDOW_MS;
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
      const rateLimitDisabled = env.RATE_LIMIT_DISABLED && env.NODE_ENV !== 'production';
      const now = Date.now();
      if (!rateLimitDisabled && now - lastCleanupAt >= cleanupIntervalMs) {
        cleanupExpiredCounters(now, env.CHAT_WINDOW_MS);
        lastCleanupAt = now;
        scheduleCleanup();
      }
      let didIncrement = false;
      try {
        // Early concurrency control
        const clientIPForEarly = deps.getClientIPFromRequest(request);
        const maxConcurrentEarly = _options.maxConcurrent ?? env.CHAT_MAX_CONCURRENCY;
        if (!rateLimitDisabled && env.NODE_ENV !== 'development') {
          const inflightEarly = inflightCounters.get(clientIPForEarly)?.count ?? 0;
          if (inflightEarly >= maxConcurrentEarly) {
            const earlyTooMany = new Response('Too many concurrent requests. Please wait.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(earlyTooMany, baseContext.requestId || 'unknown', durationMs);
            try { deps.recordEndpointError?.(baseContext.method, baseContext.url); } catch {}
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
            const retryAfter = String(globalResult.retryAfter || Math.ceil(env.CHAT_WINDOW_MS / 1000));
            const limited = new Response('Rate limit exceeded. Please try again later.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': retryAfter } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(limited, baseContext.requestId || 'unknown', durationMs);
            try { deps.recordEndpointError?.(baseContext.method, baseContext.url); } catch {}
            return limited;
          }
        }

        const maxRequests = _options.maxRequests ?? env.CHAT_MAX_REQS;
        const windowMs = _options.windowMs ?? env.CHAT_WINDOW_MS;
        const maxConcurrent = _options.maxConcurrent ?? env.CHAT_MAX_CONCURRENCY;
        if (!rateLimitDisabled && env.NODE_ENV !== 'development') {
          const now = Date.now();
          const entry = streamingCounters.get(clientIP);
          if (!entry || now > entry.resetTime) {
            streamingCounters.set(clientIP, { count: 1, resetTime: now + windowMs });
          } else if (entry.count >= maxRequests) {
            const retryAfter = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
            const streamingLimited = new Response('Rate limit exceeded. Please try again later.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': String(retryAfter) } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(streamingLimited, baseContext.requestId || 'unknown', durationMs);
            try { deps.recordEndpointError?.(baseContext.method, baseContext.url); } catch {}
            return streamingLimited;
          } else {
            entry.count++;
          }

          const currentInflight = inflightCounters.get(clientIP)?.count ?? 0;
          if (currentInflight >= maxConcurrent) {
            const tooMany = new Response('Too many concurrent requests. Please wait.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(tooMany, baseContext.requestId || 'unknown', durationMs);
            try { deps.recordEndpointError?.(baseContext.method, baseContext.url); } catch {}
            return tooMany;
          }
          inflightCounters.set(clientIP, { count: currentInflight + 1, lastUpdated: now });
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
            const entry = inflightCounters.get(key);
            if (entry) {
              const nextCount = Math.max(0, entry.count - 1);
              if (nextCount === 0) {
                inflightCounters.set(key, { count: 0, lastUpdated: Date.now() });
              } else {
                inflightCounters.set(key, { count: nextCount, lastUpdated: Date.now() });
              }
            }
          } catch {}
        }
      }
    };
  }

  return { withAuthAndRateLimit, withAuthAndRateLimitStreaming };
}
