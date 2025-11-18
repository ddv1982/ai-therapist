/**
 * Auth builder
 *
 * Contract: Ensures requests are authenticated before invoking the handler.
 * Adds `userInfo` to context and applies `X-Request-Id` and `Server-Timing`
 * headers. On auth failure, returns standardized 401 ApiResponse.
 */
import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import { logger } from '@/lib/utils/logger';
import { setResponseHeaders, toRequestContext } from '@/lib/api/middleware/request-utils';
import { createAuthenticationErrorResponse, type ApiResponse } from '@/lib/api/api-response';
import type { RequestContext, AuthenticatedRequestContext } from '@/lib/api/middleware/factory';

function createFallbackUserInfo(
  req: NextRequest
): ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo> {
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

export type WithApiMiddleware = <T = unknown>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    params: Promise<Record<string, string>>
  ) => Promise<NextResponse<ApiResponse<T>>>
) => (
  request: NextRequest,
  routeParams: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<ApiResponse<T>>>;

export function buildWithAuth(deps: {
  withApiMiddleware: WithApiMiddleware;
  validateApiAuth: (req: NextRequest) => Promise<{ isValid: boolean; error?: string }>;
  getSingleUserInfo: (
    req: NextRequest
  ) => ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo>;
}) {
  return function withAuth<T = unknown>(
    handler: (
      request: NextRequest,
      context: AuthenticatedRequestContext,
      params: Promise<Record<string, string>>
    ) => Promise<NextResponse<ApiResponse<T>>>
  ) {
    return deps.withApiMiddleware<T>(async (request, baseContext, params) => {
      const authResult = await deps.validateApiAuth(request);
      if (!authResult.isValid) {
        logger.warn('Unauthorized request', { ...baseContext, error: authResult.error });
        const unauthorized = createAuthenticationErrorResponse(
          authResult.error || 'Authentication required',
          baseContext.requestId
        );
        setResponseHeaders(unauthorized, baseContext.requestId);
        return unauthorized as NextResponse<ApiResponse<T>>;
      }

      let userInfo: ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo> & {
        clerkId?: string;
      };
      try {
        userInfo = deps.getSingleUserInfo(request) as ReturnType<
          typeof import('@/lib/auth/user-session').getSingleUserInfo
        > & { clerkId?: string };
      } catch {
        userInfo = createFallbackUserInfo(request) as ReturnType<
          typeof import('@/lib/auth/user-session').getSingleUserInfo
        > & { clerkId?: string };
      }
      const authWithId = authResult as unknown as { userId?: string };
      const mergedUserInfo = authWithId?.userId
        ? { ...userInfo, clerkId: authWithId.userId }
        : userInfo;
      const authenticatedContext: AuthenticatedRequestContext = {
        ...(baseContext as RequestContext),
        userInfo: mergedUserInfo,
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
  };
}

export function buildWithAuthStreaming(deps: {
  validateApiAuth: (req: NextRequest) => Promise<{ isValid: boolean; error?: string }>;
  getSingleUserInfo: (
    req: NextRequest
  ) => ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo>;
  createRequestLogger?: (req: NextRequest) => {
    requestId?: string;
    method?: string;
    url?: string;
    userAgent?: string;
  };
}) {
  return function withAuthStreaming(
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
      const baseContext = deps.createRequestLogger
        ? toRequestContext(deps.createRequestLogger(request), 'unknown')
        : toRequestContext(
            {
              requestId: (request as unknown as { requestId?: string })?.requestId,
              method: request.method,
              url: (request as unknown as { url?: string })?.url,
              userAgent: (request as unknown as { userAgent?: string })?.userAgent,
            },
            'unknown'
          );
      const startHighRes = performance.now();
      try {
        const authResult = await deps.validateApiAuth(request);
        if (!authResult.isValid) {
          const unauthorized = new Response(
            JSON.stringify({ error: authResult.error || 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
          const durationMs = Math.round(performance.now() - startHighRes);
          setResponseHeaders(unauthorized, baseContext.requestId || 'unknown', durationMs);
          return unauthorized;
        }
        let userInfo: ReturnType<typeof import('@/lib/auth/user-session').getSingleUserInfo> & {
          clerkId?: string;
        };
        try {
          userInfo = deps.getSingleUserInfo(request) as ReturnType<
            typeof import('@/lib/auth/user-session').getSingleUserInfo
          > & { clerkId?: string };
        } catch {
          userInfo = createFallbackUserInfo(request) as ReturnType<
            typeof import('@/lib/auth/user-session').getSingleUserInfo
          > & { clerkId?: string };
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
  };
}
