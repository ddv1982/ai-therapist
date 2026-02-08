import { withAuth } from '@/lib/api/api-middleware';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundErrorResponse,
} from '@/lib/api/api-response';
import { enhancedErrorHandlers } from '@/lib/utils/errors';
import { getAuthenticatedConvexClient } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';
import { resumeSessionForPrincipal } from '@/server/application/sessions/resume-session';

export const POST = withAuth(async (_request, context, params) => {
  try {
    const { sessionId } = (await params) as { sessionId: string };

    if (!sessionId || sessionId.length === 0) {
      return createErrorResponse('Invalid session ID', 400, { requestId: context.requestId });
    }

    const convex = getAuthenticatedConvexClient(context.jwtToken);
    const resumed = await resumeSessionForPrincipal(context.principal, sessionId, convex);

    if (!resumed) {
      return createNotFoundErrorResponse('Session', context.requestId);
    }

    logger.info('Session resumed successfully', {
      requestId: context.requestId,
      sessionId,
      userId: context.principal.clerkId,
    });

    return createSuccessResponse(
      {
        id: resumed._id,
        userId: context.principal.clerkId,
        title: resumed.title,
        status: resumed.status,
        startedAt: new Date(resumed.startedAt),
        updatedAt: new Date(resumed.updatedAt),
        endedAt: resumed.endedAt ? new Date(resumed.endedAt) : null,
        _count: { messages: resumed.messageCount ?? 0 },
      },
      { requestId: context.requestId }
    );
  } catch (error) {
    return enhancedErrorHandlers.handleDatabaseError(error as Error, 'resume session', context);
  }
});
