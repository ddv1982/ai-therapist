'use client';

import { useMemo } from 'react';
import { DefaultChatTransport } from 'ai';

export function useChatTransport(params: { sessionId: string | null }) {
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: { sessionId: params.sessionId ?? undefined },
  }), [params.sessionId]);
  return transport;
}


