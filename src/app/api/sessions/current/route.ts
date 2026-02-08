import { NextRequest } from 'next/server';
import { getAuthenticatedConvexClient, anyApi } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';
import { withAuth, withValidation } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { z } from 'zod';
import type { ConvexUser, ConvexSession } from '@/types/convex';
import { setCurrentSessionPointer } from '@/server/application/sessions/set-current-session';

export const GET = withAuth(async (_request, context) => {
  try {
    logger.debug('Fetching current active session', context);
    const convex = getAuthenticatedConvexClient(context.jwtToken);

    const clerkId = context.principal.clerkId;

    const user = (await convex.query(anyApi.users.getByClerkId, { clerkId })) as ConvexUser | null;

    let currentSession: ConvexSession | null = null;
    if (user?.currentSessionId) {
      try {
        currentSession = (await convex.query(anyApi.sessions.get, {
          sessionId: user.currentSessionId,
        })) as ConvexSession;
      } catch (err) {
        logger.warn('Stale current session pointer detected', {
          ...context,
          sessionId: user.currentSessionId,
          error: err instanceof Error ? err.message : String(err),
        });
        await convex.mutation(anyApi.users.setCurrentSession, { sessionId: null });
      }
    }

    if (!currentSession && user) {
      const sessions = (await convex.query(anyApi.sessions.listByUser, {
        userId: user._id,
      })) as ConvexSession[];
      currentSession = Array.isArray(sessions)
        ? (sessions
            .filter((s) => s.status === 'active')
            .sort((a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt)[0] ?? null)
        : null;
    }

    if (!currentSession) {
      logger.info('No active session found', context);
      return createSuccessResponse({ currentSession: null }, { requestId: context.requestId });
    }

    const sessionInfo = {
      id: currentSession._id,
      userId: clerkId,
      title: currentSession.title,
      status: currentSession.status,
      startedAt: new Date(currentSession.startedAt),
      updatedAt: new Date(currentSession.updatedAt),
      endedAt: currentSession.endedAt ? new Date(currentSession.endedAt) : null,
      createdAt: new Date(currentSession.createdAt),
      _count: { messages: currentSession.messageCount ?? 0 },
    };

    logger.info('Current session found', {
      ...context,
      sessionId: currentSession._id,
      messageCount: currentSession.messageCount ?? 0,
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

const setCurrentSessionSchema = z.object({ sessionId: z.string().min(1) });

export const POST = withValidation(
  setCurrentSessionSchema,
  async (_request: NextRequest, context, validated) => {
    try {
      logger.debug('Setting current session pointer', context);
      const { sessionId } = validated;
      const convex = getAuthenticatedConvexClient(context.jwtToken);

      const session = await setCurrentSessionPointer(context.principal, sessionId, convex);

      if (!session) {
        return createErrorResponse('Session not found or access denied', 404, {
          requestId: context.requestId,
        });
      }

      logger.info('Current session pointer updated', {
        ...context,
        sessionId: session._id,
      });

      const mappedSession = {
        id: session._id,
        userId: context.principal.clerkId,
        title: session.title,
        status: session.status,
        startedAt: new Date(session.startedAt),
        updatedAt: new Date(session.updatedAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
        _count: { messages: session.messageCount ?? 0 },
      };

      return createSuccessResponse(
        { success: true, session: mappedSession },
        { requestId: context.requestId }
      );
    } catch (error) {
      const err = error as Error;
      if (
        typeof err.message === 'string' &&
        (err.message.includes('Record to update not found') || err.message.includes('Invalid ID'))
      ) {
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

export const DELETE = withAuth(async (_request, context) => {
  try {
    logger.debug('Clearing current session pointer', context);
    const convex = getAuthenticatedConvexClient(context.jwtToken);
    await convex.mutation(anyApi.users.setCurrentSession, { sessionId: null });
    return createSuccessResponse({ success: true }, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('Failed to clear current session', error as Error, context);
    return createErrorResponse('Failed to clear current session', 500, {
      requestId: context.requestId,
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
