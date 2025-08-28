import { prisma } from '@/lib/database/db';
import { createSessionSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { NextRequest } from 'next/server';
import { getUserSessions } from '@/lib/database/queries';
import { createSuccessResponse, createServerErrorResponse } from '@/lib/api/api-response';
import { getSingleUserInfo } from '@/lib/auth/user-session';

export const POST = async (request: NextRequest) => {
  try {
    // For demo purposes, skip auth and use a fixed user ID
    // In production, you'd validate JWT tokens here
    const userInfo = getSingleUserInfo(request);
    const userId = userInfo.userId;

    const validatedData = createSessionSchema.parse(await request.json());
    const { title } = validatedData;

    const session = await prisma.session.create({
      data: {
        userId,
        title,
        status: 'active',
      },
    });

    logger.info('Session created successfully', {
      requestId: 'session-create',
      sessionId: session.id,
      userId
    });

    return createSuccessResponse(session, { requestId: 'session-create' });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to create session', { error: err.message, requestId: 'session-create' });

    return createServerErrorResponse(err, 'session-create', {
      endpoint: '/api/sessions',
      operation: 'create session'
    });
  }
};

export const GET = async (request: NextRequest) => {
  try {
    logger.debug('Fetching sessions', { method: request.method, url: request.url });

    // For demo purposes, use a fixed user ID
    // In production, you'd extract user ID from authenticated JWT token
    const userInfo = getSingleUserInfo(request);
    const userId = userInfo.userId;
    const sessions = await getUserSessions(userId);

    logger.info('Sessions fetched successfully', {
      requestId: 'session-fetch',
      sessionCount: sessions.length
    });

    return createSuccessResponse(sessions, { requestId: 'session-fetch' });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to fetch sessions', { error: err.message, requestId: 'session-fetch' });

    return createServerErrorResponse(err, 'session-fetch', {
      endpoint: '/api/sessions',
      operation: 'fetch sessions'
    });
  }
};