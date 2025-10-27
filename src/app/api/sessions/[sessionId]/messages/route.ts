import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getConvexHttpClient, anyApi } from '@/lib/convex/http-client';
import { encryptMessage, safeDecryptMessages } from '@/lib/chat/message-encryption';
import { withAuth, withValidationAndParams } from '@/lib/api/api-middleware';
import { verifySessionOwnership } from '@/lib/repositories/session-repository';
import {
  createSuccessResponse,
  createNotFoundErrorResponse,
  createPaginatedResponse,
  addTherapeuticHeaders
} from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';
import { MessageCache } from '@/lib/cache';
import { env } from '@/config/env';
import type { MessageData as CacheMessageData } from '@/lib/cache/api-cache';
import { enhancedErrorHandlers } from '@/lib/utils/error-utils';
import type { ConvexMessage, ConvexSessionBundle } from '@/types/convex';

const metadataSchema = z.record(z.string(), z.unknown());

const postBodySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty').max(50000, 'Message content too long'),
  modelUsed: z.string().min(1).max(100).optional(),
  metadata: metadataSchema.optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
});

export const POST = withValidationAndParams(
  postBodySchema,
  async (request, context, validatedData, params) => {
    try {
      const { sessionId } = params as { sessionId: string };

      const { valid } = await verifySessionOwnership(sessionId, (context.userInfo as { clerkId?: string }).clerkId ?? '');
      if (!valid) {
        return createNotFoundErrorResponse('Session', context.requestId);
      }

      const encrypted = encryptMessage({
        role: validatedData.role,
        content: validatedData.content,
        timestamp: new Date(),
      });

      const sanitizedMetadata = validatedData.metadata
        ? JSON.parse(JSON.stringify(validatedData.metadata))
        : undefined;
      const client = getConvexHttpClient();
      const message = await client.mutation(anyApi.messages.create, {
        sessionId,
        role: encrypted.role,
        content: encrypted.content,
        modelUsed: validatedData.modelUsed,
        metadata: sanitizedMetadata,
        timestamp: encrypted.timestamp.getTime(),
      }) as ConvexMessage;
      // Fetch updated session to get messageCount
      const bundleAfter = await client.query(anyApi.sessions.getWithMessagesAndReports, { sessionId }) as ConvexSessionBundle;
      const messageCount = bundleAfter?.session?.messageCount ?? 0;

      // Title generation logic (based on user message count)
      if (validatedData.role === 'user') {
        // Count only user messages
        const allForCount = await client.query(anyApi.messages.listBySession, { sessionId }) as ConvexMessage[];
        const userMessageCount = Array.isArray(allForCount) ? allForCount.filter(m => m.role === 'user').length : 0;

        if (userMessageCount === 1) {
          // First user message: keep placeholder title; count already updated
        } else if (userMessageCount === 2 || userMessageCount === 4) {
          // Generate or regenerate title after 2 and 4 user messages
          const { generateChatTitle } = await import('@/lib/chat/title-generator');
          const { getApiRequestLocale } = await import('@/i18n/request');

          // Fetch first few user messages for context
          const allMsgs = await client.query(anyApi.messages.listBySession, { sessionId }) as ConvexMessage[];
          const firstMessages = allMsgs
            .filter(m => m.role === 'user')
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(0, 5)
            .map(m => ({ role: m.role, content: m.content, timestamp: new Date(m.timestamp) }));

          // Decrypt messages before generating title
          const decryptedFirst = safeDecryptMessages(firstMessages);

          const combinedContent = decryptedFirst
            .map(m => m.content)
            .join('\n\n');

          const locale = getApiRequestLocale(request);
          const title = await generateChatTitle(combinedContent, locale);

          await client.mutation(anyApi.sessions.update, { sessionId, title });
        } else {
          // Just increment message count
          // already incremented in messages.create
        }
      } else {
        // Assistant or other roles: just increment message count
        // already incremented in messages.create
      }

      // Invalidate message cache (optional caching)
      try { await MessageCache.invalidate(sessionId); } catch {}

      // Lightweight observability: log model if provided
      if (validatedData.modelUsed) {
        logger.info('Message POST model used', { apiEndpoint: '/api/sessions/[sessionId]/messages', requestId: context.requestId, modelId: validatedData.modelUsed });
      }

      return createSuccessResponse({
        id: message._id,
        sessionId,
        role: validatedData.role,
        content: validatedData.content,
        modelUsed: validatedData.modelUsed,
        metadata: sanitizedMetadata,
        timestamp: new Date(message.timestamp),
        createdAt: new Date(message.createdAt),
        messageCount,
      }, { requestId: context.requestId });
    } catch (error) {
      return enhancedErrorHandlers.handleDatabaseError(error as Error, 'create message (nested)', context);
    }
  }
);

export const GET = withAuth(
  async (request: NextRequest, context, params) => {
      try {
        const { sessionId } = await params as { sessionId: string };

        const { valid } = await verifySessionOwnership(sessionId, (context.userInfo as { clerkId?: string }).clerkId ?? '');
        if (!valid) {
          return createNotFoundErrorResponse('Session', context.requestId);
        }

        const { searchParams } = new URL(request.url);
        const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
        const page = parsed.success ? (parsed.data.page ?? 1) : 1;
        const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;

        const client = getConvexHttpClient();
        const all = await client.query(anyApi.messages.listBySession, { sessionId }) as ConvexMessage[];
        const total = Array.isArray(all) ? all.length : 0;

        const useCache = env.MESSAGES_CACHE_ENABLED;
        type MessageListItem = { id: string; sessionId: string; role: 'user' | 'assistant'; content: string; modelUsed?: string; timestamp: Date; createdAt: Date };
        let items: MessageListItem[] | null = null;
        if (useCache) {
          try {
            const cached = await MessageCache.get(sessionId, page, limit) as unknown;
            if (Array.isArray(cached)) {
              items = cached as unknown as MessageListItem[];
            }
          } catch {}
        }

        if (!items) {
          const ordered = all.sort((a, b) => a.timestamp - b.timestamp);
          const pageItems = ordered.slice((page - 1) * limit, (page - 1) * limit + limit);
          const decrypted = safeDecryptMessages(
            pageItems.map(m => ({ role: m.role, content: m.content, timestamp: new Date(m.timestamp) }))
          );
          items = pageItems.map((m, i) => ({
            id: m._id,
            sessionId: m.sessionId,
            role: (decrypted[i]?.role ?? m.role) as 'user' | 'assistant',
            content: decrypted[i]?.content ?? '',
            modelUsed: m.modelUsed ?? undefined,
            timestamp: decrypted[i]?.timestamp ?? new Date(m.timestamp),
            createdAt: new Date(m.createdAt),
            metadata: (m.metadata as Record<string, unknown> | null) ?? undefined,
          }));

          if (useCache) {
            try { await MessageCache.set(sessionId, items as unknown as CacheMessageData[], page, limit); } catch {}
          }
        }

        let response = createPaginatedResponse(items!, page, limit, total, context.requestId);
        response = addTherapeuticHeaders(response);
        return response;
      } catch (error) {
        logger.apiError('/api/sessions/[sessionId]/messages', error as Error, { requestId: context.requestId });
        return enhancedErrorHandlers.handleDatabaseError(error as Error, 'fetch messages (nested)', context);
      }
    }
);
