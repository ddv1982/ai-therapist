import { prisma } from '@/lib/database/db';
import { encryptMessage, safeDecryptMessages } from '@/lib/chat/message-encryption';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  modelUsed?: string | null;
}

export async function getSessionMessages(sessionId: string): Promise<StoredMessage[]> {
  const rows = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });
  const decrypted = safeDecryptMessages(rows.map(r => ({ role: r.role, content: r.content, timestamp: r.timestamp })));
  return rows.map((r, i) => ({
    id: r.id,
    role: r.role as StoredMessage['role'],
    content: decrypted[i]?.content ?? '',
    createdAt: r.createdAt,
    modelUsed: r.modelUsed ?? undefined,
  }));
}

export async function appendMessage(sessionId: string, role: StoredMessage['role'], content: string, modelUsed?: string) {
  const encrypted = encryptMessage({ role, content, timestamp: new Date() });
  await prisma.message.create({
    data: { sessionId, role: encrypted.role, content: encrypted.content, timestamp: encrypted.timestamp, modelUsed },
  });
}

export async function ensureSession(sessionId?: string): Promise<string> {
  if (sessionId) return sessionId;
  const created = await prisma.session.create({ data: { title: 'New Session', user: { connectOrCreate: { where: { id: 'therapeutic-ai-user' }, create: { id: 'therapeutic-ai-user', email: 'user@therapeutic-ai.local', name: 'Therapeutic AI User' } } } } });
  return created.id;
}


