import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import type { z } from 'zod';
import { validateApiAuth } from '@/lib/api/api-auth';
import { validateRequest } from '@/lib/utils/validation';
import { getSingleUserInfo } from '@/lib/auth/user-session';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import {
  createAuthenticationErrorResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
  ApiResponse,
} from '@/lib/api/api-response';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import { recordEndpointError, recordEndpointSuccess, recordEndpointLatency } from '@/lib/metrics/metrics';
import { getClientIPFromRequest, toRequestContext, setResponseHeaders } from '@/lib/api/middleware/request-utils';
import { buildWithAuth, buildWithAuthStreaming } from '@/lib/api/middleware/builders/auth';
import { buildValidation } from '@/lib/api/middleware/builders/validation';
import { buildRateLimit } from '@/lib/api/middleware/builders/rate-limit';
import { buildAuthAndRateLimit } from '@/lib/api/middleware/builders/auth-rate-limit';

export interface RequestContext {
  requestId: string;
  method?: string;
  url?: string;
  userAgent?: string;
  userInfo?: ReturnType<typeof getSingleUserInfo>;
  [key: string]: unknown;
}

export interface AuthenticatedRequestContext extends RequestContext {
  userInfo: ReturnType<typeof getSingleUserInfo>;
}

export interface ApiMiddlewareDeps {
  createRequestLogger: typeof createRequestLogger;
  validateApiAuth: typeof validateApiAuth;
  getRateLimiter: typeof getRateLimiter;
  getSingleUserInfo: typeof getSingleUserInfo;
}

const defaultDeps: ApiMiddlewareDeps = {
  createRequestLogger,
  validateApiAuth,
  getRateLimiter,
  getSingleUserInfo,
};

export function createApiMiddleware(deps: Partial<ApiMiddlewareDeps> = {}) {
  const d: ApiMiddlewareDeps = { ...defaultDeps, ...deps } as ApiMiddlewareDeps;

  const createRequestLoggerLocal = d.createRequestLogger;
  const validateApiAuthLocal = d.validateApiAuth;
  const getRateLimiterLocal = d.getRateLimiter;
  const getSingleUserInfoLocal = d.getSingleUserInfo;

  function withApiMiddleware<T = unknown>(
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
      const requestContext = toRequestContext(createRequestLoggerLocal(request), 'test-request');
      const startHighRes = performance.now();
      try {
        const res = await handler(request, requestContext, routeParams?.params);
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(res, requestContext.requestId, durationMs);
        try { recordEndpointLatency(requestContext.method, requestContext.url, durationMs); } catch {}
        logger.info('API request completed', { requestId: requestContext.requestId, url: requestContext.url, method: requestContext.method, durationMs });
        try { recordEndpointSuccess(requestContext.method, requestContext.url); } catch {}
        return res;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        const rid = requestContext.requestId || 'test-request';
        const resp = createServerErrorResponse(err, rid, requestContext) as NextResponse<ApiResponse<T>>;
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(resp, rid, durationMs);
        try { recordEndpointLatency(requestContext.method, requestContext.url, durationMs); } catch {}
        try { recordEndpointError(requestContext.method, requestContext.url); } catch {}
        return resp;
      }
    };
  }

  const withAuth = buildWithAuth({
    withApiMiddleware,
    validateApiAuth: validateApiAuthLocal,
    getSingleUserInfo: getSingleUserInfoLocal,
  }) as unknown as <T = unknown>(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<NextResponse<ApiResponse<T>>>
  ) => (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse<ApiResponse<T>>>;

  const withAuthStreaming = buildWithAuthStreaming({
    validateApiAuth: validateApiAuthLocal,
    getSingleUserInfo: getSingleUserInfoLocal,
    createRequestLogger: createRequestLoggerLocal,
  }) as unknown as (
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<Response>
  ) => (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ) => Promise<Response>;

  type WithAuthAlias = <T = unknown>(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<NextResponse<ApiResponse<T>>>
  ) => (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse<ApiResponse<T>>>;

  const { withValidation, withValidationAndParams } = buildValidation({
    withAuth: withAuth as WithAuthAlias,
    validateRequest: (<S extends z.ZodSchema>(schema: S, data: unknown) => validateRequest(schema, data)) as <S extends z.ZodSchema>(schema: S, data: unknown) => { success: boolean; data?: z.infer<S>; error?: string },
    createValidationErrorResponse,
    logger,
  });

  const { withRateLimitUnauthenticated } = buildRateLimit({
    withApiMiddleware: withApiMiddleware as <T = unknown>(
      handler: (
        request: NextRequest,
        context: RequestContext,
        params?: unknown
      ) => Promise<NextResponse<ApiResponse<T>>>
    ) => (
      request: NextRequest,
      routeParams: { params: Promise<Record<string, string>> }
    ) => Promise<NextResponse<ApiResponse<T>>>,
    getClientIPFromRequest,
    getRateLimiter: getRateLimiterLocal as unknown as () => { checkRateLimit: (ip: string, bucket?: string) => Promise<{ allowed: boolean; retryAfter?: number }> },
  });

  // Build auth+rate-limit wrappers (regular and streaming) from builder
  const authRateLimitBuilders = buildAuthAndRateLimit({
    toRequestContext,
    createRequestLogger: createRequestLoggerLocal,
    validateApiAuth: validateApiAuthLocal,
    getClientIPFromRequest,
    getRateLimiter: getRateLimiterLocal as unknown as () => { checkRateLimit: (ip: string, bucket?: string) => Promise<{ allowed: boolean; retryAfter?: number }> },
    getSingleUserInfo: getSingleUserInfoLocal,
    recordEndpointError,
    recordEndpointSuccess,
    createAuthenticationErrorResponse,
  });

  const withAuthAndRateLimitStreaming = authRateLimitBuilders.withAuthAndRateLimitStreaming as unknown as (
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<Response>,
    options?: { maxRequests?: number; windowMs?: number; maxConcurrent?: number }
  ) => (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ) => Promise<Response>;

  const withAuthAndRateLimit = authRateLimitBuilders.withAuthAndRateLimit as unknown as <T = unknown>(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<NextResponse<ApiResponse<T>>>,
    options?: { maxRequests?: number; windowMs?: number }
  ) => (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse<ApiResponse<T>>>;

  return {
    withApiMiddleware,
    withAuth,
    withValidation,
    withValidationAndParams,
    withRateLimitUnauthenticated,
    withAuthAndRateLimit,
    withAuthStreaming,
    withAuthAndRateLimitStreaming,
  };
}


