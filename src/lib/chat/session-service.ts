import { encryptMessage, safeDecryptMessages } from '@/lib/chat/message-encryption';
import { getConvexHttpClient, anyApi } from '@/lib/convex/http-client';
import type { ConvexMessage, ConvexUser, ConvexSession } from '@/types/convex';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  modelUsed?: string | null;
}

export async function getSessionMessages(sessionId: string): Promise<StoredMessage[]> {
  const client = getConvexHttpClient();
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
  modelUsed?: string
) {
  const encrypted = encryptMessage({ role, content, timestamp: new Date() });
  const client = getConvexHttpClient();
  await client.mutation(anyApi.messages.create, {
    sessionId,
    role: encrypted.role,
    content: encrypted.content,
    timestamp: encrypted.timestamp.getTime(),
    modelUsed,
  });
}

export async function ensureSession(sessionId?: string): Promise<string> {
  if (sessionId) return sessionId;
  const client = getConvexHttpClient();
  const user = await client.mutation(anyApi.users.getOrCreate, {
    legacyId: 'therapeutic-ai-user',
    email: 'user@therapeutic-ai.local',
    name: 'Therapeutic AI User',
  });
  const convexUser = user as ConvexUser;
  const created = await client.mutation(anyApi.sessions.create, {
    userId: convexUser._id,
    title: 'New Session',
  });
  const convexSession = created as ConvexSession;
  return String(convexSession._id);
}
