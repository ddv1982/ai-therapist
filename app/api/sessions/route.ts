import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSessionSchema, validateRequest } from '@/lib/validation';
import { logger, createRequestLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.info('Creating new session', requestContext);
    
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(createSessionSchema, body);
    if (!validation.success) {
      logger.validationError('/api/sessions', validation.error, requestContext);
      return NextResponse.json(
        { error: `Validation failed: ${validation.error}` },
        { status: 400 }
      );
    }

    const { title } = validation.data;

    // Get device-specific user ID for privacy isolation
    const { getDeviceUserInfo } = await import('@/lib/user-session');
    const deviceUser = getDeviceUserInfo(request);

    // Create or get device-specific user
    await prisma.user.upsert({
      where: { id: deviceUser.userId },
      update: {},
      create: {
        id: deviceUser.userId,
        email: deviceUser.email,
        name: deviceUser.name,
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: deviceUser.userId,
        title,
        status: 'active',
      },
    });

    logger.info('Session created successfully', {
      ...requestContext,
      sessionId: session.id,
      userId: deviceUser.userId
    });

    return NextResponse.json(session);
  } catch (error) {
    const err = error as Error;
    logger.databaseError('create session', err, requestContext);
    
    // Check for specific database errors
    if (err.message.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { 
          error: 'Session creation failed',
          details: 'A session with this identifier already exists',
          code: 'DUPLICATE_SESSION'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create session',
        details: 'Unable to create a new therapy session. Please try again.',
        code: 'SESSION_CREATE_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.debug('Fetching sessions', requestContext);
    
    // Get device-specific user ID for privacy isolation
    const { getDeviceUserInfo } = await import('@/lib/user-session');
    const deviceUser = getDeviceUserInfo(request);

    const sessions = await prisma.session.findMany({
      where: { userId: deviceUser.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    logger.info('Sessions fetched successfully', {
      ...requestContext,
      sessionCount: sessions.length
    });

    return NextResponse.json(sessions);
  } catch (error) {
    const err = error as Error;
    logger.databaseError('fetch sessions', err, requestContext);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch sessions',
        details: 'Unable to retrieve your therapy sessions. Please refresh the page.',
        code: 'SESSION_FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}