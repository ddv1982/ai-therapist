import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import { z } from 'zod';
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
import { recordEndpointError, recordEndpointSuccess } from '@/lib/metrics/metrics';
import { getClientIPFromRequest, toRequestContext, setResponseHeaders } from '@/lib/api/middleware/request-utils';

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
        logger.info('API request completed', { requestId: requestContext.requestId, url: requestContext.url, method: requestContext.method, durationMs });
        try { recordEndpointSuccess(requestContext.method, requestContext.url); } catch {}
        return res;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        const rid = requestContext.requestId || 'test-request';
        const resp = createServerErrorResponse(err, rid, requestContext) as NextResponse<ApiResponse<T>>;
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(resp, rid, durationMs);
        try { recordEndpointError(requestContext.method, requestContext.url); } catch {}
        return resp;
      }
    };
  }

  function withAuth<T = unknown>(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<NextResponse<ApiResponse<T>>>
  ) {
    return withApiMiddleware(async (request, baseContext, params) => {
      const authResult = await validateApiAuthLocal(request);
      if (!authResult.isValid) {
        logger.warn('Unauthorized request', { ...baseContext, error: authResult.error });
        const unauthorized = createAuthenticationErrorResponse(
          authResult.error || 'Authentication required',
          baseContext.requestId
        );
        setResponseHeaders(unauthorized, baseContext.requestId);
        return unauthorized;
      }

      const userInfo = (() => { try { return getSingleUserInfoLocal(request); } catch { return undefined as unknown as ReturnType<typeof getSingleUserInfo>; } })();
      const authenticatedContext: AuthenticatedRequestContext = {
        ...baseContext,
        userInfo: (userInfo as ReturnType<typeof getSingleUserInfo>) || ({ userId: 'unknown' } as ReturnType<typeof getSingleUserInfo>),
      };
      logger.info('Authenticated request', { ...baseContext, userId: (userInfo as { userId?: string } | undefined)?.userId });

      const res = await handler(request, authenticatedContext, params);
      setResponseHeaders(res, authenticatedContext.requestId);
      return res;
    });
  }

  function withAuthStreaming(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<Response>
  ) {
    return async (
      request: NextRequest,
      routeParams: { params: Promise<Record<string, string>> }
    ): Promise<Response> => {
      const baseContext = toRequestContext(createRequestLoggerLocal(request));
      const startHighRes = performance.now();
      try {
        const authResult = await validateApiAuthLocal(request);
        if (!authResult.isValid) {
          logger.warn('Unauthorized request', { requestId: baseContext.requestId || 'unknown', method: baseContext.method, url: baseContext.url, error: authResult.error });
          const unauthorized = new Response(
            JSON.stringify({ error: authResult.error || 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(unauthorized, baseContext.requestId || 'unknown', durationMs);
          return unauthorized;
        }
        const userInfo = getSingleUserInfoLocal(request);
        const authenticatedContext: AuthenticatedRequestContext = {
          requestId: baseContext.requestId || 'unknown',
          method: baseContext.method,
          url: baseContext.url,
          userAgent: baseContext.userAgent,
          userInfo,
        };
        const res = await handler(request, authenticatedContext, routeParams.params);
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(res, authenticatedContext.requestId, durationMs);
        try { recordEndpointSuccess(authenticatedContext.method, authenticatedContext.url); } catch {}
        return res;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        const resp = new Response(
          JSON.stringify({ error: err.message, requestId: baseContext.requestId || 'unknown' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(resp, baseContext.requestId || 'unknown', durationMs);
        try { recordEndpointError(baseContext.method, baseContext.url); } catch {}
        return resp;
      }
    };
  }

  // Per-instance counters for streaming rate limits
  const streamingCounters: Map<string, { count: number; resetTime: number }> = new Map();
  const inflightCounters: Map<string, number> = new Map();

  function withAuthAndRateLimitStreaming(
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
      const baseContext = toRequestContext(createRequestLoggerLocal(request));
      const startHighRes = performance.now();
      const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
      let didIncrement = false;
      try {
        // Early concurrency control
        const clientIPForEarly = getClientIPFromRequest(request);
        const maxConcurrentEarly = (process.env.CHAT_MAX_CONCURRENCY !== undefined)
          ? Number(process.env.CHAT_MAX_CONCURRENCY)
          : (options.maxConcurrent ?? 2);
        if (!rateLimitDisabled && process.env.NODE_ENV !== 'development') {
          const inflightEarly = inflightCounters.get(clientIPForEarly) || 0;
          if (inflightEarly >= maxConcurrentEarly) {
            const earlyTooMany = new Response('Too many concurrent requests. Please wait.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(earlyTooMany, baseContext.requestId || 'unknown', durationMs);
            return earlyTooMany;
          }
        }

        const authResult = await validateApiAuthLocal(request);
        if (!authResult.isValid) {
          const unauthorized = new Response(
            JSON.stringify({ error: authResult.error || 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(unauthorized, baseContext.requestId || 'unknown', durationMs);
          return unauthorized;
        }

        const clientIP = getClientIPFromRequest(request);
        if (!rateLimitDisabled) {
          const limiter = getRateLimiterLocal();
          const globalResult = await limiter.checkRateLimit(clientIP, 'chat');
          if (!globalResult.allowed) {
            const retryAfter = String(globalResult.retryAfter || Math.ceil(5 * 60));
            const limited = new Response('Rate limit exceeded. Please try again later.', { status: 429, headers: { 'Content-Type': 'text/plain', 'Retry-After': retryAfter } });
            const durationMs = Math.round(performance.now() - startHighRes);
            setResponseHeaders(limited, baseContext.requestId || 'unknown', durationMs);
            try { recordEndpointError(baseContext.method, baseContext.url); } catch {}
            return limited;
          }
        }

        const maxRequests = (process.env.CHAT_MAX_REQS !== undefined) ? Number(process.env.CHAT_MAX_REQS) : (options.maxRequests ?? 120);
        const windowMs = (process.env.CHAT_WINDOW_MS !== undefined) ? Number(process.env.CHAT_WINDOW_MS) : (options.windowMs ?? 5 * 60 * 1000);
        const maxConcurrent = (process.env.CHAT_MAX_CONCURRENCY !== undefined) ? Number(process.env.CHAT_MAX_CONCURRENCY) : (options.maxConcurrent ?? 2);
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

        const userInfo = getSingleUserInfoLocal(request);
        const authenticatedContext: AuthenticatedRequestContext = {
          requestId: baseContext.requestId || 'unknown',
          method: baseContext.method,
          url: baseContext.url,
          userAgent: baseContext.userAgent,
          userInfo,
        };
        const response = await handler(request, authenticatedContext, routeParams?.params);
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(response, authenticatedContext.requestId, durationMs);
        try { recordEndpointSuccess(authenticatedContext.method, authenticatedContext.url); } catch {}
        return response;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        const resp = new Response(
          JSON.stringify({ error: err.message, requestId: baseContext.requestId || 'unknown' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(resp, baseContext.requestId || 'unknown', durationMs);
        try { recordEndpointError(baseContext.method as string | undefined, baseContext.url as string | undefined); } catch {}
        return resp;
      } finally {
        if (!rateLimitDisabled && didIncrement) {
          try {
            const key = getClientIPFromRequest(request);
            const current = inflightCounters.get(key) || 0;
            if (current > 0) inflightCounters.set(key, current - 1);
          } catch {}
        }
      }
    };
  }

  function withValidation<TSchema extends z.ZodSchema, TResponse = unknown>(
    schema: TSchema,
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      validatedData: z.infer<TSchema>,
      params?: unknown
    ) => Promise<NextResponse<ApiResponse<TResponse>>>
  ) {
    return withAuth<TResponse>(async (request, context, params?) => {
      let requestData: unknown;
      try {
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            requestData = await (request as NextRequest).json();
          } catch {
            logger.validationError(context.url || 'unknown', 'Invalid JSON in request body', context);
            return createValidationErrorResponse('Invalid JSON format in request body', context.requestId) as NextResponse<ApiResponse<TResponse>>;
          }
        } else {
          const { searchParams } = new URL((request as { url: string }).url);
          requestData = Object.fromEntries(searchParams.entries());
        }
      } catch {
        logger.validationError(context.url || 'unknown', 'Invalid request data', context);
        return createValidationErrorResponse('Invalid request data', context.requestId) as NextResponse<ApiResponse<TResponse>>;
      }

      const validation = validateRequest(schema, requestData);
      if (!validation.success) {
        logger.validationError(context.url || 'unknown', validation.error, context);
        return createValidationErrorResponse(validation.error, context.requestId) as NextResponse<ApiResponse<TResponse>>;
      }

      return handler(request, context, validation.data as z.infer<TSchema>, params);
    });
  }

  function withValidationAndParams<TSchema extends z.ZodSchema, TResponse = unknown>(
    schema: TSchema,
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      validatedData: z.infer<TSchema>,
      params: Record<string, string>
    ) => Promise<NextResponse<ApiResponse<TResponse>>>
  ) {
    return (request: NextRequest, routeParams: { params: Promise<Record<string, string>> }) => {
      return withValidation(schema, async (req, ctx, data) => {
        const params = await routeParams.params;
        return handler(req, ctx, data, params);
      })(request, routeParams);
    };
  }

  function withRateLimitUnauthenticated<T = unknown>(
    handler: (
      request: NextRequest,
      context: RequestContext,
      params?: unknown
    ) => Promise<NextResponse<ApiResponse<T>>>,
    options: { bucket?: 'api' | 'chat' | 'default'; windowMs?: number } = {}
  ) {
    return withApiMiddleware<T>(async (request, context, params) => {
      const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
      if (!rateLimitDisabled) {
        const clientIP = getClientIPFromRequest(request);
        const limiter = getRateLimiterLocal();
        const bucket = options.bucket || 'api';
        const windowMs = Number(
          (bucket === 'chat' ? process.env.CHAT_WINDOW_MS : bucket === 'api' ? process.env.API_WINDOW_MS : process.env.RATE_LIMIT_WINDOW_MS) ??
          options.windowMs ?? 5 * 60 * 1000
        );
        const result = await limiter.checkRateLimit(clientIP, bucket);
        if (!result.allowed) {
          const retryAfter = String(result.retryAfter || Math.ceil(windowMs / 1000));
          return NextResponse.json(
            {
              success: false,
              error: {
                message: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                details: 'Too many requests made in a short period',
                suggestedAction: 'Please wait a moment before making another request',
              },
              meta: { timestamp: new Date().toISOString(), requestId: context.requestId },
            },
            { status: 429, headers: { 'Retry-After': retryAfter } }
          ) as NextResponse<ApiResponse<T>>;
        }
      }
      return handler(request, context, params);
    });
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
      const requestContext = toRequestContext(createRequestLoggerLocal(request));
      const startHighRes = performance.now();
      try {
        const authResult = await validateApiAuthLocal(request);
        if (!authResult.isValid) {
          logger.warn('Unauthorized request', { ...requestContext, error: authResult.error });
          const unauthorized = createAuthenticationErrorResponse(authResult.error || 'Authentication required', requestContext.requestId) as NextResponse<ApiResponse<T>>;
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(unauthorized, requestContext.requestId, durationMs);
          return unauthorized;
        }

        const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
        const clientIP = getClientIPFromRequest(request);
        const limiter = getRateLimiterLocal();
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

        const userInfo = getSingleUserInfoLocal(request);
        const authenticatedContext: AuthenticatedRequestContext = { ...requestContext, userInfo };
        const res = await handler(request, authenticatedContext, routeParams?.params);
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(res, authenticatedContext.requestId, durationMs);
        logger.info('Auth+rate-limited request completed', { requestId: authenticatedContext.requestId, url: authenticatedContext.url, method: authenticatedContext.method, durationMs });
        return res;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        const resp = createServerErrorResponse(err, requestContext.requestId, requestContext) as NextResponse<ApiResponse<T>>;
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(resp, requestContext.requestId, durationMs);
        return resp;
      }
    };
  }

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


