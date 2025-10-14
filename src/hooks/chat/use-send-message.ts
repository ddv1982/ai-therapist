import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import { apiClient } from '@/lib/api/client';
import { generateUUID } from '@/lib/utils/utils';

interface UseSendMessageParams {
  ensureActiveSession: () => Promise<string>;
  setMessages: Dispatch<SetStateAction<MessageData[]>>;
  setInput: (value: string) => void;
  setIsLoading: (value: boolean) => void;
  startStream: (args: { sessionId: string; placeholderId: string; userMessage: string }) => Promise<void>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useSendMessage(params: UseSendMessageParams) {
  const { ensureActiveSession, setMessages, setInput, setIsLoading, startStream, textareaRef } = params;

  const sendMessage = useCallback(async (text: string) => {
    setIsLoading(true);

    let sessionId: string;
    try {
      sessionId = await ensureActiveSession();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }

    const now = new Date();
    const userMessage: MessageData = {
      id: generateUUID(),
      role: 'user',
      content: text,
      timestamp: now,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      await apiClient.postMessage(sessionId, { role: 'user', content: text });
    } catch {
      // Non-fatal: keep optimistic UI
    }

    const aiPlaceholder: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: '',
      timestamp: now,
    };
    setMessages((prev) => [...prev, aiPlaceholder]);

    try {
      await startStream({ sessionId, placeholderId: aiPlaceholder.id, userMessage: text });
    } catch (error) {
      setIsLoading(false);
      // remove placeholder on failure
      setMessages((prev) => prev.filter((m) => m.id !== aiPlaceholder.id));
      setTimeout(() => textareaRef.current?.focus(), 50);
      throw error;
    }
  }, [ensureActiveSession, setMessages, setInput, setIsLoading, startStream, textareaRef]);

  return { sendMessage } as const;
}
