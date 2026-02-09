import type { ConvexHttpClient } from 'convex/browser';
import { anyApi } from '@/lib/convex/http-client';
import { verifySessionOwnership } from '@/lib/repositories/session-repository';
import type { SessionOwnershipResult, SessionWithMessages } from '@/types/database';
import type { ConvexMessage } from '@/types/convex';

export type ApiChatMessage = { role: 'user' | 'assistant'; content: string; id?: string };
export type SessionOwnership = SessionOwnershipResult;

export async function resolveSessionOwnership(
  sessionId: string | undefined,
  userId: string,
  client: ConvexHttpClient
): Promise<SessionOwnership> {
  if (!sessionId) {
    return { valid: false } as SessionOwnership;
  }
  return verifySessionOwnership(sessionId, userId, { includeMessages: true }, client);
}

export async function loadSessionHistory(
  sessionId: string,
  ownership: SessionOwnership,
  client: ConvexHttpClient
): Promise<ApiChatMessage[]> {
  const historyLimit = 30;
  const sessionWithMessages: SessionWithMessages | undefined =
    ownership.session && 'messages' in ownership.session
      ? (ownership.session as SessionWithMessages)
      : undefined;

  const sessionMessagesRaw =
    sessionWithMessages?.messages ??
    (await (async () => {
      const all = (await client.query(anyApi.messages.listBySession, {
        sessionId,
      })) as ConvexMessage[];
      return Array.isArray(all) ? all : [];
    })());

  const sessionMessages = sessionMessagesRaw
    .map((message) => ({
      id: 'id' in message ? ((message as { id?: string }).id ?? message._id) : message._id,
      role: message.role,
      content: message.content,
      timestamp: new Date(
        typeof message.timestamp === 'number'
          ? message.timestamp
          : new Date(message.timestamp).getTime()
      ),
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-historyLimit);

  const { safeDecryptMessages } = await import('@/features/chat/lib/message-encryption');
  const decrypted = safeDecryptMessages(
    sessionMessages.map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    }))
  );

  return decrypted.map((message, index) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content,
    id: sessionMessages[index]?.id,
  }));
}
