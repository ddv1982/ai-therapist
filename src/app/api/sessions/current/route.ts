import { NextRequest } from 'next/server';
import { getAuthenticatedConvexClient, anyApi } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';
import { withAuth, withValidation } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { z } from 'zod';
import type { ConvexUser, ConvexSession } from '@/types/convex';

export const GET = withAuth(async (_request, context) => {
  try {
    logger.debug('Fetching current active session', context);
    const convex = getAuthenticatedConvexClient(context.jwtToken);

    // Use Clerk ID as the primary user identity
    const clerkId = (context.userInfo as { clerkId?: string }).clerkId ?? '';

    // Find the most recent active session with messages
    const user = (await convex.query(anyApi.users.getByClerkId, { clerkId })) as ConvexUser | null;
    const sessions = user
      ? ((await convex.query(anyApi.sessions.listByUser, { userId: user._id })) as ConvexSession[])
      : [];
    const currentSession = Array.isArray(sessions)
      ? sessions
          .filter((s) => s.status === 'active')
          .sort((a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt)[0]
      : null;

    if (!currentSession) {
      logger.info('No active session found', context);
      return createSuccessResponse({ currentSession: null }, { requestId: context.requestId });
    }

    // Return session info without all messages (for performance)
    const sessionInfo = {
      id: currentSession._id,
      title: currentSession.title,
      startedAt: new Date(currentSession.startedAt),
      updatedAt: new Date(currentSession.updatedAt),
      status: currentSession.status,
      messageCount: currentSession.messageCount,
    };

    logger.info('Current session found', {
      ...context,
      sessionId: currentSession._id,
      messageCount: currentSession.messageCount,
    });

    return createSuccessResponse({ currentSession: sessionInfo }, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('Failed to fetch current session', error as Error, context);
    return createErrorResponse('Failed to fetch current session', 500, {
      requestId: context.requestId,
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const setCurrentSessionSchema = z.object({ sessionId: z.string() });

export const POST = withValidation(
  setCurrentSessionSchema,
  async (_request: NextRequest, context, validated) => {
    try {
      logger.debug('Setting current active session', context);
      const { sessionId } = validated;
      const convex = getAuthenticatedConvexClient(context.jwtToken);

      // Update the session's updatedAt to mark it as current
      const session = (await convex.mutation(anyApi.sessions.update, {
        sessionId,
        status: 'active',
      })) as ConvexSession;

      logger.info('Current session updated', {
        ...context,
        sessionId: session._id,
      });

      return createSuccessResponse({ success: true, session }, { requestId: context.requestId });
    } catch (error) {
      const err = error as Error;
      if (typeof err.message === 'string' && err.message.includes('Record to update not found')) {
        return createErrorResponse('Session not found or access denied', 404, {
          requestId: context.requestId,
        });
      }
      return createErrorResponse('Failed to set current session', 500, {
        requestId: context.requestId,
      });
    }
  }
);
