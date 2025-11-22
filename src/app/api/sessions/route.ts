import { createSessionSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { withValidation, withAuth } from '@/lib/api/api-middleware';
import { enhancedErrorHandlers } from '@/lib/utils/errors';
import { getUserSessions } from '@/lib/repositories/session-repository';
import { createSuccessResponse } from '@/lib/api/api-response';
import { deduplicateRequest } from '@/lib/utils/helpers';
import { SessionCache } from '@/lib/cache';
import { getConvexHttpClientWithAuth, anyApi } from '@/lib/convex/http-client';
import type { ConvexSession, ConvexUser } from '@/types/convex';

export const POST = withValidation(
  createSessionSchema,
  async (_request, context, validatedData) => {
    try {
      const { title } = validatedData;

      // Deduplicate session creation to prevent double-clicks creating multiple sessions
      const session = (await deduplicateRequest(
        (context.userInfo as { clerkId?: string }).clerkId ?? '',
        'create_session',
        async () => {
          const client = getConvexHttpClientWithAuth(context.jwtToken || '');
          const user = (await client.mutation(anyApi.users.ensureByClerkId, {
            clerkId: (context.userInfo as { clerkId?: string }).clerkId ?? '',
            email: context.userInfo.email,
            name: context.userInfo.name,
          })) as ConvexUser;
          return (await client.mutation(anyApi.sessions.create, {
            userId: user._id,
            title,
          })) as ConvexSession;
        },
        title, // Use title as additional resource identifier
        10000 // 10 second TTL for session creation
      )) as ConvexSession;

      logger.info('Session created successfully', {
        requestId: context.requestId,
        sessionId: session._id,
        userId: context.userInfo.userId,
      });

      // Cache the new session data
      await SessionCache.set(session._id, {
        id: session._id,
        userId: (context.userInfo as { clerkId?: string }).clerkId ?? '',
        title: session.title,
        status: session.status as 'active' | 'inactive' | 'archived',
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      });

      const mapped = {
        id: session._id,
        userId: (context.userInfo as { clerkId?: string }).clerkId ?? '',
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

    // Extract pagination parameters from query string
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!, 10)
      : undefined;
    const offset = url.searchParams.get('offset')
      ? parseInt(url.searchParams.get('offset')!, 10)
      : undefined;

    const result = await getUserSessions((context.userInfo as { clerkId?: string }).clerkId ?? '', {
      limit,
      offset,
    });
    const mapped = (Array.isArray(result.items) ? result.items : []).map((s: ConvexSession) => ({
      id: s._id,
      userId: (context.userInfo as { clerkId?: string }).clerkId ?? '',
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
