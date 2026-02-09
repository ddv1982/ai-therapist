import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import { validateApiAuth } from '@/lib/api/api-auth';
import { resolvePrincipal } from '@/server/application/auth/resolve-principal';
import {
  createAuthenticationErrorResponse,
  createServerErrorResponse,
  type ApiResponse,
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
import { recordEndpointError } from '@/lib/metrics/metrics';
import { withApiMiddleware } from '@/lib/api/middleware/core';
import { buildAuthenticatedContext } from '@/lib/api/middleware/context';
import { createRateLimitResponse } from '@/lib/api/middleware/responses';
import type { AuthenticatedRequestContext, RequestContext } from '@/lib/api/middleware/types';

export function withRateLimitUnauthenticated<T = unknown>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    params?: unknown
  ) => Promise<NextResponse<ApiResponse<T>>>,
  options: { bucket?: 'api' | 'chat' | 'default'; windowMs?: number } = {}
) {
  return withApiMiddleware<T>(async (request, context, params) => {
    const rateLimitDisabled = env.RATE_LIMIT_DISABLED && env.NODE_ENV !== 'production';
    const clientIP = getClientIPFromRequest(request);
    const limiter = getRateLimiter();
    const bucket = options.bucket || 'api';
    const maxRequests =
      bucket === 'chat'
        ? env.CHAT_MAX_REQS
        : bucket === 'api'
          ? env.API_MAX_REQS
          : env.RATE_LIMIT_MAX_REQS;
    const defaultWindow =
      bucket === 'chat'
        ? env.CHAT_WINDOW_MS
        : bucket === 'api'
          ? env.API_WINDOW_MS
          : env.RATE_LIMIT_WINDOW_MS;
    const windowMs = options.windowMs ?? defaultWindow ?? 5 * 60 * 1000;

    if (!rateLimitDisabled) {
      const result = await limiter.checkRateLimit(clientIP, bucket);
      if (!result.allowed) {
        const retryAfter = String(result.retryAfter || Math.ceil(windowMs / 1000));
        return createRateLimitResponse<T>(
          context.requestId,
          'Too many requests made in a short period',
          retryAfter
        );
      }
    }

    const response = await handler(request, context, params);

    try {
      const status = limiter.getStatus(clientIP, bucket);
      setRateLimitHeaders(response, status, maxRequests);
    } catch {}

    return response;
  });
}

export function withAuthAndRateLimit<T = unknown>(
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
    const requestContext = toRequestContext(createRequestLogger(request));
    const startHighRes = performance.now();

    try {
      const authResult = await validateApiAuth();
      const principal = resolvePrincipal(authResult);
      if (!authResult.isValid || !principal) {
        const unauthorized = createAuthenticationErrorResponse(
          authResult.error || 'Authentication required',
          requestContext.requestId
        ) as NextResponse<ApiResponse<T>>;
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(unauthorized, requestContext.requestId, durationMs);
        return unauthorized;
      }

      const rateLimitDisabled = env.RATE_LIMIT_DISABLED && env.NODE_ENV !== 'production';
      const clientIP = getClientIPFromRequest(request);
      const limiter = getRateLimiter();
      const windowMs = options.windowMs ?? env.API_WINDOW_MS;
      if (!rateLimitDisabled) {
        const result = await limiter.checkRateLimit(clientIP, 'api');
        if (!result.allowed) {
          const retryAfter = String(result.retryAfter || Math.ceil(windowMs / 1000));
          const limited = createRateLimitResponse<T>(
            requestContext.requestId,
            'Too many requests made in a short period',
            retryAfter
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(limited, requestContext.requestId, durationMs);
          return limited;
        }
      }

      const authenticatedContext = buildAuthenticatedContext(request, requestContext, authResult);
      const response = await handler(request, authenticatedContext, routeParams?.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(response, authenticatedContext.requestId, durationMs);

      const maxRequests = options.maxRequests ?? env.API_MAX_REQS;
      try {
        const status = limiter.getStatus(clientIP, 'api');
        setRateLimitHeaders(response, status, maxRequests);
      } catch {}

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const response = createServerErrorResponse(
        err,
        requestContext.requestId,
        requestContext
      ) as NextResponse<ApiResponse<T>>;
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(response, requestContext.requestId, durationMs);
      try {
        recordEndpointError(requestContext.method, requestContext.url);
      } catch {}
      return response;
    }
  };
}
