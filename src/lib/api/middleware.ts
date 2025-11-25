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
  createErrorResponse,
  type ApiResponse,
} from '@/lib/api/api-response';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import {
  recordEndpointError,
  recordEndpointSuccess,
  recordEndpointLatency,
} from '@/lib/metrics/metrics';
import {
  getClientIPFromRequest,
  toRequestContext,
  setResponseHeaders,
  setRateLimitHeaders,
} from '@/lib/api/middleware/request-utils';
import { env } from '@/config/env';

export interface RequestContext {
  requestId: string;
  method?: string;
  url?: string;
  userAgent?: string;
  userInfo?: ReturnType<typeof getSingleUserInfo>;
  jwtToken?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequestContext extends RequestContext {
  userInfo: ReturnType<typeof getSingleUserInfo>;
  jwtToken?: string;
}

function createFallbackUserInfo(req: NextRequest): ReturnType<typeof getSingleUserInfo> {
  const ua = req.headers.get('user-agent') || '';
  let deviceType = 'Device';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone'))
    deviceType = 'Mobile';
  else if (ua.includes('iPad') || ua.includes('Tablet')) deviceType = 'Tablet';
  else if (ua.includes('Windows') || ua.includes('Mac') || ua.includes('Linux'))
    deviceType = 'Computer';
  return {
    userId: 'therapeutic-ai-user',
    email: 'user@therapeutic-ai.local',
    name: 'Therapeutic AI User',
    currentDevice: deviceType,
  };
}

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
      const rid = requestContext.requestId || 'unknown';
      const resp = createServerErrorResponse(err, rid, requestContext) as NextResponse<
        ApiResponse<T>
      >;
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(resp, rid, durationMs);
      try {
        recordEndpointLatency(requestContext.method, requestContext.url, durationMs);
      } catch {}
      try {
        recordEndpointError(requestContext.method, requestContext.url);
      } catch {}
      return resp;
    }
  };
}

export function withAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return withApiMiddleware<T>(async (request, baseContext, params) => {
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      logger.warn('Unauthorized request', { ...baseContext, error: authResult.error });
      const unauthorized = createAuthenticationErrorResponse(
        authResult.error || 'Authentication required',
        baseContext.requestId
      );
      setResponseHeaders(unauthorized, baseContext.requestId);
      return unauthorized as NextResponse<ApiResponse<T>>;
    }

    let userInfo: ReturnType<typeof getSingleUserInfo> & { clerkId?: string };
    try {
      userInfo = getSingleUserInfo(request) as ReturnType<typeof getSingleUserInfo> & {
        clerkId?: string;
      };
    } catch {
      userInfo = createFallbackUserInfo(request) as ReturnType<typeof getSingleUserInfo> & {
        clerkId?: string;
      };
    }
    const authWithId = authResult as unknown as { userId?: string };
    const mergedUserInfo = authWithId?.userId
      ? { ...userInfo, clerkId: authWithId.userId }
      : userInfo;

    const authenticatedContext: AuthenticatedRequestContext = {
      ...(baseContext as RequestContext),
      userInfo: mergedUserInfo,
      jwtToken: authResult.jwtToken,
    } as AuthenticatedRequestContext;
    logger.info('Authenticated request', {
      ...baseContext,
      userId: (mergedUserInfo as { userId?: string } | undefined)?.userId,
      clerkId: (mergedUserInfo as { clerkId?: string } | undefined)?.clerkId,
    });

    const res = await handler(request, authenticatedContext, params);
    setResponseHeaders(res, authenticatedContext.requestId);
    return res;
  });
}

export function withAuthStreaming(
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
    const baseContext = toRequestContext(createRequestLogger(request), 'unknown');
    const startHighRes = performance.now();
    try {
      const authResult = await validateApiAuth(request);
      if (!authResult.isValid) {
        const unauthorized = new Response(
          JSON.stringify({ error: authResult.error || 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
        const durationMs = Math.round(performance.now() - startHighRes);
        setResponseHeaders(unauthorized, baseContext.requestId || 'unknown', durationMs);
        return unauthorized;
      }
      let userInfo: ReturnType<typeof getSingleUserInfo> & { clerkId?: string };
      try {
        userInfo = getSingleUserInfo(request) as ReturnType<typeof getSingleUserInfo> & {
          clerkId?: string;
        };
      } catch {
        try {
          userInfo = createFallbackUserInfo(request) as ReturnType<typeof getSingleUserInfo> & {
            clerkId?: string;
          };
        } catch (err) {
          throw err;
        }
      }
      const authWithId = authResult as unknown as { userId?: string };
      const mergedUserInfo = authWithId?.userId
        ? { ...userInfo, clerkId: authWithId.userId }
        : userInfo;

      const authenticatedContext: AuthenticatedRequestContext = {
        requestId: baseContext.requestId || 'unknown',
        method: baseContext.method,
        url: baseContext.url,
        userAgent: baseContext.userAgent,
        userInfo: mergedUserInfo,
        jwtToken: authResult.jwtToken,
      } as const;
      const res = await handler(request, authenticatedContext, routeParams.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(res, authenticatedContext.requestId, durationMs);
      return res;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const resp = new Response(
        JSON.stringify({ error: err.message, requestId: baseContext.requestId || 'unknown' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(resp, baseContext.requestId || 'unknown', durationMs);
      return resp;
    }
  };
}

export function withValidation<TSchema extends z.ZodSchema, TResponse = unknown>(
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
          return createErrorResponse('Invalid JSON format in request body', 400, {
            code: 'VALIDATION_ERROR',
            details: 'JSON parsing failed',
            requestId: context.requestId,
          }) as NextResponse<ApiResponse<TResponse>>;
        }
      } else {
        const { searchParams } = new URL((request as { url: string }).url);
        requestData = Object.fromEntries(searchParams.entries());
      }
    } catch {
      logger.validationError(context.url || 'unknown', 'Invalid request data', context);
      return createValidationErrorResponse(
        'Invalid request data',
        context.requestId
      ) as NextResponse<ApiResponse<TResponse>>;
    }

    const validation = validateRequest(schema, requestData);
    if (!validation.success) {
      logger.validationError(
        context.url || 'unknown',
        validation.error || 'Validation failed',
        context
      );
      // Use createErrorResponse directly to put the specific error in the message field
      return createErrorResponse(validation.error || 'Validation failed', 400, {
        code: 'VALIDATION_ERROR',
        details: validation.error,
        suggestedAction: 'Please check your input data and try again',
        requestId: context.requestId,
      }) as NextResponse<ApiResponse<TResponse>>;
    }

    return handler(request, context, validation.data as z.infer<TSchema>, params);
  });
}

export function withValidationAndParams<TSchema extends z.ZodSchema, TResponse = unknown>(
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
        const body = {
          success: false,
          error: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            details: 'Too many requests made in a short period',
            suggestedAction: 'Please wait a moment before making another request',
          },
          meta: { timestamp: new Date().toISOString(), requestId: context.requestId },
        } as const;
        const headers = { 'Retry-After': retryAfter } as Record<string, string>;
        return NextResponse.json(body, { status: 429, headers }) as NextResponse<ApiResponse<T>>;
      }
    }

    // Get response from handler
    const response = await handler(request, context, params);

    // Add rate limit headers to successful responses
    const status = limiter.getStatus(clientIP, bucket);
    setRateLimitHeaders(response, status, maxRequests);

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
      const authResult = await validateApiAuth(request);
      if (!authResult.isValid) {
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

      const userInfo = getSingleUserInfo(request);
      const authenticatedContext: AuthenticatedRequestContext = {
        ...requestContext,
        userInfo,
        jwtToken: authResult.jwtToken,
      } as AuthenticatedRequestContext;
      const res = await handler(request, authenticatedContext, routeParams?.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(res, authenticatedContext.requestId, durationMs);

      // Add rate limit headers to successful responses
      const maxRequests = options.maxRequests ?? env.API_MAX_REQS;
      const status = limiter.getStatus(clientIP, 'api');
      setRateLimitHeaders(res, status, maxRequests);

      return res;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const resp = NextResponse.json(
        { success: false, error: { message: err.message } },
        { status: 500 }
      ) as NextResponse<ApiResponse<T>>;
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(resp, requestContext.requestId, durationMs);
      return resp;
    }
  };
}

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
  _options: { maxRequests?: number; windowMs?: number; maxConcurrent?: number } = {}
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
      const maxConcurrentEarly = _options.maxConcurrent ?? env.CHAT_MAX_CONCURRENCY;
      if (!rateLimitDisabled && env.NODE_ENV !== 'development') {
        const inflightEarly = inflightCounters.get(clientIPForEarly)?.count ?? 0;
        if (inflightEarly >= maxConcurrentEarly) {
          const earlyTooMany = new Response('Too many concurrent requests. Please wait.', {
            status: 429,
            headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' },
          });
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(earlyTooMany, baseContext.requestId || 'unknown', durationMs);
          try {
            recordEndpointError(baseContext.method, baseContext.url);
          } catch {}
          return earlyTooMany;
        }
      }

      const authResult = await validateApiAuth(request);
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
        const limiter = getRateLimiter();
        const globalResult = await limiter.checkRateLimit(clientIP, 'chat');
        if (!globalResult.allowed) {
          const retryAfter = String(
            globalResult.retryAfter || Math.ceil(env.CHAT_WINDOW_MS / 1000)
          );
          const limited = new Response('Rate limit exceeded. Please try again later.', {
            status: 429,
            headers: { 'Content-Type': 'text/plain', 'Retry-After': retryAfter },
          });
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(limited, baseContext.requestId || 'unknown', durationMs);
          try {
            recordEndpointError(baseContext.method, baseContext.url);
          } catch {}
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
          const streamingLimited = new Response('Rate limit exceeded. Please try again later.', {
            status: 429,
            headers: { 'Content-Type': 'text/plain', 'Retry-After': String(retryAfter) },
          });
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
          const tooMany = new Response('Too many concurrent requests. Please wait.', {
            status: 429,
            headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' },
          });
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(tooMany, baseContext.requestId || 'unknown', durationMs);
          try {
            recordEndpointError(baseContext.method, baseContext.url);
          } catch {}
          return tooMany;
        }
        inflightCounters.set(clientIP, { count: currentInflight + 1, lastUpdated: now });
        didIncrement = true;
      }

      const mergedUserInfo = getSingleUserInfo(request);
      const authenticatedContext: AuthenticatedRequestContext = {
        requestId: baseContext.requestId || 'unknown',
        method: baseContext.method,
        url: baseContext.url,
        userAgent: baseContext.userAgent,
        userInfo: mergedUserInfo,
        jwtToken: authResult.jwtToken,
      } as const;
      const response = await handler(request, authenticatedContext, routeParams?.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(response, authenticatedContext.requestId, durationMs);

      // Add rate limit headers to successful streaming responses
      const limiter = getRateLimiter();
      const status = limiter.getStatus(clientIP, 'chat');
      setRateLimitHeaders(response, status, maxRequests);

      try {
        recordEndpointSuccess(authenticatedContext.method, authenticatedContext.url);
      } catch {}
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const resp = new Response(
        JSON.stringify({ error: err.message, requestId: baseContext.requestId || 'unknown' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
      const durationMs = Math.round(performance.now() - startHighRes);
      setResponseHeaders(resp, baseContext.requestId || 'unknown', durationMs);
      try {
        recordEndpointError(baseContext.method, baseContext.url);
      } catch {}
      return resp;
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
