import { z } from 'zod';
import { withValidationAndParams } from '@/lib/api/api-middleware';
import { verifySessionOwnership } from '@/lib/database/queries';
import { createNotFoundErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { decryptMessage } from '@/lib/chat/message-encryption';
import { MessageCache } from '@/lib/cache';
import { enhancedErrorHandlers } from '@/lib/utils/error-utils';
import { getConvexHttpClient, anyApi } from '@/lib/convex/httpClient';

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

      const client = getConvexHttpClient();
      const existing = await client.query(anyApi.messages.getById, { messageId: messageId as any });

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

      const updated = await client.mutation(anyApi.messages.update, {
        messageId: messageId as any,
        metadata: nextMetadata as any,
      });

      try {
        await MessageCache.invalidate(sessionId);
      } catch {}

      const decrypted = decryptMessage({
        role: (updated as any).role,
        content: (updated as any).content,
        timestamp: new Date((updated as any).timestamp),
      });

      return createSuccessResponse({
        id: (updated as any)._id,
        sessionId,
        role: decrypted.role as 'user' | 'assistant',
        content: decrypted.content,
        modelUsed: (updated as any).modelUsed ?? undefined,
        metadata: nextMetadata,
        timestamp: decrypted.timestamp,
        createdAt: new Date((updated as any).createdAt),
      }, { requestId: context.requestId });
    } catch (error) {
      return enhancedErrorHandlers.handleDatabaseError(error as Error, 'update message metadata', context);
    }
  }
);
