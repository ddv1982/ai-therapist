import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database/db';
import { logger } from '@/lib/utils/logger';
import { withAuth } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

export const GET = withAuth(async (_request, context) => {
  try {
    logger.debug('Fetching current active session', context);
    
    // Get unified user ID for cross-device session access
    const userId = context.userInfo.userId;

    // Find the most recent active session with messages
    const currentSession = await prisma.session.findFirst({
      where: { 
        userId: userId,
        status: 'active'
      },
      orderBy: [
        { updatedAt: 'desc' }, // Most recently updated first
        { createdAt: 'desc' }  // Then most recently created
      ],
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 1 // Just check if messages exist
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    if (!currentSession) {
      logger.info('No active session found', context);
      return createSuccessResponse({ currentSession: null }, { requestId: context.requestId });
    }

    // Return session info without all messages (for performance)
    const sessionInfo = {
      id: currentSession.id,
      title: currentSession.title,
      startedAt: currentSession.startedAt,
      updatedAt: currentSession.updatedAt,
      status: currentSession.status,
      messageCount: currentSession._count.messages
    };

    logger.info('Current session found', {
      ...context,
      sessionId: currentSession.id,
      messageCount: currentSession._count.messages
    });

    return createSuccessResponse({ currentSession: sessionInfo }, { requestId: context.requestId });
  } catch {
    return createErrorResponse('Failed to fetch current session', 500, { requestId: context.requestId });
  }
});

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    logger.debug('Setting current active session', context);
    const body = await request.json();
    const { sessionId } = body as { sessionId?: string };
    if (!sessionId) {
      return createErrorResponse('Session ID is required', 400, { requestId: context.requestId });
    }

    // Update the session's updatedAt to mark it as current
    const session = await prisma.session.update({
      where: { 
        id: sessionId,
        userId: context.userInfo.userId
      },
      data: {
        updatedAt: new Date(),
        status: 'active'
      },
    });

    logger.info('Current session updated', {
      ...context,
      sessionId: session.id
    });

    return createSuccessResponse({ success: true, session }, { requestId: context.requestId });
  } catch (error) {
    const err = error as Error;
    if (typeof err.message === 'string' && err.message.includes('Record to update not found')) {
      return createErrorResponse('Session not found or access denied', 404, { requestId: context.requestId });
    }
    return createErrorResponse('Failed to set current session', 500, { requestId: context.requestId });
  }
});