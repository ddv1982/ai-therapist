import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/database/db';
import { withValidationAndParams } from '@/lib/api/api-middleware';
import { verifySessionOwnership } from '@/lib/database/queries';
import { createNotFoundErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { decryptMessage } from '@/lib/chat/message-encryption';
import { MessageCache } from '@/lib/cache';
import { enhancedErrorHandlers } from '@/lib/utils/error-utils';

const patchBodySchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
  mergeStrategy: z.enum(['merge', 'replace']).optional(),
});

export const PATCH = withValidationAndParams(
  patchBodySchema,
  async (_request, context, validatedData, params) => {
    try {
      const { sessionId, messageId } = params as { sessionId: string; messageId: string };

      const { valid } = await verifySessionOwnership(sessionId, context.userInfo.userId);
      if (!valid) {
        return createNotFoundErrorResponse('Session', context.requestId);
      }

      const existing = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!existing || existing.sessionId !== sessionId) {
        return createNotFoundErrorResponse('Message', context.requestId);
      }

      const currentMetadata = (existing.metadata as Record<string, unknown> | null) ?? {};

      const sanitizedMetadata = validatedData.metadata
        ? JSON.parse(JSON.stringify(validatedData.metadata)) as Record<string, unknown>
        : undefined;

      const nextMetadata: Record<string, unknown> = (() => {
        if (!sanitizedMetadata) return currentMetadata;
        if (validatedData.mergeStrategy === 'replace') {
          return sanitizedMetadata;
        }
        return {
          ...currentMetadata,
          ...sanitizedMetadata,
        };
      })();

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          metadata: nextMetadata as Prisma.InputJsonValue,
        },
      });

      try {
        await MessageCache.invalidate(sessionId);
      } catch {}

      const decrypted = decryptMessage({
        role: updated.role,
        content: updated.content,
        timestamp: updated.timestamp,
      });

      return createSuccessResponse({
        id: updated.id,
        sessionId: updated.sessionId,
        role: decrypted.role as 'user' | 'assistant',
        content: decrypted.content,
        modelUsed: updated.modelUsed ?? undefined,
        metadata: nextMetadata,
        timestamp: decrypted.timestamp,
        createdAt: updated.createdAt,
      }, { requestId: context.requestId });
    } catch (error) {
      return enhancedErrorHandlers.handleDatabaseError(error as Error, 'update message metadata', context);
    }
  }
);
