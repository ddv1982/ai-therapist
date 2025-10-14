'use client';

import { useCallback } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import { useChatMessages } from './use-chat-messages';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { logger } from '@/lib/utils/logger';
import { apiClient } from '@/lib/api/client';
import { useTranslations } from 'next-intl';
import { useChatTransport } from '@/hooks/use-chat-transport';
import { useMemoryContext } from '@/hooks/use-memory-context';
import { useChatSessions } from '@/hooks/chat/use-chat-sessions';
import { useChatViewport } from '@/hooks/chat/use-chat-viewport';
import { REPORT_MODEL_ID } from '@/features/chat/config';
import type { ObsessionsCompulsionsData } from '@/types/therapy';
import type { UiSession } from '@/lib/chat/session-mapper';
import type { MemoryContextInfo } from '@/lib/chat/memory-utils';
import { useChatUiState } from '@/hooks/chat/use-chat-ui-state';
import { useChatStreaming } from '@/hooks/chat/use-chat-streaming';
import { useSendMessage } from '@/hooks/chat/use-send-message';

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

  const {
    input,
    setInput,
    isLoading,
    setIsLoading,
    showSidebar,
    setShowSidebar,
    isGeneratingReport,
    setIsGeneratingReport,
    textareaRef,
    messagesContainerRef,
    inputContainerRef,
  } = useChatUiState();

  const { scrollToBottom, isNearBottom } = useScrollToBottom({
    isStreaming: isLoading,
    messages,
    container: messagesContainerRef.current,
    behavior: 'smooth',
    respectUserScroll: true,
  });

  const transport = useChatTransport({ sessionId: currentSession });

  const { startStream, stopStream } = useChatStreaming({
    currentSession,
    transport,
    options,
    setMessages,
    loadSessions,
    setIsLoading,
  });

  const { sendMessage } = useSendMessage({
    ensureActiveSession,
    setMessages,
    setInput,
    setIsLoading,
    startStream,
    textareaRef,
  });

  const setCurrentSessionAndSync = useCallback(async (sessionId: string) => {
    await setCurrentSessionAndLoad(sessionId);
  }, [setCurrentSessionAndLoad]);

  const startNewSession = useCallback(() => {
    void (async () => {
      await resetSessionState();
      setTimeout(() => textareaRef.current?.focus(), 100);
    })();
  }, [resetSessionState, textareaRef]);

  const sendMessageHandler = useCallback(async () => {
    const messageText = input;
    if (!messageText.trim() || isLoading) return;
    try {
      await sendMessage(messageText);
    } catch (error) {
      logger.error('Error sending message to AI', { component: 'useChatController' }, error instanceof Error ? error : new Error(String(error)));
    }
  }, [input, isLoading, sendMessage]);

  const stopGenerating = useCallback(() => {
    stopStream();
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [stopStream, textareaRef]);

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
          await apiClient.postMessage(currentSession, { role: 'assistant', content: reportMessage.content, modelUsed: REPORT_MODEL_ID });
          await loadSessions();
        } catch {}
      }
    } finally {
      setIsGeneratingReport(false);
    }
  }, [currentSession, messages, setMessages, loadSessions, setIsGeneratingReport]);

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
    sendMessage: sendMessageHandler,
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
