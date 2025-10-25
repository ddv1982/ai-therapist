import { updateSessionSchema } from '@/lib/utils/validation';
import { withAuth, withValidationAndParams } from '@/lib/api/api-middleware';
import { verifySessionOwnership, getSessionWithMessages } from '@/lib/database/queries';
import { createSuccessResponse, createNotFoundErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';
import { enhancedErrorHandlers } from '@/lib/utils/error-utils';
import { getConvexHttpClient, anyApi } from '@/lib/convex/httpClient';

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
        sessionId: sessionId as any,
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

      const mapped = {
        id: String((updated as any)._id),
        userId: context.userInfo.userId,
        title: (updated as any).title as string,
        status: (updated as any).status as string,
        startedAt: new Date((updated as any).startedAt),
        updatedAt: new Date((updated as any).updatedAt),
        endedAt: (updated as any).endedAt ? new Date((updated as any).endedAt) : null,
        _count: { messages: (updated as any).messageCount ?? 0 },
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

    logger.info('Session fetched successfully', {
      requestId: context.requestId,
      sessionId,
      messageCount: (session as any).messages?.length ?? 0,
      userId: context.userInfo.userId
    });

    const s = session as any;
    const mapped = {
      id: String(s._id),
      userId: context.userInfo.userId,
      title: s.title as string,
      status: s.status as string,
      startedAt: new Date(s.startedAt),
      updatedAt: new Date(s.updatedAt),
      endedAt: s.endedAt ? new Date(s.endedAt) : null,
      _count: { messages: s.messageCount ?? 0 },
      messages: (Array.isArray(s.messages) ? s.messages : []).map((m: any) => ({
        id: String(m._id),
        sessionId: String(s._id),
        role: m.role,
        content: m.content,
        modelUsed: m.modelUsed ?? undefined,
        timestamp: new Date(m.timestamp),
        createdAt: new Date(m.createdAt),
      })),
      reports: (Array.isArray(s.reports) ? s.reports : []).map((r: any) => ({
        id: String(r._id),
        sessionId: String(s._id),
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
    await client.mutation(anyApi.sessions.remove, { sessionId: sessionId as any });

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
