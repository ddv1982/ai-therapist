import type { components } from '@/types/api.generated';

export interface UiSession {
  id: string;
  title: string;
  lastMessage?: string;
  startedAt: Date | undefined;
  _count?: { messages: number };
}

export function mapApiSessionToUiSession(s: components['schemas']['Session']): UiSession {
  return {
    ...(s as unknown as Record<string, unknown>),
    id: String((s as { id: string }).id),
    title: String((s as { title: string }).title),
    lastMessage: (s as { lastMessage?: string })?.lastMessage,
    startedAt: (s as { startedAt?: string })?.startedAt ? new Date((s as { startedAt?: string }).startedAt as string) : undefined,
  } as UiSession;
}


