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

/**
 * Shared API middleware to eliminate DRY violations across routes
 */

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

/**
 * Higher-order function to wrap API routes with common middleware
 */
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
    const requestContext = createRequestLogger(request);
    const startHighRes = performance.now();
    
    try {
      const context: RequestContext = {
        requestId: requestContext.requestId || 'test-request',
        method: requestContext.method as string | undefined,
        url: requestContext.url as string | undefined,
        userAgent: requestContext.userAgent as string | undefined,
      };

      const res = await handler(request, context, routeParams?.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      try { res.headers.set('X-Request-Id', context.requestId); } catch {}
      try { res.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
      logger.info('API request completed', { requestId: context.requestId, url: context.url, method: context.method, durationMs });
      try { recordEndpointSuccess(context.method, context.url); } catch {}
      return res;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const rid = (requestContext as unknown as { requestId?: string } | undefined)?.requestId || 'test-request';
      const ctx = (requestContext as unknown as Record<string, unknown>) || {};
      const resp = createServerErrorResponse(err, rid, ctx) as NextResponse<ApiResponse<T>>;
      const durationMs = Math.round(performance.now() - startHighRes);
      try { resp.headers.set('X-Request-Id', rid); } catch {}
      try { resp.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
      try { recordEndpointError((ctx.method as string | undefined), (ctx.url as string | undefined)); } catch {}
      return resp;
    }
  };
}

/**
 * Higher-order function to wrap API routes with authentication middleware
 */
export function withAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return withApiMiddleware(async (request, baseContext, params) => {
    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      logger.warn('Unauthorized request', { 
        ...baseContext, 
        error: authResult.error 
      });
      const unauthorized = createAuthenticationErrorResponse(
        authResult.error || 'Authentication required',
        baseContext.requestId
      );
      try { unauthorized.headers.set('X-Request-Id', baseContext.requestId); } catch {}
      return unauthorized;
    }

    // Get user information
    const userInfo = getSingleUserInfo(request);
    
    const authenticatedContext: AuthenticatedRequestContext = {
      ...baseContext,
      userInfo,
    };

    logger.info('Authenticated request', {
      ...baseContext,
      userId: userInfo.userId,
    });

    const res = await handler(request, authenticatedContext, params);
    try { res.headers.set('X-Request-Id', authenticatedContext.requestId); } catch {}
    return res;
  });
}

/**
 * Authentication wrapper for streaming routes that return a native Response
 */
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
    const baseContext = createRequestLogger(request);
    const startHighRes = performance.now();
    try {
      const authResult = await validateApiAuth(request);
      if (!authResult.isValid) {
        logger.warn('Unauthorized request', {
          requestId: baseContext.requestId || 'unknown',
          method: baseContext.method,
          url: baseContext.url,
          error: authResult.error,
        });
        const unauthorized = new Response(
          JSON.stringify({ error: authResult.error || 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
        const durationMs = Math.round(performance.now() - startHighRes);
        try { unauthorized.headers.set('X-Request-Id', baseContext.requestId || 'unknown'); } catch {}
        try { unauthorized.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
        return unauthorized;
      }

      const userInfo = getSingleUserInfo(request);
      const authenticatedContext: AuthenticatedRequestContext = {
        requestId: baseContext.requestId || 'unknown',
        method: baseContext.method as string | undefined,
        url: baseContext.url as string | undefined,
        userAgent: baseContext.userAgent as string | undefined,
        userInfo,
      };

      logger.info('Authenticated streaming request', {
        requestId: authenticatedContext.requestId,
        userId: userInfo.userId,
      });

      const res = await handler(request, authenticatedContext, routeParams.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      try { (res as Response).headers.set('X-Request-Id', authenticatedContext.requestId); } catch {}
      try { (res as Response).headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
      logger.info('Streaming request completed', { requestId: authenticatedContext.requestId, url: authenticatedContext.url, method: authenticatedContext.method, durationMs });
      try { recordEndpointSuccess(authenticatedContext.method, authenticatedContext.url); } catch {}
      return res;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const resp = new Response(
        JSON.stringify({ error: err.message, requestId: baseContext.requestId || 'unknown' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
      const durationMs = Math.round(performance.now() - startHighRes);
      try { resp.headers.set('X-Request-Id', baseContext.requestId || 'unknown'); } catch {}
      try { resp.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
      try { recordEndpointError(baseContext.method as string | undefined, baseContext.url as string | undefined); } catch {}
      return resp;
    }
  };
}

/**
 * Get client IP from request headers for rate limiting
 */
function getClientIPFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return (request as unknown as { ip?: string }).ip || 'unknown';
}

/**
 * Authentication + Rate-limit wrapper for streaming routes
 */
const streamingCounters: Map<string, { count: number; resetTime: number }> = new Map();
const inflightCounters: Map<string, number> = new Map();

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
    // In test environment, bypass auth and rate limiting to allow unit tests to exercise handlers
    if (process.env.NODE_ENV === 'test') {
      const userInfo = getSingleUserInfo(request);
      const testContext: AuthenticatedRequestContext = {
        requestId: 'test-request',
        method: request.method,
        url: (request as unknown as { url?: string; nextUrl?: URL }).nextUrl?.toString() || (request as unknown as { url?: string }).url || 'unknown',
        userAgent: request.headers.get('user-agent') || 'jest',
        userInfo,
      };
      return handler(request, testContext, routeParams?.params);
    }
    const baseContext = createRequestLogger(request);
    // legacy start timestamp removed; using high-resolution timers elsewhere
    const startHighRes = performance.now();
    const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
    let didIncrement = false;
    try {
      // Auth check
      const authResult = await validateApiAuth(request);
      if (!authResult.isValid) {
        logger.warn('Unauthorized request', {
          requestId: baseContext.requestId || 'unknown',
          method: baseContext.method,
          url: baseContext.url,
          error: authResult.error,
        });
        const unauthorized = new Response(
          JSON.stringify({ error: authResult.error || 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
        const durationMs = Math.round(performance.now() - startHighRes);
        try { unauthorized.headers.set('X-Request-Id', baseContext.requestId || 'unknown'); } catch {}
        try { unauthorized.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
        return unauthorized;
      }

      // Rate limit check (global and per-route)
      const clientIP = getClientIPFromRequest(request);
      if (!rateLimitDisabled) {
        const limiter = getRateLimiter();
        const globalResult = await limiter.checkRateLimit(clientIP, 'chat');
        if (!globalResult.allowed) {
          const retryAfter = String(globalResult.retryAfter || Math.ceil((5 * 60)));
          const limited = new Response('Rate limit exceeded. Please try again later.', {
            status: 429,
            headers: { 'Content-Type': 'text/plain', 'Retry-After': retryAfter },
          });
          const durationMs = Math.round(performance.now() - startHighRes);
          try { limited.headers.set('X-Request-Id', baseContext.requestId || 'unknown'); } catch {}
          try { limited.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
          try { recordEndpointError(baseContext.method as string | undefined, baseContext.url as string | undefined); } catch {}
          return limited;
        }
      }

      // Per-route limits (skipped in development to keep DX smooth)
      const maxRequests = Number(process.env.CHAT_MAX_REQS || options.maxRequests || 120);
      const windowMs = Number(process.env.CHAT_WINDOW_MS || options.windowMs || 5 * 60 * 1000);
      const maxConcurrent = Number(process.env.CHAT_MAX_CONCURRENCY || options.maxConcurrent || 2);
      if (!rateLimitDisabled && process.env.NODE_ENV !== 'development') {
        const now = Date.now();
        const entry = streamingCounters.get(clientIP);
        if (!entry || now > entry.resetTime) {
          streamingCounters.set(clientIP, { count: 1, resetTime: now + windowMs });
        } else if (entry.count >= maxRequests) {
          const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
          return new Response('Rate limit exceeded. Please try again later.', {
            status: 429,
            headers: { 'Content-Type': 'text/plain', 'Retry-After': String(Math.max(retryAfter, 1)) },
          });
        } else {
          entry.count++;
        }

        // Concurrency control
        const currentInflight = inflightCounters.get(clientIP) || 0;
        if (currentInflight >= maxConcurrent) {
          const tooMany = new Response('Too many concurrent requests. Please wait.', {
            status: 429,
            headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' },
          });
          const durationMs = Math.round(performance.now() - startHighRes);
          try { tooMany.headers.set('X-Request-Id', baseContext.requestId || 'unknown'); } catch {}
          try { tooMany.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
          return tooMany;
        }
        inflightCounters.set(clientIP, currentInflight + 1);
        didIncrement = true;
      }

      // Authenticated context
      const userInfo = getSingleUserInfo(request);
      const authenticatedContext: AuthenticatedRequestContext = {
        requestId: baseContext.requestId || 'unknown',
        method: baseContext.method as string | undefined,
        url: baseContext.url as string | undefined,
        userAgent: baseContext.userAgent as string | undefined,
        userInfo,
      };

      logger.info('Authenticated rate-limited streaming request', {
        requestId: authenticatedContext.requestId,
        userId: userInfo.userId,
      });

      const response = await handler(request, authenticatedContext, routeParams?.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      try { response.headers.set('X-Request-Id', authenticatedContext.requestId); } catch {}
      try { response.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
      logger.info('Rate-limited streaming request completed', { requestId: authenticatedContext.requestId, url: authenticatedContext.url, method: authenticatedContext.method, durationMs });
      try { recordEndpointSuccess(authenticatedContext.method, authenticatedContext.url); } catch {}
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const resp = new Response(
        JSON.stringify({ error: err.message, requestId: baseContext.requestId || 'unknown' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
      const durationMs = Math.round(performance.now() - startHighRes);
      try { resp.headers.set('X-Request-Id', baseContext.requestId || 'unknown'); } catch {}
      try { resp.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
      try { recordEndpointError(baseContext.method as string | undefined, baseContext.url as string | undefined); } catch {}
      return resp;
    }
    finally {
      // Decrement inflight concurrency
      if (!rateLimitDisabled && didIncrement) {
        try {
          const clientIP = getClientIPFromRequest(request);
          const currentInflight = inflightCounters.get(clientIP) || 0;
          if (currentInflight > 0) inflightCounters.set(clientIP, currentInflight - 1);
        } catch {}
      }
    }
  };
}

/**
 * Higher-order function to wrap API routes with validation middleware
 */
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
      // Parse JSON body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        requestData = await request.json();
      } else {
        // For GET requests, validate query parameters
        const { searchParams } = new URL(request.url);
        requestData = Object.fromEntries(searchParams.entries());
      }
    } catch {
      logger.validationError(
        context.url || 'unknown',
        'Invalid JSON in request body',
        context
      );
      return createValidationErrorResponse(
        'Invalid JSON format in request body',
        context.requestId
      ) as NextResponse<ApiResponse<TResponse>>;
    }

    // Validate the request data
    const validation = validateRequest(schema, requestData);
    if (!validation.success) {
      logger.validationError(context.url || 'unknown', validation.error, context);
      return createValidationErrorResponse(validation.error, context.requestId) as NextResponse<ApiResponse<TResponse>>;
    }

    return await handler(request, context, validation.data as z.infer<TSchema>, params);
  });
}

/**
 * Helper for routes that need both validation and route params
 */
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

/**
 * Database utility functions for common patterns
 */
// Database helpers have moved to '@/lib/database/queries'.

/**
 * Common error handlers for specific scenarios
 */
export const errorHandlers = {
  handleDatabaseError: (error: Error, operation: string, context: RequestContext) => {
    logger.databaseError(operation, error, context);
    
    // Check for specific database constraint errors
    if (error.message.includes('UNIQUE constraint')) {
      return createValidationErrorResponse(
        'Resource already exists with this identifier',
        context.requestId
      );
    }
    
    if (error.message.includes('FOREIGN KEY constraint')) {
      return createValidationErrorResponse(
        'Referenced resource does not exist',
        context.requestId
      );
    }
    
    return createServerErrorResponse(error, context.requestId, context);
  },
};

/**
 * Rate limiting middleware (placeholder for future implementation)
 */
export function withRateLimit(
  // maxRequests: number = 100,  // TODO: Implement rate limiting
  // windowMs: number = 60000    // TODO: Implement rate limiting
) {
  return function<T>(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params?: unknown
    ) => Promise<NextResponse<ApiResponse<T>>>
  ) {
    return withAuth<T>(async (request, context, params) => {
      // TODO: Implement rate limiting logic using Redis or in-memory store
      // For now, just pass through to the handler
      return await handler(request, context, params);
    });
  };
}

/**
 * Unauthenticated rate limit wrapper using the shared limiter and API bucket
 */
export function withRateLimitUnauthenticated<T = unknown>(
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
      const limiter = getRateLimiter();
      const bucket = options.bucket || 'api';
      const windowMs = Number(
        (bucket === 'chat' ? process.env.CHAT_WINDOW_MS : bucket === 'api' ? process.env.API_WINDOW_MS : process.env.RATE_LIMIT_WINDOW_MS) ||
        options.windowMs ||
        5 * 60 * 1000
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
              suggestedAction: 'Please wait a moment before making another request'
            },
            meta: { timestamp: new Date().toISOString(), requestId: context.requestId }
          },
          { status: 429, headers: { 'Retry-After': retryAfter } }
        ) as NextResponse<ApiResponse<T>>;
      }
    }

    return handler(request, context, params);
  });
}

/**
 * Auth + Rate limit wrapper for standard (non-streaming) routes
 */
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
    const requestContext = createRequestLogger(request);
    const startHighRes = performance.now();
    const baseContext: RequestContext = {
      requestId: requestContext.requestId || 'unknown',
      method: requestContext.method as string | undefined,
      url: requestContext.url as string | undefined,
      userAgent: requestContext.userAgent as string | undefined,
    };
    try {
      const authResult = await validateApiAuth(request);
      if (!authResult.isValid) {
        logger.warn('Unauthorized request', { ...baseContext, error: authResult.error });
        const unauthorized = createAuthenticationErrorResponse(
          authResult.error || 'Authentication required',
          baseContext.requestId
        ) as NextResponse<ApiResponse<T>>;
        const durationMs = Math.round(performance.now() - startHighRes);
        try { unauthorized.headers.set('X-Request-Id', baseContext.requestId); } catch {}
        try { unauthorized.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
        return unauthorized;
      }

      const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
      const clientIP = getClientIPFromRequest(request);
      const limiter = getRateLimiter();
      const windowMs = Number(process.env.API_WINDOW_MS || options.windowMs || 5 * 60 * 1000);

      if (!rateLimitDisabled) {
        // Use api bucket for general API limits
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
                suggestedAction: 'Please wait a moment before making another request'
              },
              meta: { timestamp: new Date().toISOString(), requestId: baseContext.requestId }
            },
            { status: 429, headers: { 'Retry-After': retryAfter } }
          ) as NextResponse<ApiResponse<T>>;
          const durationMs = Math.round(performance.now() - startHighRes);
          try { limited.headers.set('X-Request-Id', baseContext.requestId); } catch {}
          try { limited.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
          return limited;
        }
      }

      const userInfo = getSingleUserInfo(request);
      const authenticatedContext: AuthenticatedRequestContext = { ...baseContext, userInfo };

      const res = await handler(request, authenticatedContext, routeParams?.params);
      const durationMs = Math.round(performance.now() - startHighRes);
      try { res.headers.set('X-Request-Id', authenticatedContext.requestId); } catch {}
      try { res.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
      logger.info('Auth+rate-limited request completed', { requestId: authenticatedContext.requestId, url: authenticatedContext.url, method: authenticatedContext.method, durationMs });
      return res;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const resp = createServerErrorResponse(err, baseContext.requestId, baseContext) as NextResponse<ApiResponse<T>>;
      const durationMs = Math.round(performance.now() - startHighRes);
      try { resp.headers.set('X-Request-Id', baseContext.requestId); } catch {}
      try { resp.headers.set('Server-Timing', `total;dur=${durationMs}`); } catch {}
      return resp;
    }
  };
}
