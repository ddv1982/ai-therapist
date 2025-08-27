import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/db';
import { encryptMessage, safeDecryptMessages } from '@/lib/chat/message-encryption';
import { withAuth, withValidationAndParams, errorHandlers } from '@/lib/api/api-middleware';
import { verifySessionOwnership } from '@/lib/database/queries';
import { createSuccessResponse, createNotFoundErrorResponse, createPaginatedResponse } from '@/lib/api/api-response';

const postBodySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty').max(50000, 'Message content too long'),
  modelUsed: z.string().min(1).max(100).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
});

export const POST = withValidationAndParams(
  postBodySchema,
  async (_request, context, validatedData, params) => {
    try {
      const { sessionId } = params as { sessionId: string };

      const { valid } = await verifySessionOwnership(sessionId, context.userInfo.userId);
      if (!valid) {
        return createNotFoundErrorResponse('Session', context.requestId);
      }

      const encrypted = encryptMessage({
        role: validatedData.role,
        content: validatedData.content,
        timestamp: new Date(),
      });

      const message = await prisma.message.create({
        data: {
          sessionId,
          role: encrypted.role,
          content: encrypted.content,
          modelUsed: validatedData.modelUsed,
          timestamp: encrypted.timestamp,
        },
      });

      return createSuccessResponse({
        id: message.id,
        sessionId,
        role: validatedData.role,
        content: validatedData.content,
        modelUsed: validatedData.modelUsed,
        timestamp: message.timestamp,
        createdAt: message.createdAt,
      }, { requestId: context.requestId });
    } catch (error) {
      return errorHandlers.handleDatabaseError(error as Error, 'create message (nested)', context);
    }
  }
);

export const GET = withAuth(async (request: NextRequest, context, params) => {
  try {
    const { sessionId } = params as { sessionId: string };

    const { valid } = await verifySessionOwnership(sessionId, context.userInfo.userId);
    if (!valid) {
      return createNotFoundErrorResponse('Session', context.requestId);
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    const page = parsed.success ? (parsed.data.page ?? 1) : 1;
    const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;

    const total = await prisma.message.count({ where: { sessionId } });
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const decrypted = safeDecryptMessages(messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })));

    const items = messages.map((m, i) => ({
      id: m.id,
      sessionId: m.sessionId,
      role: decrypted[i].role,
      content: decrypted[i].content,
      modelUsed: m.modelUsed ?? undefined,
      timestamp: decrypted[i].timestamp,
      createdAt: m.createdAt,
    }));

    return createPaginatedResponse(items, page, limit, total, context.requestId);
  } catch (error) {
    return errorHandlers.handleDatabaseError(error as Error, 'fetch messages (nested)', context);
  }
});
