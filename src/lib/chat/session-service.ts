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

/**
 * Ensure a session exists
 * @deprecated This function is deprecated - sessions should be created through
 * authenticated endpoints with a valid Clerk user. Keeping for backwards compatibility
 * but will throw in production environments without proper authentication.
 */
export async function ensureSession(sessionId?: string): Promise<string> {
  if (sessionId) return sessionId;
  
  // This path should not be reached in production
  throw new Error(
    'Cannot create session without authentication. ' +
    'Sessions must be created through authenticated endpoints with a valid Clerk user.'
  );
}
