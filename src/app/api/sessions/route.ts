import { createSessionSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { withValidation, withAuth } from '@/lib/api/api-middleware';
import { enhancedErrorHandlers } from '@/lib/utils/errors';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { getAuthenticatedConvexClient } from '@/lib/convex/http-client';
import { ErrorCode } from '@/lib/errors/error-codes';
import { createSessionForPrincipal } from '@/server/application/sessions/create-session';
import { listSessionsForPrincipal } from '@/server/application/sessions/list-sessions';

export const POST = withValidation(
  createSessionSchema,
  async (_request, context, validatedData) => {
    try {
      const { title } = validatedData;
      const convex = getAuthenticatedConvexClient(context.jwtToken);

      const result = await createSessionForPrincipal({
        principal: context.principal,
        title,
        convex,
      });

      if ('status' in result) {
        return createErrorResponse(result.message, result.status, {
          code: result.code,
          details: result.details,
          suggestedAction: result.suggestedAction,
          requestId: context.requestId,
        });
      }

      const { session } = result;

      logger.info('Session created successfully', {
        requestId: context.requestId,
        sessionId: session._id,
        userId: context.principal.clerkId,
      });

      const mapped = {
        id: session._id,
        userId: context.principal.clerkId,
        title: session.title,
        status: session.status,
        startedAt: new Date(session.startedAt),
        updatedAt: new Date(session.updatedAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
        _count: { messages: session.messageCount ?? 0 },
      };

      return createSuccessResponse(mapped, { requestId: context.requestId });
    } catch (error) {
      return enhancedErrorHandlers.handleDatabaseError(error as Error, 'create session', context);
    }
  }
);

export const GET = withAuth(async (request, context) => {
  try {
    logger.debug('Fetching sessions', context);

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const cursorParam = url.searchParams.get('cursor');
    const offsetParam = url.searchParams.get('offset');

    if (offsetParam !== null) {
      return createErrorResponse('Offset pagination is no longer supported', 400, {
        code: ErrorCode.INVALID_INPUT,
        details: 'Use cursor-based pagination with `cursor` instead of `offset`',
        suggestedAction: 'Remove `offset` and use the `nextCursor` from a previous response',
        requestId: context.requestId,
      });
    }

    let limit: number | undefined;
    if (limitParam !== null) {
      const parsedLimit = Number(limitParam);
      const isStrictInteger = /^\d+$/.test(limitParam) && Number.isSafeInteger(parsedLimit);
      if (!isStrictInteger || parsedLimit < 1 || parsedLimit > 100) {
        return createErrorResponse('Invalid limit query parameter', 400, {
          code: ErrorCode.INVALID_INPUT,
          details: 'limit must be an integer between 1 and 100',
          suggestedAction: 'Provide a valid `limit` value in the query string',
          requestId: context.requestId,
        });
      }
      limit = parsedLimit;
    }

    let cursor: string | undefined;
    if (cursorParam !== null) {
      const trimmedCursor = cursorParam.trim();
      if (!trimmedCursor) {
        return createErrorResponse('Invalid cursor query parameter', 400, {
          code: ErrorCode.INVALID_INPUT,
          details: 'cursor cannot be empty',
          suggestedAction: 'Use `nextCursor` from a previous /api/sessions response',
          requestId: context.requestId,
        });
      }
      cursor = trimmedCursor;
    }

    const convex = getAuthenticatedConvexClient(context.jwtToken);
    const data = await listSessionsForPrincipal(context.principal, { limit, cursor }, convex);

    logger.info('Sessions fetched successfully', {
      requestId: context.requestId,
      sessionCount: data.items.length,
      pagination: data.pagination,
    });

    return createSuccessResponse(data, { requestId: context.requestId });
  } catch (error) {
    return enhancedErrorHandlers.handleDatabaseError(error as Error, 'fetch sessions', context);
  }
});
