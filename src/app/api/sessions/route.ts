import { createSessionSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { withValidation, withAuth } from '@/lib/api/api-middleware';
import { enhancedErrorHandlers } from '@/lib/utils/errors';
import { getUserSessions } from '@/lib/repositories/session-repository';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { deduplicateRequest } from '@/lib/utils/helpers';
import { SessionCache } from '@/lib/cache';
import { getAuthenticatedConvexClient, anyApi } from '@/lib/convex/http-client';
import { ErrorCode } from '@/lib/errors/error-codes';
import { getTrustedClerkProfile } from '@/lib/auth/clerk-profile';
import type { ConvexSession, ConvexUser } from '@/types/convex';

export const POST = withValidation(
  createSessionSchema,
  async (_request, context, validatedData) => {
    try {
      const { title } = validatedData;
      const convex = getAuthenticatedConvexClient(context.jwtToken);
      const clerkId = context.principal.clerkId;
      let user = (await convex.query(anyApi.users.getByClerkId, {
        clerkId,
      })) as ConvexUser | null;

      if (!user) {
        const profile = await getTrustedClerkProfile(clerkId);
        if (!profile?.email) {
          logger.warn('Unable to bootstrap user profile for session creation', {
            requestId: context.requestId,
            clerkId: '[FILTERED]',
          });
          return createErrorResponse('Unable to create session at this time', 503, {
            code: ErrorCode.SERVICE_UNAVAILABLE,
            details: 'Unable to resolve a trusted user profile',
            suggestedAction: 'Please try again in a moment',
            requestId: context.requestId,
          });
        }

        user = (await convex.mutation(anyApi.users.ensureByClerkId, {
          clerkId,
          email: profile.email,
          name: profile.name,
        })) as ConvexUser | null;
      }

      if (!user?._id) {
        return createErrorResponse('Unable to create session at this time', 503, {
          code: ErrorCode.SERVICE_UNAVAILABLE,
          details: 'Failed to initialize user account',
          suggestedAction: 'Please try again in a moment',
          requestId: context.requestId,
        });
      }

      // Deduplicate session creation to prevent double-clicks creating multiple sessions
      const session = (await deduplicateRequest(
        clerkId,
        'create_session',
        async () =>
          (await convex.mutation(anyApi.sessions.create, {
            userId: user._id,
            title,
          })) as ConvexSession,
        title, // Use title as additional resource identifier
        10000 // 10 second TTL for session creation
      )) as ConvexSession;

      logger.info('Session created successfully', {
        requestId: context.requestId,
        sessionId: session._id,
        userId: context.principal.clerkId,
      });

      // Cache the new session data
      await SessionCache.set(session._id, {
        id: session._id,
        userId: clerkId,
        title: session.title,
        status: session.status as 'active' | 'completed',
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      });

      const mapped = {
        id: session._id,
        userId: clerkId,
        title: session.title,
        status: session.status,
        startedAt: new Date(session.startedAt),
        updatedAt: new Date(session.updatedAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
        _count: { messages: session.messageCount ?? 0 },
      };

      return createSuccessResponse(mapped, { requestId: context.requestId });
    } catch (error) {
      return enhancedErrorHandlers.handleDatabaseError(error as Error, 'create session', context);
    }
  }
);

export const GET = withAuth(async (request, context) => {
  try {
    logger.debug('Fetching sessions', context);
    const convex = getAuthenticatedConvexClient(context.jwtToken);

    // Extract cursor pagination parameters from query string
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const cursorParam = url.searchParams.get('cursor');
    const offsetParam = url.searchParams.get('offset');

    if (offsetParam !== null) {
      return createErrorResponse('Offset pagination is no longer supported', 400, {
        code: ErrorCode.INVALID_INPUT,
        details: 'Use cursor-based pagination with `cursor` instead of `offset`',
        suggestedAction: 'Remove `offset` and use the `nextCursor` from a previous response',
        requestId: context.requestId,
      });
    }

    let limit: number | undefined;
    if (limitParam !== null) {
      const parsedLimit = Number.parseInt(limitParam, 10);
      if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return createErrorResponse('Invalid limit query parameter', 400, {
          code: ErrorCode.INVALID_INPUT,
          details: 'limit must be an integer between 1 and 100',
          suggestedAction: 'Provide a valid `limit` value in the query string',
          requestId: context.requestId,
        });
      }
      limit = parsedLimit;
    }

    let cursor: string | undefined;
    if (cursorParam !== null) {
      const trimmedCursor = cursorParam.trim();
      if (!trimmedCursor) {
        return createErrorResponse('Invalid cursor query parameter', 400, {
          code: ErrorCode.INVALID_INPUT,
          details: 'cursor cannot be empty',
          suggestedAction: 'Use `nextCursor` from a previous /api/sessions response',
          requestId: context.requestId,
        });
      }
      cursor = trimmedCursor;
    }

    const result = await getUserSessions(
      context.principal.clerkId,
      {
        limit,
        cursor,
      },
      convex
    );
    const mapped = (Array.isArray(result.items) ? result.items : []).map((s: ConvexSession) => ({
      id: s._id,
      userId: context.principal.clerkId,
      title: s.title,
      status: s.status,
      startedAt: new Date(s.startedAt),
      updatedAt: new Date(s.updatedAt),
      endedAt: s.endedAt ? new Date(s.endedAt) : null,
      _count: { messages: s.messageCount ?? 0 },
    }));

    logger.info('Sessions fetched successfully', {
      requestId: context.requestId,
      sessionCount: result.items.length,
      pagination: result.pagination,
    });

    return createSuccessResponse(
      {
        items: mapped,
        pagination: result.pagination,
      },
      { requestId: context.requestId }
    );
  } catch (error) {
    return enhancedErrorHandlers.handleDatabaseError(error as Error, 'fetch sessions', context);
  }
});
