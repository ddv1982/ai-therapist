import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSessionSchema, validateRequest } from '@/lib/validation';
import { logger, createRequestLogger } from '@/lib/logger';
import { validateApiAuth, createAuthErrorResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    // Validate authentication first
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      logger.warn('Unauthorized session creation request', { ...requestContext, error: authResult.error });
      return createAuthErrorResponse(authResult.error || 'Authentication required');
    }
    
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

    // Get unified user ID for cross-device session access
    const { getSingleUserInfo } = await import('@/lib/user-session');
    const userInfo = getSingleUserInfo(request);

    // Create or get device-specific user
    await prisma.user.upsert({
      where: { id: userInfo.userId },
      update: {},
      create: {
        id: userInfo.userId,
        email: userInfo.email,
        name: userInfo.name,
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: userInfo.userId,
        title,
        status: 'active',
      },
    });

    logger.info('Session created successfully', {
      ...requestContext,
      sessionId: session.id,
      userId: userInfo.userId
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
    // Validate authentication first
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      logger.warn('Unauthorized sessions fetch request', { ...requestContext, error: authResult.error });
      return createAuthErrorResponse(authResult.error || 'Authentication required');
    }
    
    logger.debug('Fetching sessions', requestContext);
    
    // Get unified user ID for cross-device session access
    const { getSingleUserInfo } = await import('@/lib/user-session');
    const userInfo = getSingleUserInfo(request);

    const sessions = await prisma.session.findMany({
      where: { userId: userInfo.userId },
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