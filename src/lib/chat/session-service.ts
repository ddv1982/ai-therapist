import { encryptMessage, safeDecryptMessages } from '@/lib/chat/message-encryption';
import { getConvexHttpClient, anyApi } from '@/lib/convex/httpClient';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  modelUsed?: string | null;
}

export async function getSessionMessages(sessionId: string): Promise<StoredMessage[]> {
  const client = getConvexHttpClient();
  const rows = await client.query(anyApi.messages.listBySession, { sessionId: sessionId as any });
  const ordered = (Array.isArray(rows) ? rows : []).sort((a: any, b: any) => a.timestamp - b.timestamp);
  const decrypted = safeDecryptMessages(ordered.map((r: any) => ({ role: r.role, content: r.content, timestamp: new Date(r.timestamp) })));
  return ordered.map((r: any, i: number) => ({
    id: String(r._id),
    role: r.role as StoredMessage['role'],
    content: decrypted[i]?.content ?? '',
    createdAt: new Date(r.createdAt),
    modelUsed: r.modelUsed ?? undefined,
  }));
}

export async function appendMessage(sessionId: string, role: StoredMessage['role'], content: string, modelUsed?: string) {
  const encrypted = encryptMessage({ role, content, timestamp: new Date() });
  const client = getConvexHttpClient();
  await client.mutation(anyApi.messages.create, {
    sessionId: sessionId as any,
    role: encrypted.role,
    content: encrypted.content,
    timestamp: encrypted.timestamp.getTime(),
    modelUsed,
  });
}

export async function ensureSession(sessionId?: string): Promise<string> {
  if (sessionId) return sessionId;
  const client = getConvexHttpClient();
  const user = await client.mutation(anyApi.users.getOrCreate, { legacyId: 'therapeutic-ai-user', email: 'user@therapeutic-ai.local', name: 'Therapeutic AI User' });
  const created = await client.mutation(anyApi.sessions.create, { userId: (user as any)._id, title: 'New Session' });
  return String((created as any)._id);
}


