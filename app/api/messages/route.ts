import { prisma } from '@/lib/db';
import { messageSchema, messagesQuerySchema } from '@/lib/validation';
import { encryptMessage, safeDecryptMessages } from '@/lib/message-encryption';
import { withValidation, db, errorHandlers } from '@/lib/api-middleware';
import { createSuccessResponse, createNotFoundErrorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const POST = withValidation(
  messageSchema,
  async (request, context, validatedData) => {
    try {
      const { sessionId, role, content } = validatedData;

      // Verify session belongs to this user
      const { valid } = await db.verifySessionOwnership(sessionId, context.userInfo.userId);
      if (!valid) {
        return createNotFoundErrorResponse('Session', context.requestId);
      }

      // Encrypt the message before storing
      const encryptedMessageData = encryptMessage({
        role,
        content,
        timestamp: new Date()
      });

      const message = await prisma.message.create({
        data: {
          sessionId,
          role: encryptedMessageData.role,
          content: encryptedMessageData.content,
          timestamp: encryptedMessageData.timestamp,
        },
      });

      logger.info('Message created successfully', {
        requestId: context.requestId,
        messageId: message.id,
        sessionId,
        userId: context.userInfo.userId
      });

      // Return decrypted message for immediate use by client
      const responseMessage = {
        id: message.id,
        sessionId: message.sessionId,
        role,
        content, // Return original unencrypted content
        timestamp: message.timestamp,
        createdAt: message.createdAt
      };

      return createSuccessResponse(responseMessage, { requestId: context.requestId });
    } catch (error) {
      return errorHandlers.handleDatabaseError(
        error as Error,
        'create message',
        context
      );
    }
  }
);

export const GET = withValidation(
  messagesQuerySchema,
  async (request, context, validatedData) => {
    try {
      const { sessionId } = validatedData;

      // Verify session belongs to this user
      const { valid } = await db.verifySessionOwnership(sessionId, context.userInfo.userId);
      if (!valid) {
        return createNotFoundErrorResponse('Session', context.requestId);
      }

      const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
      });

      // Decrypt messages before returning to client
      const decryptedMessages = safeDecryptMessages(messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })));

      // Combine decrypted content with original message metadata
      const responseMessages = messages.map((msg, index) => ({
        id: msg.id,
        sessionId: msg.sessionId,
        role: decryptedMessages[index].role,
        content: decryptedMessages[index].content,
        timestamp: decryptedMessages[index].timestamp,
        createdAt: msg.createdAt
      }));

      logger.info('Messages fetched successfully', {
        requestId: context.requestId,
        sessionId,
        messageCount: responseMessages.length,
        userId: context.userInfo.userId
      });

      return createSuccessResponse(responseMessages, { requestId: context.requestId });
    } catch (error) {
      return errorHandlers.handleDatabaseError(
        error as Error,
        'fetch messages',
        context
      );
    }
  }
);