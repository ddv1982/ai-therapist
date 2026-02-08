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

    // Extract pagination parameters from query string
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!, 10)
      : undefined;
    const offset = url.searchParams.get('offset')
      ? parseInt(url.searchParams.get('offset')!, 10)
      : undefined;

    const result = await getUserSessions(
      context.principal.clerkId,
      {
        limit,
        offset,
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
