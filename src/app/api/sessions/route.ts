import { prisma } from '@/lib/database/db';
import { createSessionSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { withValidation, withAuth, db, errorHandlers } from '@/lib/api/api-middleware';
import { createSuccessResponse } from '@/lib/api/api-response';

export const POST = withValidation(
  createSessionSchema,
  async (request, context, validatedData) => {
    try {
      const { title } = validatedData;

      // Ensure user exists in database
      const userExists = await db.ensureUserExists(context.userInfo);
      if (!userExists) {
        throw new Error('Failed to ensure user exists');
      }

      const session = await prisma.session.create({
        data: {
          userId: context.userInfo.userId,
          title,
          status: 'active',
        },
      });

      logger.info('Session created successfully', {
        requestId: context.requestId,
        sessionId: session.id,
        userId: context.userInfo.userId
      });

      return createSuccessResponse(session, { requestId: context.requestId });
    } catch (error) {
      return errorHandlers.handleDatabaseError(
        error as Error,
        'create session',
        context
      );
    }
  }
);

export const GET = withAuth(async (_request, context) => {
  try {
    logger.debug('Fetching sessions', context);

    const sessions = await db.getUserSessions(context.userInfo.userId);

    logger.info('Sessions fetched successfully', {
      requestId: context.requestId,
      sessionCount: sessions.length
    });

    return createSuccessResponse(sessions, { requestId: context.requestId });
  } catch (error) {
    return errorHandlers.handleDatabaseError(
      error as Error,
      'fetch sessions',
      context
    );
  }
});