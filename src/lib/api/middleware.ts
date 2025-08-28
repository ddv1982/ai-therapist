import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiAuth } from '@/lib/api/api-auth';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import { getSingleUserInfo } from '@/lib/auth/user-session';
import { logger } from '@/lib/utils/logger';
import {
  createAuthenticationErrorResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
  ApiResponse,
} from '@/lib/api/api-response';

export interface RequestContext {
  requestId: string;
  method?: string;
  url?: string;
  userAgent?: string;
  userInfo?: ReturnType<typeof getSingleUserInfo>;
}

export interface AuthenticatedRequestContext extends RequestContext {
  userInfo: ReturnType<typeof getSingleUserInfo>;
}

/**
 * Simple API middleware wrapper for backward compatibility
 */
export function withApiMiddleware<T = unknown>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    _params?: unknown
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    request: NextRequest,
    _routeParams?: { params: unknown }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const requestContext = createRequestLogger(request);
    const start = Date.now();

    try {
      const context: RequestContext = {
        requestId: requestContext.requestId || 'test-request',
        method: requestContext.method as string | undefined,
        url: requestContext.url as string | undefined,
        userAgent: requestContext.userAgent as string | undefined,
      };

      const res = await handler(request, context, _routeParams?.params);
      console.log(`API request completed in ${Date.now() - start}ms`);
      return res;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('API request failed:', err);
      throw err;
    }
  };
}



/**
 * Simple authentication wrapper that returns a route handler
 */
export function withAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params?: unknown
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return withApiMiddleware<T>(async (request, context, params) => {
          // For demo purposes, use a fixed demo user
      // In production, you'd extract user info from validated JWT tokens
      const userInfo = {
        userId: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User',
        currentDevice: 'demo-device'
      };

    const authenticatedContext: AuthenticatedRequestContext = {
      ...context,
      userInfo,
    };

    return handler(request, authenticatedContext, params);
  });
}

/**
 * Simple validation and params wrapper
 */
export function withValidationAndParams<T extends z.ZodSchema, R = unknown>(
  schema: T,
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    validatedData: z.infer<T>,
    params: unknown
  ) => Promise<NextResponse<ApiResponse<R>>>
) {
  return withApiMiddleware(async (request, context, params) => {
    try {
      // Validate request body
      const body = await request.json();
      const validation = schema.safeParse(body);

      if (!validation.success) {
        return createValidationErrorResponse(
          validation.error.message,
          context.requestId
        ) as NextResponse<ApiResponse<R>>;
      }

      // For demo purposes, use a fixed demo user
      const userInfo = {
        userId: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User',
        currentDevice: 'demo-device'
      };

      const authenticatedContext: AuthenticatedRequestContext = {
        ...context,
        userInfo,
      };

      return handler(request, authenticatedContext, validation.data, params);
    } catch (error) {
      return createServerErrorResponse(
        error as Error,
        context.requestId,
        { validation: 'Request validation failed' }
      );
    }
  });
}

/**
 * Error handlers for common scenarios
 */
export const errorHandlers = {
  handleDatabaseError: (error: Error, operation: string, context: RequestContext) => {
    logger.error(`Database error during ${operation}`, {
      error: error.message,
      requestId: context.requestId
    });
    return createServerErrorResponse(error, context.requestId, {
      operation,
      type: 'database_error'
    });
  }
};

/**
 * Simple rate limiting wrapper
 */
export async function withRateLimit(request: NextRequest, bucket: 'api' | 'chat' | 'default' = 'api'): Promise<void> {
  const clientIP = getClientIP(request);
  const limiter = getRateLimiter();
  const result = limiter.checkRateLimit(clientIP, bucket);

  if (!result.allowed) {
    throw new Error('Rate limit exceeded');
  }
}

/**
 * Simple validation wrapper
 */
export function withValidation<T extends z.ZodSchema, R = unknown>(
  schema: T,
  handler: (request: NextRequest, data: z.infer<T>, context: AuthenticatedRequestContext) => Promise<NextResponse<ApiResponse<R>>>
) {
  return async (request: NextRequest, context: AuthenticatedRequestContext): Promise<NextResponse<ApiResponse<R>>> => {
    try {
      let requestData: unknown;

      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        requestData = await request.json();
      } else {
        const { searchParams } = new URL(request.url);
        requestData = Object.fromEntries(searchParams.entries());
      }

      const validation = schema.safeParse(requestData);
      if (!validation.success) {
        return createValidationErrorResponse(validation.error.message, context.requestId) as NextResponse<ApiResponse<R>>;
      }

      return handler(request, validation.data, context);
    } catch (error) {
      return createServerErrorResponse(error as Error, context.requestId, { userInfo: context.userInfo }) as NextResponse<ApiResponse<R>>;
    }
  };
}

/**
 * Combined auth + validation wrapper
 */
export function withAuthAndValidation<T extends z.ZodSchema, R = unknown>(
  schema: T,
  handler: (request: NextRequest, data: z.infer<T>, context: AuthenticatedRequestContext) => Promise<NextResponse<ApiResponse<R>>>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<R>>> => {
    try {
      // Authenticate
      const authResult = await validateApiAuth(request);
      if (!authResult.isValid) {
        return createAuthenticationErrorResponse(
          authResult.error || 'Authentication required',
          'req-id'
        ) as NextResponse<ApiResponse<R>>;
      }
      const userInfo = getSingleUserInfo(request);

      const context: AuthenticatedRequestContext = {
        requestId: 'req-id',
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent') || '',
        userInfo,
      };

      // Rate limit
      await withRateLimit(request);

      // Validate
      return withValidation(schema, handler)(request, context);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('Authentication')) {
        return createAuthenticationErrorResponse(err.message, 'req-id') as NextResponse<ApiResponse<R>>;
      }
      if (err.message.includes('Rate limit')) {
        return NextResponse.json(
          { success: false, error: { message: 'Rate limit exceeded' } },
          { status: 429 }
        ) as NextResponse<ApiResponse<R>>;
      }
      return createServerErrorResponse(err, 'req-id', {}) as NextResponse<ApiResponse<R>>;
    }
  };
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

/**
 * Request logging utility
 */
export function createRequestLogger(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req-${Date.now()}`;

  logger.info('API request started', {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
  };
}
