import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/db';
import { logger, createRequestLogger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.debug('Fetching current active session', requestContext);
    
    // Get unified user ID for cross-device session access
    const { getSingleUserInfo } = await import('@/lib/auth/user-session');
    const userInfo = getSingleUserInfo(request);

    // Find the most recent active session with messages
    const currentSession = await prisma.session.findFirst({
      where: { 
        userId: userInfo.userId,
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
      logger.info('No active session found', requestContext);
      return NextResponse.json({ currentSession: null });
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
      ...requestContext,
      sessionId: currentSession.id,
      messageCount: currentSession._count.messages
    });

    return NextResponse.json({ currentSession: sessionInfo });
  } catch (error) {
    const err = error as Error;
    logger.databaseError('fetch current session', err, requestContext);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch current session',
        details: 'Unable to retrieve your current therapy session. Please refresh the page.',
        code: 'CURRENT_SESSION_FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.debug('Setting current active session', requestContext);
    
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get unified user ID for cross-device session access
    const { getSingleUserInfo } = await import('@/lib/auth/user-session');
    const userInfo = getSingleUserInfo(request);

    // Update the session's updatedAt to mark it as current
    const session = await prisma.session.update({
      where: { 
        id: sessionId,
        userId: userInfo.userId // Ensure user can only update their own sessions
      },
      data: {
        updatedAt: new Date(),
        status: 'active'
      },
    });

    logger.info('Current session updated', {
      ...requestContext,
      sessionId: session.id
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    const err = error as Error;
    logger.databaseError('set current session', err, requestContext);
    
    if (err.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to set current session',
        details: 'Unable to set your current therapy session. Please try again.',
        code: 'CURRENT_SESSION_SET_ERROR'
      },
      { status: 500 }
    );
  }
}