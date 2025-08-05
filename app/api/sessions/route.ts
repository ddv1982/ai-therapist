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

    // For now, we'll use a default user ID
    // In a real app, this would come from authentication
    const defaultUserId = 'default-user-id';

    // Create or get default user
    await prisma.user.upsert({
      where: { id: defaultUserId },
      update: {},
      create: {
        id: defaultUserId,
        email: 'default@example.com',
        name: 'Default User',
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: defaultUserId,
        title,
        status: 'active',
      },
    });

    logger.info('Session created successfully', {
      ...requestContext,
      sessionId: session.id,
      userId: defaultUserId
    });

    return NextResponse.json(session);
  } catch (error) {
    logger.databaseError('create session', error as Error, requestContext);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.debug('Fetching sessions', requestContext);
    
    const sessions = await prisma.session.findMany({
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
    logger.databaseError('fetch sessions', error as Error, requestContext);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}