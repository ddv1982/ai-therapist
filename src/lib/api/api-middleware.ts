import { NextRequest, NextResponse } from 'next/server';
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
import { prisma } from '@/lib/database/db';

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
    params?: unknown
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    request: NextRequest,
    routeParams?: { params: unknown }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const requestContext = createRequestLogger(request);
    
    try {
      const context: RequestContext = {
        requestId: requestContext.requestId || 'unknown',
        method: requestContext.method as string | undefined,
        url: requestContext.url as string | undefined,
        userAgent: requestContext.userAgent as string | undefined,
      };

      return await handler(request, context, routeParams?.params);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      return createServerErrorResponse(err, requestContext.requestId, requestContext) as NextResponse<ApiResponse<T>>;
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
    params?: unknown
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
      return createAuthenticationErrorResponse(
        authResult.error || 'Authentication required',
        baseContext.requestId
      );
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

    return await handler(request, authenticatedContext, params);
  });
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
    params: unknown
  ) => Promise<NextResponse<ApiResponse<TResponse>>>
) {
  return (request: NextRequest, routeParams: { params: unknown }) => {
    return withValidation(schema, (req, ctx, data) => 
      handler(req, ctx, data, routeParams.params)
    )(request, routeParams);
  };
}

/**
 * Database utility functions for common patterns
 */
export const db = {
  /**
   * Verify that a session belongs to the authenticated user
   */
  async verifySessionOwnership(
    sessionId: string,
    userId: string
  ): Promise<{ valid: boolean; session?: unknown }> {
    try {
      const session = await prisma.session.findUnique({
        where: { 
          id: sessionId,
          userId: userId 
        }
      });

      return { 
        valid: !!session, 
        session: session || undefined 
      };
    } catch (error) {
      logger.databaseError('verify session ownership', error as Error, { 
        sessionId, 
        userId 
      });
      return { valid: false };
    }
  },

  /**
   * Ensure user exists in database (upsert pattern)
   */
  async ensureUserExists(userInfo: ReturnType<typeof getSingleUserInfo>): Promise<boolean> {
    try {
      await prisma.user.upsert({
        where: { id: userInfo.userId },
        update: {},
        create: {
          id: userInfo.userId,
          email: userInfo.email,
          name: userInfo.name,
        },
      });
      return true;
    } catch (error) {
      logger.databaseError('ensure user exists', error as Error, { 
        userId: userInfo.userId 
      });
      return false;
    }
  },

  /**
   * Get user's sessions with message counts
   */
  async getUserSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });
  },

  /**
   * Get session with messages for user
   */
  async getSessionWithMessages(sessionId: string, userId: string) {
    return prisma.session.findUnique({
      where: { 
        id: sessionId,
        userId: userId 
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        },
        reports: true,
      },
    });
  },
};

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
  _maxRequests: number = 100,
  _windowMs: number = 60000 // 1 minute
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