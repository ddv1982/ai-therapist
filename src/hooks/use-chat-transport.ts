'use client';

import { useMemo } from 'react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { createBYOKHeaders } from '@/lib/chat/byok-helper';

interface UseChatTransportParams {
  sessionId: string | null;
  selectedModel?: string;
  byokKey?: string | null;
}

export function useChatTransport(params: UseChatTransportParams) {
  const { sessionId, selectedModel, byokKey } = params;

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: '/api/chat',
        credentials: 'include',
        // Send BYOK key via header only (more secure, not logged)
        headers: createBYOKHeaders(byokKey),
        body: {
          sessionId: sessionId ?? undefined,
          selectedModel,
        },
      }),
    [sessionId, selectedModel, byokKey]
  );

  return transport;
}
