import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiMiddleware as createFactory } from '@/lib/api/middleware/factory';
import type { RequestContext, AuthenticatedRequestContext, ApiMiddlewareDeps } from '@/lib/api/middleware/factory';
import type { ApiResponse } from '@/lib/api/api-response';
export type { RequestContext, AuthenticatedRequestContext };

// Default instance used by app code
let currentOverrides: Partial<ApiMiddlewareDeps> = {};
let defaultInstance = createFactory(currentOverrides);

// Facade exports delegating to the default instance
export const createApiMiddleware = createFactory;
export function withApiMiddleware<T = unknown>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return defaultInstance.withApiMiddleware<T>(handler);
}

export function withAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return defaultInstance.withAuth<T>(handler);
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
  // Delegate to factory while preserving generic types for callers
  return (defaultInstance as unknown as {
    withValidation: <S extends z.ZodSchema, R = unknown>(
      schema: S,
      handler: (
        request: NextRequest,
        context: AuthenticatedRequestContext,
        validatedData: z.infer<S>,
        params?: unknown
      ) => Promise<NextResponse<ApiResponse<R>>>
    ) => ReturnType<typeof defaultInstance.withValidation>;
  }).withValidation(schema, handler);
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
  return (defaultInstance as unknown as {
    withValidationAndParams: <S extends z.ZodSchema, R = unknown>(
      schema: S,
      handler: (
        request: NextRequest,
        context: AuthenticatedRequestContext,
        validatedData: z.infer<S>,
        params: Record<string, string>
      ) => Promise<NextResponse<ApiResponse<R>>>
    ) => ReturnType<typeof defaultInstance.withValidationAndParams>;
  }).withValidationAndParams(schema, handler);
}

export function withRateLimitUnauthenticated<T = unknown>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    params?: unknown
  ) => Promise<NextResponse<ApiResponse<T>>>,
  options?: { bucket?: 'api' | 'chat' | 'default'; windowMs?: number }
) {
  return defaultInstance.withRateLimitUnauthenticated<T>(handler, options);
}

export function withAuthAndRateLimit<T = unknown>(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>,
  options?: { maxRequests?: number; windowMs?: number }
) {
  return defaultInstance.withAuthAndRateLimit<T>(handler, options);
}

export function withAuthStreaming(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<Response>
) {
  return defaultInstance.withAuthStreaming(handler);
}

export function withAuthAndRateLimitStreaming(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<Response>,
  options?: { maxRequests?: number; windowMs?: number; maxConcurrent?: number }
) {
  return defaultInstance.withAuthAndRateLimitStreaming(handler, options);
}

// Test-only setters: rebuild the default instance with overrides
export function __setCreateRequestLoggerForTests(fn: ((req: unknown) => unknown) | null | undefined): void {
  if (process.env.NODE_ENV !== 'test') return;
  const createRequestLogger = (fn as ((req: unknown) => unknown)) || undefined;
  const createRequestLoggerTyped = createRequestLogger as unknown as ApiMiddlewareDeps['createRequestLogger'] | undefined;
  currentOverrides = { ...currentOverrides, createRequestLogger: createRequestLoggerTyped };
  defaultInstance = createFactory(currentOverrides);
}

export function __setApiMiddlewareDepsForTests(deps: {
  validateApiAuth?: (req: unknown) => Promise<{ isValid: boolean; error?: string }>;
  getRateLimiter?: () => { checkRateLimit: (clientIP: string, bucket?: string) => Promise<{ allowed: boolean; retryAfter?: number }> };
  getSingleUserInfo?: (req: unknown) => unknown;
} = {}): void {
  if (process.env.NODE_ENV !== 'test') return;
  currentOverrides = {
    ...currentOverrides,
    ...(deps.validateApiAuth ? { validateApiAuth: deps.validateApiAuth as unknown as ApiMiddlewareDeps['validateApiAuth'] } : {}),
    ...(deps.getRateLimiter ? { getRateLimiter: deps.getRateLimiter as unknown as ApiMiddlewareDeps['getRateLimiter'] } : {}),
    ...(deps.getSingleUserInfo ? { getSingleUserInfo: deps.getSingleUserInfo as unknown as ApiMiddlewareDeps['getSingleUserInfo'] } : {}),
  };
  defaultInstance = createFactory(currentOverrides);
}

// Re-export error handlers
export { errorHandlers } from '@/lib/api/middleware/error-handlers';
