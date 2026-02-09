import { NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';
import { validateApiAuth } from '@/lib/api/api-auth';
import { validateRequest } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import {
  createAuthenticationErrorResponse,
  createValidationErrorResponse,
  createErrorResponse,
  type ApiResponse,
} from '@/lib/api/api-response';
import { resolvePrincipal } from '@/server/application/auth/resolve-principal';
import { withApiMiddleware } from '@/lib/api/middleware/core';
import { buildAuthenticatedContext } from '@/lib/api/middleware/context';
import { setResponseHeaders } from '@/lib/api/middleware/request-utils';
import type { AuthenticatedRequestContext } from '@/lib/api/middleware/types';

export function withAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return withApiMiddleware<T>(async (request, baseContext, params) => {
    const authResult = await validateApiAuth();
    const principal = resolvePrincipal(authResult);

    if (!authResult.isValid || !principal) {
      logger.warn('Unauthorized request', { ...baseContext, error: authResult.error });
      const unauthorized = createAuthenticationErrorResponse(
        authResult.error || 'Authentication required',
        baseContext.requestId
      );
      setResponseHeaders(unauthorized, baseContext.requestId);
      return unauthorized as NextResponse<ApiResponse<T>>;
    }

    const authenticatedContext = buildAuthenticatedContext(request, baseContext, authResult);
    logger.info('Authenticated request', {
      ...baseContext,
      clerkId: authenticatedContext.principal.clerkId,
    });

    const response = await handler(request, authenticatedContext, params);
    setResponseHeaders(response, authenticatedContext.requestId);
    return response;
  });
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
          requestData = await request.json();
        } catch {
          logger.validationError(context.url || 'unknown', 'Invalid JSON in request body', context);
          return createErrorResponse('Invalid JSON format in request body', 400, {
            code: 'VALIDATION_ERROR',
            details: 'JSON parsing failed',
            requestId: context.requestId,
          }) as NextResponse<ApiResponse<TResponse>>;
        }
      } else {
        const { searchParams } = new URL(request.url);
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
