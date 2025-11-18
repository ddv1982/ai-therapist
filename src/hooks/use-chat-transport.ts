'use client';

import { useMemo } from 'react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';

interface UseChatTransportParams {
  sessionId: string | null;
}

export function useChatTransport(params: UseChatTransportParams) {
  const { sessionId } = params;

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: '/api/chat',
        credentials: 'include',
        body: {
          sessionId: sessionId ?? undefined,
        },
      }),
    [sessionId]
  );

  return transport;
}
