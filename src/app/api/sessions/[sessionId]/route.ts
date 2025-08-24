import { prisma } from '@/lib/database/db';
import { updateSessionSchema } from '@/lib/utils/validation';
import { withAuth, withValidationAndParams, errorHandlers } from '@/lib/api/api-middleware';
import { verifySessionOwnership, getSessionWithMessages } from '@/lib/database/queries';
import { createSuccessResponse, createNotFoundErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';

interface SessionUpdateData {
  updatedAt: Date;
  status?: string;
  endedAt?: Date | null;
  title?: string;
}

export const PATCH = withValidationAndParams(
  updateSessionSchema,
  async (_request, context, validatedData, params) => {
    try {
      const { sessionId } = params as { sessionId: string };
      const { status, endedAt, title } = validatedData;

      // Verify session belongs to this user
      const { valid } = await verifySessionOwnership(sessionId, context.userInfo.userId);
      if (!valid) {
        return createNotFoundErrorResponse('Session', context.requestId);
      }

      const updateData: SessionUpdateData = {
        updatedAt: new Date(),
      };

      if (status !== undefined) updateData.status = status;
      if (endedAt !== undefined) updateData.endedAt = endedAt ? new Date(endedAt) : null;
      if (title !== undefined) updateData.title = title;

      const session = await prisma.session.update({
        where: { 
          id: sessionId,
          userId: context.userInfo.userId
        },
        data: updateData,
      });

      logger.info('Session updated successfully', {
        requestId: context.requestId,
        sessionId,
        updatedFields: Object.keys(validatedData),
        userId: context.userInfo.userId
      });

      return createSuccessResponse(session, { requestId: context.requestId });
    } catch (error) {
      return errorHandlers.handleDatabaseError(
        error as Error,
        'update session',
        context
      );
    }
  }
);

export const GET = withAuth(async (_request, context, params) => {
  try {
    const { sessionId } = params as { sessionId: string };

    const session = await getSessionWithMessages(sessionId, context.userInfo.userId);

    if (!session) {
      return createNotFoundErrorResponse('Session', context.requestId);
    }

    logger.info('Session fetched successfully', {
      requestId: context.requestId,
      sessionId,
      messageCount: session.messages.length,
      userId: context.userInfo.userId
    });

    return createSuccessResponse(session, { requestId: context.requestId });
  } catch (error) {
    return errorHandlers.handleDatabaseError(
      error as Error,
      'fetch session',
      context
    );
  }
});

export const DELETE = withAuth(async (_request, context, params) => {
  try {
    const { sessionId } = params as { sessionId: string };

    // Verify session belongs to this user before deleting
    const { valid } = await verifySessionOwnership(sessionId, context.userInfo.userId);
    if (!valid) {
      return createNotFoundErrorResponse('Session', context.requestId);
    }

    await prisma.session.delete({
      where: { 
        id: sessionId,
        userId: context.userInfo.userId
      },
    });

    logger.info('Session deleted successfully', {
      requestId: context.requestId,
      sessionId,
      userId: context.userInfo.userId
    });

    return createSuccessResponse({ success: true }, { requestId: context.requestId });
  } catch (error) {
    return errorHandlers.handleDatabaseError(
      error as Error,
      'delete session',
      context
    );
  }
});