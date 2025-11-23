import type { ConvexHttpClient } from 'convex/browser';
import { encryptMessage, safeDecryptMessages } from '@/lib/chat/message-encryption';
import { anyApi } from '@/lib/convex/http-client';
import type { ConvexMessage } from '@/types/convex';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  modelUsed?: string | null;
}

export interface PaginatedMessagesResult {
  messages: StoredMessage[];
  continueCursor: string;
  isDone: boolean;
}

/**
 * Get messages with cursor-based pagination. Recommended for infinite scroll.
 */
export async function getSessionMessagesPaginated(
  sessionId: string,
  client: ConvexHttpClient,
  numItems?: number,
  cursor?: string
): Promise<PaginatedMessagesResult> {
  const result = await client.query(anyApi.messages.listBySessionPaginated, {
    sessionId,
    numItems,
    cursor,
  });

  const convexMessages = Array.isArray(result.page) ? (result.page as ConvexMessage[]) : [];
  const ordered = convexMessages.sort((a, b) => a.timestamp - b.timestamp);
  const decrypted = safeDecryptMessages(
    ordered.map((r) => ({ role: r.role, content: r.content, timestamp: new Date(r.timestamp) }))
  );

  const messages = ordered.map((r, i) => ({
    id: String(r._id),
    role: r.role as StoredMessage['role'],
    content: decrypted[i]?.content ?? '',
    createdAt: new Date(r.createdAt),
    modelUsed: r.modelUsed ?? undefined,
  }));

  return {
    messages,
    continueCursor: result.continueCursor,
    isDone: result.isDone,
  };
}

/**
 * Get all messages for a session. Use sparingly - prefer paginated version for large sessions.
 */
export async function getSessionMessages(
  sessionId: string,
  client: ConvexHttpClient
): Promise<StoredMessage[]> {
  const rows = await client.query(anyApi.messages.listBySession, { sessionId });
  const convexMessages = Array.isArray(rows) ? (rows as ConvexMessage[]) : [];
  const ordered = convexMessages.sort((a, b) => a.timestamp - b.timestamp);
  const decrypted = safeDecryptMessages(
    ordered.map((r) => ({ role: r.role, content: r.content, timestamp: new Date(r.timestamp) }))
  );
  return ordered.map((r, i) => ({
    id: String(r._id),
    role: r.role as StoredMessage['role'],
    content: decrypted[i]?.content ?? '',
    createdAt: new Date(r.createdAt),
    modelUsed: r.modelUsed ?? undefined,
  }));
}

export async function appendMessage(
  sessionId: string,
  role: StoredMessage['role'],
  content: string,
  client: ConvexHttpClient,
  modelUsed?: string
) {
  const encrypted = encryptMessage({ role, content, timestamp: new Date() });
  await client.mutation(anyApi.messages.create, {
    sessionId,
    role: encrypted.role,
    content: encrypted.content,
    timestamp: encrypted.timestamp.getTime(),
    modelUsed,
  });
}
