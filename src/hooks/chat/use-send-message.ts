import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import { apiClient } from '@/lib/api/client';
import { generateUUID } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';

interface UseSendMessageParams {
  ensureActiveSession: () => Promise<string>;
  setMessages: Dispatch<SetStateAction<MessageData[]>>;
  setInput: (value: string) => void;
  setIsLoading: (value: boolean) => void;
  startStream: (args: {
    sessionId: string;
    placeholderId: string;
    userMessage: string;
  }) => Promise<void>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useSendMessage(params: UseSendMessageParams) {
  const { ensureActiveSession, setMessages, setInput, setIsLoading, startStream, textareaRef } =
    params;
  const { showToast } = useToast();
  const t = useTranslations('toast');

  const sendMessage = useCallback(
    async (text: string) => {
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
      } catch (error) {
        logger.error(
          'Failed to persist user chat message',
          {
            component: 'useSendMessage',
            sessionId,
          },
          error instanceof Error ? error : new Error(String(error))
        );

        setMessages((prev) => prev.filter((message) => message.id !== userMessage.id));
        showToast({
          type: 'error',
          title: t('messageNotSavedTitle'),
          message: t('messageNotSavedBody'),
          duration: 6000,
        });
        setIsLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
        return;
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
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        // remove placeholder on failure
        setMessages((prev) => prev.filter((m) => m.id !== aiPlaceholder.id));
        setTimeout(() => textareaRef.current?.focus(), 50);
        showToast({
          type: 'error',
          title: t('messageNotSentTitle'),
          message: t('messageNotSentBody'),
          duration: 6000,
        });
        throw error;
      }
    },
    [
      ensureActiveSession,
      setMessages,
      setInput,
      setIsLoading,
      startStream,
      textareaRef,
      showToast,
      t,
    ]
  );

  return { sendMessage } as const;
}
