'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MessageData } from '@/features/chat/messages';

interface SendMessageRequest {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
}

interface SendMessageResponse {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: string;
  createdAt: string;
  messageCount: number;
}

// Helper to add X-Request-Id header
const fetchWithHeaders = async (url: string, options?: RequestInit) => {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (!headers.has('X-Request-Id')) {
    const rid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    headers.set('X-Request-Id', rid);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Query keys factory
export const chatKeys = {
  all: ['chat'] as const,
  messages: () => [...chatKeys.all, 'messages'] as const,
  messagesBySession: (sessionId: string) => [...chatKeys.messages(), sessionId] as const,
};

// Fetch messages for a session
export function useChatMessagesQuery(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: chatKeys.messagesBySession(sessionId || 'none'),
    queryFn: async () => {
      if (!sessionId) {
        return [];
      }
      const response = await fetchWithHeaders(`/api/sessions/${sessionId}/messages`);
      if (response.success && response.data) {
        return response.data.items as MessageData[];
      }
      throw new Error(response.error?.message || 'Failed to fetch messages');
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // Messages are fresh for 30 seconds
  });
}

// Send message mutation
export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, ...body }: SendMessageRequest) => {
      const response = await fetchWithHeaders(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (response.success && response.data) {
        return response.data as SendMessageResponse;
      }
      throw new Error(response.error?.message || 'Failed to send message');
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messagesBySession(variables.sessionId) });
    },
  });
}
