/**
 * Therapy Chat Hook
 *
 * Primary hook for the therapy chat application that wraps @ai-sdk/react's useChat
 * with therapy-specific features including message persistence, session management,
 * and BYOK (Bring Your Own Key) support.
 *
 * @module useTherapyChat
 */

'use client';

import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { useChatPersistence } from '@/features/chat/hooks/use-chat-persistence';
import { createBYOKHeaders } from '@/features/chat/lib/byok-helper';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import type { MessageData } from '@/features/chat/messages/message';
import type { UseTherapyChatOptions, UseTherapyChatReturn } from './types';
import {
  extractTextContent,
  createUserMessage,
  createAssistantPlaceholder,
  getModelIdFromMetadata,
} from './use-therapy-chat-utils';

/**
 * Primary therapy chat hook that wraps @ai-sdk/react's useChat.
 *
 * @param options - Configuration options for the chat
 * @returns Chat state and actions
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { messages, input, handleInputChange, handleSubmit, isLoading } = useTherapyChat({
 *     sessionId: currentSession,
 *     model: 'llama-3.3-70b-versatile',
 *   });
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {messages.map((msg) => <div key={msg.id}>{msg.content}</div>)}
 *       <input value={input} onChange={handleInputChange} />
 *       <button type="submit" disabled={isLoading}>Send</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useTherapyChat(options: UseTherapyChatOptions): UseTherapyChatReturn {
  const {
    sessionId,
    model,
    webSearchEnabled = false,
    byokKey,
    onFinish: externalOnFinish,
    onError: externalOnError,
  } = options;

  const { showToast } = useToast();
  const t = useTranslations('toast');

  // Local state
  const [messages, setMessagesState] = useState<MessageData[]>([]);
  const [input, setInputState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Refs for values needed in callbacks without causing re-renders
  const placeholderIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef(sessionId);
  const modelRef = useRef(model);
  const byokKeyRef = useRef(byokKey);

  // Update refs synchronously
  sessionIdRef.current = sessionId;
  modelRef.current = model;
  byokKeyRef.current = byokKey;

  // Message persistence hook
  const { loadMessages, saveMessage, hasSession } = useChatPersistence(sessionId);

  // Create transport for AI SDK
  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: '/api/chat',
        credentials: 'include',
        headers: createBYOKHeaders(byokKey),
        body: {
          sessionId: sessionId ?? undefined,
          selectedModel: model,
          webSearchEnabled,
        },
      }),
    [sessionId, model, webSearchEnabled, byokKey]
  );

  // AI SDK useChat hook
  const { sendMessage: sendAiMessage, stop: stopAi } = useChat<UIMessage>({
    id: sessionId ?? 'new-session',
    transport,
    onError: (err) => {
      setIsLoading(false);
      setError(err);

      const placeholderId = placeholderIdRef.current;
      if (placeholderId) {
        setMessagesState((prev) => prev.filter((msg) => msg.id !== placeholderId));
        placeholderIdRef.current = null;
      }

      logger.error(
        'Chat error',
        { component: 'useTherapyChat', sessionId: sessionIdRef.current ?? undefined },
        err
      );
      showToast({
        type: 'error',
        title: t('messageNotSentTitle'),
        message: t('messageNotSentBody'),
        duration: 6000,
      });
      externalOnError?.(err);
    },
    onFinish: async ({ message }) => {
      try {
        const textContent = extractTextContent(message);
        const trimmedContent = textContent.trim();
        const actualModelId = getModelIdFromMetadata(message, modelRef.current);

        const placeholderId = placeholderIdRef.current;
        if (placeholderId) {
          setMessagesState((prev) =>
            prev.map((existing) =>
              existing.id === placeholderId
                ? { ...existing, content: textContent, modelUsed: actualModelId }
                : existing
            )
          );
        }

        const sid = sessionIdRef.current;
        if (sid && trimmedContent.length > 0) {
          const result = await saveMessage({
            role: 'assistant',
            content: trimmedContent,
            modelUsed: actualModelId,
          });
          if (!result.success) {
            logger.error('Failed to persist assistant message', {
              component: 'useTherapyChat',
              sessionId: sid,
              error: result.error,
            });
          }
        }

        externalOnFinish?.(message);
      } finally {
        placeholderIdRef.current = null;
        setIsLoading(false);
      }
    },
  });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setInputState(e.target.value),
    []
  );

  const loadSessionMessages = useCallback(async () => {
    if (!hasSession) {
      setMessagesState([]);
      return;
    }
    const result = await loadMessages();
    if (result.success) {
      setMessagesState(result.messages);
    } else {
      logger.error('Failed to load session messages', {
        component: 'useTherapyChat',
        sessionId: sessionIdRef.current ?? undefined,
        error: result.error,
      });
    }
  }, [hasSession, loadMessages]);

  const clearSession = useCallback(() => {
    setMessagesState([]);
    setInputState('');
    setError(undefined);
  }, []);

  const handleSubmit = useCallback(
    async (
      e?: React.FormEvent<HTMLFormElement>,
      submitOptions?: {
        experimental_attachments?: FileList | undefined;
        sessionId?: string;
        ensureSession?: () => Promise<string>;
      }
    ) => {
      e?.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput || isLoading) return;

      // Resolve session ID - either provided, from hook state, or create new via ensureSession
      let effectiveSessionId = submitOptions?.sessionId ?? sessionIdRef.current;
      if (!effectiveSessionId && submitOptions?.ensureSession) {
        try {
          effectiveSessionId = await submitOptions.ensureSession();
        } catch (err) {
          logger.error(
            'Failed to ensure session',
            { component: 'useTherapyChat' },
            err instanceof Error ? err : new Error(String(err))
          );
          showToast({
            type: 'error',
            title: t('messageNotSentTitle'),
            message: t('messageNotSentBody'),
            duration: 6000,
          });
          return;
        }
      }
      const effectiveHasSession =
        effectiveSessionId !== null &&
        effectiveSessionId !== undefined &&
        effectiveSessionId.length > 0;

      setIsLoading(true);
      setError(undefined);

      const userMessage = createUserMessage(trimmedInput);
      setMessagesState((prev) => [...prev, userMessage]);
      setInputState('');

      if (effectiveHasSession && effectiveSessionId) {
        // Use apiClient directly since we may have a newly-created session
        // that the persistence hook doesn't know about yet
        try {
          await apiClient.postMessage(effectiveSessionId, { role: 'user', content: trimmedInput });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to persist message';
          logger.error('Failed to persist user message', {
            component: 'useTherapyChat',
            sessionId: effectiveSessionId,
            error: errorMessage,
          });
          showToast({
            type: 'error',
            title: t('messageNotSavedTitle'),
            message: t('messageNotSavedBody'),
            duration: 6000,
          });
          setMessagesState((prev) => prev.filter((msg) => msg.id !== userMessage.id));
          setInputState(trimmedInput);
          setIsLoading(false);
          return;
        }
      }

      const placeholder = createAssistantPlaceholder();
      placeholderIdRef.current = placeholder.id;
      setMessagesState((prev) => [...prev, placeholder]);

      try {
        await sendAiMessage(
          { role: 'user', parts: [{ type: 'text', text: trimmedInput }] },
          {
            headers: createBYOKHeaders(byokKeyRef.current),
            body: {
              sessionId: effectiveSessionId,
              webSearchEnabled,
              selectedModel: modelRef.current,
              state: {},
            },
          }
        );
      } catch (err) {
        setMessagesState((prev) =>
          prev.filter((msg) => msg.id !== userMessage.id && msg.id !== placeholder.id)
        );
        placeholderIdRef.current = null;
        setIsLoading(false);
        setError(err instanceof Error ? err : new Error(String(err)));
        logger.error(
          'Error sending message to AI',
          { component: 'useTherapyChat', sessionId: effectiveSessionId ?? undefined },
          err instanceof Error ? err : new Error(String(err))
        );
      }
    },
    [input, isLoading, showToast, t, sendAiMessage, webSearchEnabled]
  );

  const append = useCallback(
    async (message: { role: 'user' | 'assistant'; content: string }) => {
      const newMessage = createUserMessage(message.content);
      const messageData: MessageData = { ...newMessage, role: message.role };
      setMessagesState((prev) => [...prev, messageData]);

      if (hasSession && message.role === 'user') {
        const result = await saveMessage({ role: message.role, content: message.content });
        if (!result.success) {
          logger.error('Failed to persist appended message', {
            component: 'useTherapyChat',
            sessionId: sessionIdRef.current ?? undefined,
            error: result.error,
          });
        }
      }
    },
    [hasSession, saveMessage]
  );

  const reload = useCallback(async () => {
    const reversedIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (reversedIndex === -1) {
      logger.warn('No user message to reload', { component: 'useTherapyChat' });
      return;
    }
    const lastUserMessageIndex = messages.length - 1 - reversedIndex;
    const lastUserMessage = messages[lastUserMessageIndex];

    const messagesAfterUser = messages.slice(lastUserMessageIndex + 1);
    const lastAssistantIndex = messagesAfterUser.findIndex((m) => m.role === 'assistant');
    if (lastAssistantIndex !== -1) {
      setMessagesState((prev) =>
        prev.filter((_, idx) => idx !== lastUserMessageIndex + 1 + lastAssistantIndex)
      );
    }

    setIsLoading(true);
    setError(undefined);

    const placeholder = createAssistantPlaceholder();
    placeholderIdRef.current = placeholder.id;
    setMessagesState((prev) => [...prev, placeholder]);

    try {
      await sendAiMessage(
        { role: 'user', parts: [{ type: 'text', text: lastUserMessage.content }] },
        {
          headers: createBYOKHeaders(byokKeyRef.current),
          body: {
            sessionId: sessionIdRef.current,
            webSearchEnabled,
            selectedModel: modelRef.current,
            state: {},
          },
        }
      );
    } catch (err) {
      setMessagesState((prev) => prev.filter((msg) => msg.id !== placeholder.id));
      placeholderIdRef.current = null;
      setIsLoading(false);
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error(
        'Error reloading message',
        { component: 'useTherapyChat', sessionId: sessionIdRef.current ?? undefined },
        err instanceof Error ? err : new Error(String(err))
      );
    }
  }, [messages, sendAiMessage, webSearchEnabled]);

  const stop = useCallback(() => {
    try {
      void stopAi?.();
    } catch (err) {
      logger.debug('Stop operation failed', {
        component: 'useTherapyChat',
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
    const placeholderId = placeholderIdRef.current;
    if (placeholderId) {
      setMessagesState((prev) => prev.filter((msg) => msg.id !== placeholderId));
      placeholderIdRef.current = null;
    }
    setIsLoading(false);
  }, [stopAi]);

  // Clear messages when session becomes null (starting fresh)
  useEffect(() => {
    if (!sessionId) {
      setMessagesState([]);
    }
  }, [sessionId]);

  return {
    messages,
    input,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
    setInput: setInputState,
    setMessages: setMessagesState,
    reload,
    stop,
    clearSession,
    loadSessionMessages,
    append,
  };
}


// Re-export types for convenience
export type { UseTherapyChatOptions, UseTherapyChatReturn } from './types';
