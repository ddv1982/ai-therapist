import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useChat } from '@ai-sdk/react';
import { ANALYTICAL_MODEL_ID } from '@/features/chat/config';
import { logger } from '@/lib/utils/logger';
import type { MessageData } from '@/features/chat/messages/message';
import type { useChatTransport } from '../use-chat-transport';

interface UseChatStreamingParams {
  currentSession: string | null;
  transport: ReturnType<typeof useChatTransport>;
  options?: { model?: string; webSearchEnabled: boolean };
  setMessages: Dispatch<SetStateAction<MessageData[]>>;
  loadMessages: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  setIsLoading: (value: boolean) => void;
  saveMessage: (sessionId: string, role: 'user' | 'assistant', content: string, modelUsed?: string) => Promise<void>;
}

interface StartStreamArgs {
  sessionId: string;
  placeholderId: string;
  userMessage: string;
}

export function useChatStreaming(params: UseChatStreamingParams) {
  const {
    currentSession,
    transport,
    options,
    setMessages,
    loadMessages,
    loadSessions,
    setIsLoading,
    saveMessage,
  } = params;

  const optionsRef = useRef(options);
  const aiPlaceholderIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(currentSession);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    sessionIdRef.current = currentSession;
  }, [currentSession]);

  const { sendMessage: sendAiMessage, stop: stopAi } = useChat({
    id: currentSession ?? 'default',
    transport,
    onError: (error) => {
      setIsLoading(false);
      const placeholderId = aiPlaceholderIdRef.current;
      if (placeholderId) {
        setMessages((prev) => prev.filter((message) => message.id !== placeholderId));
        aiPlaceholderIdRef.current = null;
      }
      logger.error('Chat stream error', { component: 'useChatStreaming' }, error);
    },
    onFinish: async ({ message }) => {
      try {
        const textContent = (message.parts ?? []).reduce((acc, part) => (
          part.type === 'text' ? acc + (part.text ?? '') : acc
        ), '');
        const trimmedContent = textContent.trim();
        const metadataModelId = (() => {
          const meta = message.metadata as { modelId?: unknown } | undefined;
          if (meta && typeof meta.modelId === 'string' && meta.modelId.length > 0) {
            return meta.modelId;
          }
          return undefined;
        })();

        const currentOptions = optionsRef.current;
        const requestedModel = currentOptions?.webSearchEnabled
          ? ANALYTICAL_MODEL_ID
          : currentOptions?.model;
        const actualModelId = metadataModelId ?? requestedModel;

        const placeholderId = aiPlaceholderIdRef.current;
        if (placeholderId) {
          setMessages((prev) => prev.map((existing) => (
            existing.id === placeholderId
              ? { ...existing, content: textContent, modelUsed: actualModelId }
              : existing
          )));
        }

        const sid = sessionIdRef.current;
        if (sid && trimmedContent.length > 0) {
          try {
            await saveMessage(sid, 'assistant', trimmedContent, actualModelId);
            await loadMessages(sid);
            await loadSessions();
          } catch (error) {
            logger.error('Failed to persist assistant stream result', {
              component: 'useChatStreaming',
              sessionId: sid,
            }, error instanceof Error ? error : new Error(String(error)));
          }
        }
      } finally {
        aiPlaceholderIdRef.current = null;
        setIsLoading(false);
      }
    },
  });

  const startStream = useCallback(async ({ sessionId, placeholderId, userMessage }: StartStreamArgs) => {
    aiPlaceholderIdRef.current = placeholderId;
    sessionIdRef.current = sessionId;
    setIsLoading(true);

    try {
      await sendAiMessage({
        role: 'user',
        parts: [{ type: 'text', text: userMessage }],
      }, {
        body: {
          sessionId,
          webSearchEnabled: optionsRef.current?.webSearchEnabled ?? false,
          selectedModel: optionsRef.current?.model,
          state: {},
        },
      });
    } catch (error) {
      const placeholder = aiPlaceholderIdRef.current;
      if (placeholder) {
        setMessages((prev) => prev.filter((message) => message.id !== placeholder));
        aiPlaceholderIdRef.current = null;
      }
      setIsLoading(false);
      logger.error('Error sending message to AI', {
        component: 'useChatStreaming',
        sessionId,
        model: optionsRef.current?.model,
      }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [sendAiMessage, setIsLoading, setMessages]);

  const stopStream = useCallback(() => {
    try {
      stopAi?.();
    } catch {
      // swallow stop errors
    }
    const placeholderId = aiPlaceholderIdRef.current;
    if (placeholderId) {
      setMessages((prev) => prev.filter((message) => message.id !== placeholderId));
      aiPlaceholderIdRef.current = null;
    }
    setIsLoading(false);
  }, [setIsLoading, setMessages, stopAi]);

  return {
    startStream,
    stopStream,
  };
}
