import { NextRequest } from 'next/server';
import { performance } from 'node:perf_hooks';
import { validateApiAuth } from '@/lib/api/api-auth';
import { resolvePrincipal } from '@/server/application/auth/resolve-principal';
import {
  createAuthenticationErrorResponse,
  createServerErrorResponse,
} from '@/lib/api/api-response';
import { env } from '@/config/env';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import {
  getClientIPFromRequest,
  toRequestContext,
  setResponseHeaders,
  setRateLimitHeaders,
} from '@/lib/api/middleware/request-utils';
import { createRequestLogger } from '@/lib/utils/logger';
import { recordEndpointError, recordEndpointSuccess } from '@/lib/metrics/metrics';
import { buildAuthenticatedContext } from '@/lib/api/middleware/context';
import { createRateLimitResponse } from '@/lib/api/middleware/responses';
import type { AuthenticatedRequestContext } from '@/lib/api/middleware/types';

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

export function withAuthAndRateLimitStreaming(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<Response>,
  options: { maxRequests?: number; windowMs?: number; maxConcurrent?: number } = {}
) {
  return async (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ): Promise<Response> => {
    const baseContext = toRequestContext(createRequestLogger(request));
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
      const clientIPForEarly = getClientIPFromRequest(request);
      const maxConcurrentEarly = options.maxConcurrent ?? env.CHAT_MAX_CONCURRENCY;
      if (!rateLimitDisabled && env.NODE_ENV !== 'development') {
        const inflightEarly = inflightCounters.get(clientIPForEarly)?.count ?? 0;
        if (inflightEarly >= maxConcurrentEarly) {
          const earlyTooMany = createRateLimitResponse<unknown>(
            baseContext.requestId || 'unknown',
            'Too many concurrent requests. Please wait.',
            '1'
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(earlyTooMany, baseContext.requestId || 'unknown', durationMs);
          try {
            recordEndpointError(baseContext.method, baseContext.url);
          } catch {}
          return earlyTooMany;
        }
      }

      const authResult = await validateApiAuth();
      const principal = resolvePrincipal(authResult);
      if (!authResult.isValid || !principal) {
        const unauthorized = createAuthenticationErrorResponse(
          authResult.error || 'Authentication required',
          baseContext.requestId
        );
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(unauthorized, baseContext.requestId || 'unknown', durationMs);
        return unauthorized;
      }

      const clientIP = getClientIPFromRequest(request);
      if (!rateLimitDisabled) {
        const limiter = getRateLimiter();
        const globalResult = await limiter.checkRateLimit(clientIP, 'chat');
        if (!globalResult.allowed) {
          const retryAfter = String(
            globalResult.retryAfter || Math.ceil(env.CHAT_WINDOW_MS / 1000)
          );
          const limited = createRateLimitResponse<unknown>(
            baseContext.requestId || 'unknown',
            'Too many requests made in a short period',
            retryAfter
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(limited, baseContext.requestId || 'unknown', durationMs);
          try {
            recordEndpointError(baseContext.method, baseContext.url);
          } catch {}
          return limited;
        }
      }

      const maxRequests = options.maxRequests ?? env.CHAT_MAX_REQS;
      const windowMs = options.windowMs ?? env.CHAT_WINDOW_MS;
      const maxConcurrent = options.maxConcurrent ?? env.CHAT_MAX_CONCURRENCY;

      if (!rateLimitDisabled && env.NODE_ENV !== 'development') {
        const currentTime = Date.now();
        const entry = streamingCounters.get(clientIP);

        if (!entry || currentTime > entry.resetTime) {
          streamingCounters.set(clientIP, { count: 1, resetTime: currentTime + windowMs });
        } else if (entry.count >= maxRequests) {
          const retryAfter = Math.max(1, Math.ceil((entry.resetTime - currentTime) / 1000));
          const streamingLimited = createRateLimitResponse<unknown>(
            baseContext.requestId || 'unknown',
            'Too many requests made in a short period',
            String(retryAfter)
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(streamingLimited, baseContext.requestId || 'unknown', durationMs);
          try {
            recordEndpointError(baseContext.method, baseContext.url);
          } catch {}
          return streamingLimited;
        } else {
          entry.count++;
        }

        const currentInflight = inflightCounters.get(clientIP)?.count ?? 0;
        if (currentInflight >= maxConcurrent) {
          const tooMany = createRateLimitResponse<unknown>(
            baseContext.requestId || 'unknown',
            'Too many concurrent requests. Please wait.',
            '1'
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(tooMany, baseContext.requestId || 'unknown', durationMs);
          try {
            recordEndpointError(baseContext.method, baseContext.url);
          } catch {}
          return tooMany;
        }

        inflightCounters.set(clientIP, { count: currentInflight + 1, lastUpdated: currentTime });
        didIncrement = true;
      }

      const authenticatedContext = buildAuthenticatedContext(
        request,
        {
          requestId: baseContext.requestId || 'unknown',
          method: baseContext.method,
          url: baseContext.url,
          userAgent: baseContext.userAgent,
        },
        authResult
      );

      const response = await handler(request, authenticatedContext, routeParams?.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(response, authenticatedContext.requestId, durationMs);

      const limiter = getRateLimiter();
      try {
        const status = limiter.getStatus(clientIP, 'chat');
        setRateLimitHeaders(response, status, maxRequests);
      } catch {}

      try {
        recordEndpointSuccess(authenticatedContext.method, authenticatedContext.url);
      } catch {}

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const response = createServerErrorResponse(
        err,
        baseContext.requestId || 'unknown',
        baseContext
      );
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(response, baseContext.requestId || 'unknown', durationMs);
      try {
        recordEndpointError(baseContext.method, baseContext.url);
      } catch {}
      return response;
    } finally {
      if (!rateLimitDisabled && didIncrement) {
        try {
          const key = getClientIPFromRequest(request);
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
