import { updateSessionSchema } from '@/lib/utils/validation';
import { withAuth, withValidationAndParams } from '@/lib/api/api-middleware';
import { verifySessionOwnership, getSessionWithMessages } from '@/lib/repositories/session-repository';
import { createSuccessResponse, createNotFoundErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';
import { enhancedErrorHandlers } from '@/lib/utils/error-utils';
import { getConvexHttpClient, anyApi } from '@/lib/convex/http-client';
import type { ConvexSession, ConvexSessionWithMessagesAndReports } from '@/types/convex';

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
      const { sessionId } = await params as { sessionId: string };
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

      const client = getConvexHttpClient();
      const updated = await client.mutation(anyApi.sessions.update, {
        sessionId,
        status: updateData.status,
        endedAt: updateData.endedAt ? updateData.endedAt.getTime() : null,
        title: updateData.title,
      });

      logger.info('Session updated successfully', {
        requestId: context.requestId,
        sessionId,
        updatedFields: Object.keys(validatedData),
        userId: context.userInfo.userId
      });

      const convexSession = updated as ConvexSession;
      const mapped = {
        id: String(convexSession._id),
        userId: context.userInfo.userId,
        title: convexSession.title,
        status: convexSession.status,
        startedAt: new Date(convexSession.startedAt),
        updatedAt: new Date(convexSession.updatedAt),
        endedAt: convexSession.endedAt ? new Date(convexSession.endedAt) : null,
        _count: { messages: convexSession.messageCount ?? 0 },
      };
      return createSuccessResponse(mapped, { requestId: context.requestId });
    } catch (error) {
      return enhancedErrorHandlers.handleDatabaseError(
        error as Error,
        'update session',
        context
      );
    }
  }
);

export const GET = withAuth(async (_request, context, params) => {
  try {
    const { sessionId } = await params as { sessionId: string };

    const session = await getSessionWithMessages(sessionId, context.userInfo.userId);

    if (!session) {
      return createNotFoundErrorResponse('Session', context.requestId);
    }

    const sessionData = session as ConvexSessionWithMessagesAndReports;
    logger.info('Session fetched successfully', {
      requestId: context.requestId,
      sessionId,
      messageCount: sessionData.messages?.length ?? 0,
      userId: context.userInfo.userId
    });

    const mapped = {
      id: String(sessionData._id),
      userId: context.userInfo.userId,
      title: sessionData.title,
      status: sessionData.status,
      startedAt: new Date(sessionData.startedAt),
      updatedAt: new Date(sessionData.updatedAt),
      endedAt: sessionData.endedAt ? new Date(sessionData.endedAt) : null,
      _count: { messages: sessionData.messageCount ?? 0 },
      messages: (Array.isArray(sessionData.messages) ? sessionData.messages : []).map((m) => ({
        id: String(m._id),
        sessionId: String(sessionData._id),
        role: m.role,
        content: m.content,
        modelUsed: m.modelUsed ?? undefined,
        timestamp: new Date(m.timestamp),
        createdAt: new Date(m.createdAt),
      })),
      reports: (Array.isArray(sessionData.reports) ? sessionData.reports : []).map((r) => ({
        id: String(r._id),
        sessionId: String(sessionData._id),
        reportContent: r.reportContent,
        keyPoints: r.keyPoints,
        therapeuticInsights: r.therapeuticInsights,
        patternsIdentified: r.patternsIdentified,
        actionItems: r.actionItems,
        moodAssessment: r.moodAssessment ?? null,
        progressNotes: r.progressNotes ?? null,
        createdAt: new Date(r.createdAt),
      })),
    };
    return createSuccessResponse(mapped, { requestId: context.requestId });
  } catch (error) {
    return enhancedErrorHandlers.handleDatabaseError(
      error as Error,
      'fetch session',
      context
    );
  }
});

export const DELETE = withAuth(async (_request, context, params) => {
  try {
    const { sessionId } = await params as { sessionId: string };

    // Verify session belongs to this user before deleting
    const { valid } = await verifySessionOwnership(sessionId, context.userInfo.userId);
    if (!valid) {
      return createNotFoundErrorResponse('Session', context.requestId);
    }

    const client = getConvexHttpClient();
    await client.mutation(anyApi.sessions.remove, { sessionId });

    logger.info('Session deleted successfully', {
      requestId: context.requestId,
      sessionId,
      userId: context.userInfo.userId
    });

    return createSuccessResponse({ success: true }, { requestId: context.requestId });
  } catch (error) {
    return enhancedErrorHandlers.handleDatabaseError(
      error as Error,
      'delete session',
      context
    );
  }
});
