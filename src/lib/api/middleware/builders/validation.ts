import type { NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';
import type { ApiResponse } from '@/lib/api/api-response';

export type WithAuth = <T = unknown>(
  handler: (
    request: NextRequest,
    context: { requestId: string; method?: string; url?: string; userAgent?: string; userInfo: ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo> | undefined },
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>
) => (
  request: NextRequest,
  routeParams: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<ApiResponse<T>>>;

export function buildValidation(
  deps: {
    withAuth: WithAuth;
    validateRequest: <S extends z.ZodSchema>(schema: S, data: unknown) => { success: boolean; data?: z.infer<S>; error?: string };
    createValidationErrorResponse: (message: string, requestId: string) => NextResponse<ApiResponse>;
    logger: { validationError: (url: string, detail: string, ctx?: Record<string, unknown>) => void };
  }
) {
  function withValidation<TSchema extends z.ZodSchema, TResponse = unknown>(
    schema: TSchema,
    handler: (
      request: NextRequest,
      context: { requestId: string; method?: string; url?: string; userAgent?: string; userInfo: ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo> | undefined },
      validatedData: z.infer<TSchema>,
      params?: unknown
    ) => Promise<NextResponse<ApiResponse<TResponse>>>
  ) {
    return deps.withAuth<TResponse>(async (request, context, params?) => {
      let requestData: unknown;
      try {
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            requestData = await (request as NextRequest).json();
          } catch {
            deps.logger.validationError(context.url || 'unknown', 'Invalid JSON in request body', context);
            return deps.createValidationErrorResponse('Invalid JSON format in request body', context.requestId) as NextResponse<ApiResponse<TResponse>>;
          }
        } else {
          const { searchParams } = new URL((request as { url: string }).url);
          requestData = Object.fromEntries(searchParams.entries());
        }
      } catch {
        deps.logger.validationError(context.url || 'unknown', 'Invalid request data', context);
        return deps.createValidationErrorResponse('Invalid request data', context.requestId) as NextResponse<ApiResponse<TResponse>>;
      }

      const validation = deps.validateRequest(schema, requestData);
      if (!validation.success) {
        deps.logger.validationError(context.url || 'unknown', validation.error || 'Validation failed', context);
        return deps.createValidationErrorResponse(validation.error || 'Validation failed', context.requestId) as NextResponse<ApiResponse<TResponse>>;
      }

      return handler(request, context, validation.data as z.infer<TSchema>, params);
    });
  }

  function withValidationAndParams<TSchema extends z.ZodSchema, TResponse = unknown>(
    schema: TSchema,
    handler: (
      request: NextRequest,
      context: { requestId: string; method?: string; url?: string; userAgent?: string; userInfo: ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo> | undefined },
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

  return { withValidation, withValidationAndParams };
}


