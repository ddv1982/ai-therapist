import { prisma } from '@/lib/database/db';
import { createSessionSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { withValidation, withAuth } from '@/lib/api/api-middleware';
import { enhancedErrorHandlers } from '@/lib/utils/error-utils';
import { getUserSessions } from '@/lib/database/queries';
import { createSuccessResponse } from '@/lib/api/api-response';
import { deduplicateRequest } from '@/lib/utils/request-deduplication';
import { SessionCache } from '@/lib/cache';

export const POST = withValidation(
  createSessionSchema,
  async (_request, context, validatedData) => {
    try {
      const { title } = validatedData;

      // Deduplicate session creation to prevent double-clicks creating multiple sessions
      const session = await deduplicateRequest(
        context.userInfo.userId,
        'create_session',
        async () => {
          // Use transaction to ensure user creation + session creation are atomic
          return await prisma.$transaction(async (tx) => {
            // Ensure user exists in database within transaction
            await tx.user.upsert({
              where: { id: context.userInfo.userId },
              update: {},
              create: {
                id: context.userInfo.userId,
                email: context.userInfo.email,
                name: context.userInfo.name,
              },
            });

            // Create session within the same transaction
            return await tx.session.create({
              data: {
                userId: context.userInfo.userId,
                title,
                status: 'active',
              },
            });
          });
        },
        title, // Use title as additional resource identifier
        10000 // 10 second TTL for session creation
      );

      logger.info('Session created successfully', {
        requestId: context.requestId,
        sessionId: session.id,
        userId: context.userInfo.userId
      });

      // Cache the new session data
      await SessionCache.set(session.id, {
        ...session,
        status: session.status as 'active' | 'inactive' | 'archived'
      });

      return createSuccessResponse(session, { requestId: context.requestId });
    } catch (error) {
      return enhancedErrorHandlers.handleDatabaseError(
        error as Error,
        'create session',
        context
      );
    }
  }
);

export const GET = withAuth(
  async (_request, context) => {
      try {
        logger.debug('Fetching sessions', context);

        const sessions = await getUserSessions(context.userInfo.userId);

        logger.info('Sessions fetched successfully', {
          requestId: context.requestId,
          sessionCount: sessions.length
        });

        return createSuccessResponse(sessions, { requestId: context.requestId });
      } catch (error) {
        return enhancedErrorHandlers.handleDatabaseError(
          error as Error,
          'fetch sessions',
          context
        );
      }
    }
);