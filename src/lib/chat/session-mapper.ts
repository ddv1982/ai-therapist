import type { components } from '@/types/api.generated';

export interface UiSession {
  id: string;
  title: string;
  lastMessage?: string;
  startedAt: Date | undefined;
  _count?: { messages: number };
}

export function mapApiSessionToUiSession(s: components['schemas']['Session']): UiSession {
  const messageCount = ((s as { _count?: { messages?: number } })._count?.messages)
    ?? ((s as { messageCount?: number }).messageCount);

  const mapped: UiSession = {
    id: String((s as { id: string }).id),
    title: String((s as { title: string }).title),
    startedAt: (s as { startedAt?: string })?.startedAt ? new Date((s as { startedAt?: string }).startedAt as string) : undefined,
  };

  const lastMessage = (s as { lastMessage?: string }).lastMessage;
  if (typeof lastMessage === 'string') {
    mapped.lastMessage = lastMessage;
  }

  if (typeof messageCount === 'number' && Number.isFinite(messageCount)) {
    mapped._count = { messages: messageCount };
  }

  return mapped;
}


