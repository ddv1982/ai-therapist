'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { MessageData } from '@/features/chat/messages/message';
import { useChatMessages } from './use-chat-messages';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { apiClient } from '@/lib/api/client';
import { getApiData } from '@/lib/api/api-response';
import type { components } from '@/types/api.generated';
import { logger } from '@/lib/utils/logger';
import { generateUUID } from '@/lib/utils/utils';
import { useTranslations } from 'next-intl';
import { useChatTransport } from '@/hooks/use-chat-transport';
import { useMemoryContext } from '@/hooks/use-memory-context';
import { useChatSessions } from '@/hooks/chat/use-chat-sessions';
import { useChatViewport } from '@/hooks/chat/use-chat-viewport';
import { ANALYTICAL_MODEL_ID, REPORT_MODEL_ID } from '@/features/chat/config';
import type { ObsessionsCompulsionsData } from '@/types/therapy';
import type { UiSession } from '@/lib/chat/session-mapper';
import type { MemoryContextInfo } from '@/lib/chat/memory-utils';

type Message = MessageData;

export type ChatSessionSummary = UiSession;

export interface ChatController {
  // state
  messages: Message[];
  sessions: ChatSessionSummary[];
  currentSession: string | null;
  input: string;
  isLoading: boolean;
  isMobile: boolean;
  viewportHeight: string;
  isGeneratingReport: boolean;
  memoryContext: MemoryContextInfo;

  // refs needed by UI
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  inputContainerRef: React.RefObject<HTMLDivElement | null>;

  // scrolling helpers
  isNearBottom: boolean;
  scrollToBottom: (force?: boolean, delay?: number) => void;

  // actions
  setInput: (value: string) => void;
  sendMessage: () => Promise<void>;
  stopGenerating: () => void;
  startNewSession: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  setCurrentSessionAndSync: (sessionId: string) => Promise<void>;
  generateReport: () => Promise<void>;

  // setters used by outer UI
  setShowSidebar: (value: boolean) => void;
  showSidebar: boolean;
  setMemoryContext: (info: MemoryContextInfo) => void;

  // bridge helper
  addMessageToChat: (message: { content: string; role: 'user' | 'assistant'; sessionId: string; modelUsed?: string; source?: string; metadata?: Record<string, unknown> }) => Promise<{ success: boolean; error?: string }>;
  updateMessageMetadata: (sessionId: string, messageId: string, metadata: Record<string, unknown>, options?: { mergeStrategy?: 'merge' | 'replace' }) => Promise<{ success: boolean; error?: string }>;
  
  // obsessions and compulsions
  createObsessionsCompulsionsTable: () => Promise<{ success: boolean; error?: string }>;
}

export function useChatController(options?: { model: string; webSearchEnabled: boolean }): ChatController {
  const {
    messages,
    loadMessages,
    addMessageToChat: addMessageToChatInternal,
    clearMessages,
    setMessages,
    updateMessageMetadata,
  } = useChatMessages();

  const t = useTranslations();
  const resolveDefaultTitle = useCallback((): string => {
    const val = t('sessions.defaultTitle');
    return typeof val === 'string' && val.length > 0 ? val : 'New Chat';
  }, [t]);

  const {
    sessions,
    currentSession,
    loadSessions,
    ensureActiveSession,
    startNewSession: resetSessionState,
    deleteSession,
    setCurrentSessionAndLoad,
  } = useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle });

  const { memoryContext, setMemoryContext } = useMemoryContext(currentSession);
  const { isMobile, viewportHeight } = useChatViewport();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const aiPlaceholderIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const { scrollToBottom, isNearBottom } = useScrollToBottom({
    isStreaming: isLoading,
    messages,
    container: messagesContainerRef.current,
    behavior: 'smooth',
    respectUserScroll: true,
  });

  const transport = useChatTransport({ sessionId: currentSession });

  const { sendMessage: sendAiMessage, stop: stopAi } = useChat({
    id: currentSession ?? 'default',
    transport,
    onError: (error) => {
      setIsLoading(false);
      logger.error('Chat stream error', { component: 'useChatController' }, error);
    },
    onFinish: async ({ message }) => {
      try {
        const textContent = (message.parts ?? [])
          .reduce((acc, part) => acc + (part.type === 'text' ? (part.text ?? '') : ''), '');
        const trimmedContent = textContent.trim();

        if (aiPlaceholderIdRef.current) {
          const placeholderId = aiPlaceholderIdRef.current;
          setMessages(prev => prev.map(m => (
            m.id === placeholderId ? { ...m, content: textContent } : m
          )));
        }

        const sid = sessionIdRef.current;
        if (sid && trimmedContent.length > 0) {
          try {
            const recent = await apiClient.listMessages(sid, { limit: 5 });
            const page = recent ? getApiData(recent) : undefined;
            const items = (page?.items || []) as Array<{ role: string; content: string }>;
            const alreadySaved = items.some(it => it.role === 'assistant' && it.content === trimmedContent);
            if (!alreadySaved) {
              await saveMessage(sid, 'assistant', trimmedContent, options?.webSearchEnabled ? ANALYTICAL_MODEL_ID : options?.model);
            }
          } catch {
            await saveMessage(sid, 'assistant', trimmedContent, options?.webSearchEnabled ? ANALYTICAL_MODEL_ID : options?.model);
          }
          await loadMessages(sid);
          await loadSessions();
        }
      } finally {
        aiPlaceholderIdRef.current = null;
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    sessionIdRef.current = currentSession;
  }, [currentSession]);

  const saveMessage = useCallback(async (
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    modelUsed?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const resp = await apiClient.postMessage(sessionId, { role, content, modelUsed, metadata });
      if (resp && resp.success && resp.data) {
        return resp.data as components['schemas']['Message'];
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Initial focus and environment detection
  useEffect(() => {
    const id = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const id = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isLoading]);

  const setCurrentSessionAndSync = useCallback(async (sessionId: string) => {
    await setCurrentSessionAndLoad(sessionId);
  }, [setCurrentSessionAndLoad]);

  const startNewSession = useCallback(() => {
    void (async () => {
      await resetSessionState();
      setTimeout(() => textareaRef.current?.focus(), 100);
    })();
  }, [resetSessionState]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);

    let sessionId: string;
    try {
      sessionId = await ensureActiveSession();
    } catch (error) {
      setIsLoading(false);
      logger.error('Error ensuring session before send', { component: 'useChatController' }, error instanceof Error ? error : new Error(String(error)));
      return;
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    await saveMessage(sessionId, 'user', userMessage.content);
    sessionIdRef.current = sessionId;

    try {
      const aiMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      aiPlaceholderIdRef.current = aiMessage.id;
      setMessages(prev => [...prev, aiMessage]);
      await sendAiMessage({
        role: 'user',
        parts: [{ type: 'text', text: userMessage.content }],
      }, {
        body: {
          sessionId,
          webSearchEnabled: options?.webSearchEnabled ?? false,
          selectedModel: options?.model,
          state: {},
        },
      });
    } catch (error) {
      setIsLoading(false);
      logger.error('Error sending message to AI', { component: 'useChatController', sessionId, model: options?.model }, error instanceof Error ? error : new Error(String(error)));
    }
  }, [input, isLoading, ensureActiveSession, setMessages, sendAiMessage, options?.webSearchEnabled, options?.model, saveMessage]);

  const stopGenerating = useCallback(() => {
    try {
      stopAi?.();
    } catch {}
    const placeholderId = aiPlaceholderIdRef.current;
    if (placeholderId) {
      setMessages(prev => prev.filter(m => m.id !== placeholderId));
      aiPlaceholderIdRef.current = null;
    }
    setIsLoading(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [stopAi, setMessages]);

  const generateReport = useCallback(async () => {
    if (!currentSession || messages.length === 0) return;
    setIsGeneratingReport(true);
    try {
      const result = await apiClient.generateReportDetailed({
        sessionId: currentSession,
        messages: messages.filter(m => !m.content.startsWith('📊 **Session Report**')).map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp.toISOString?.() })),
        model: REPORT_MODEL_ID,
      });
      // Accept both standardized ApiResponse and legacy shape
      const dataObj = (result as { success?: boolean; data?: { reportContent?: unknown } }).data;
      const legacyReport = (result as { reportContent?: unknown }).reportContent;
      const content = (typeof dataObj?.reportContent === 'string')
        ? (dataObj.reportContent as string)
        : (typeof legacyReport === 'string' ? legacyReport as string : undefined);
      if (content) {
        const reportMessage = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: `📊 **Session Report**\n\n${content}`,
          timestamp: new Date(),
          modelUsed: REPORT_MODEL_ID,
        };
        setMessages(prev => [...prev, reportMessage]);
        try {
          await saveMessage(currentSession, 'assistant', reportMessage.content, REPORT_MODEL_ID);
          await loadSessions();
        } catch {}
      }
    } finally {
      setIsGeneratingReport(false);
    }
  }, [currentSession, messages, setMessages, saveMessage, loadSessions]);

  const createObsessionsCompulsionsTable = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    let sessionId: string;
    try {
      sessionId = await ensureActiveSession();
    } catch (error) {
      logger.error('Failed to ensure session for obsessions table', { component: 'useChatController' }, error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: 'Could not prepare a session for the tracker.' };
    }

    const baseData: ObsessionsCompulsionsData = {
      obsessions: [],
      compulsions: [],
      lastModified: new Date().toISOString(),
    };

    const { formatObsessionsCompulsionsForChat } = await import('@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions');
    const tableContent = formatObsessionsCompulsionsForChat(baseData);

    // Create obsessions and compulsions table message
    const result = await addMessageToChatInternal({
      content: tableContent,
      role: 'user',
      sessionId,
      metadata: {
        type: 'obsessions-compulsions-table',
        step: 'obsessions-compulsions',
        data: baseData,
        dismissed: false,
        dismissedReason: null,
      },
    });
    if (!result.success) {
      logger.error('Failed to add obsessions tracker message', {
        component: 'useChatController',
        operation: 'createObsessionsCompulsionsTable',
        sessionId,
        error: result.error,
      });
      return { success: false, error: result.error ?? 'Failed to add the tracker message.' };
    }

    return { success: true };
  }, [ensureActiveSession, addMessageToChatInternal]);

  return {
    messages,
    sessions,
    currentSession,
    input,
    isLoading,
    isMobile,
    viewportHeight,
    isGeneratingReport,
    memoryContext,
    textareaRef,
    messagesContainerRef,
    inputContainerRef,
    isNearBottom,
    scrollToBottom,
    setInput,
    sendMessage,
    stopGenerating,
    startNewSession,
    deleteSession,
    loadSessions,
    setCurrentSessionAndSync,
    generateReport,
    setShowSidebar,
    showSidebar,
    addMessageToChat: addMessageToChatInternal,
    updateMessageMetadata,
    setMemoryContext,
    createObsessionsCompulsionsTable,
  };
}
