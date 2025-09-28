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
import { checkMemoryContext, type MemoryContextInfo } from '@/lib/chat/memory-utils';
import { useTranslations } from 'next-intl';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentSession as setCurrentSessionAction } from '@/store/slices/sessionsSlice';
import { useSelectSession, useMemoryContext, useSessionStore, useChatTransport } from '@/hooks';
import { ANALYTICAL_MODEL_ID, REPORT_MODEL_ID } from '@/features/chat/config';
import type { ObsessionsCompulsionsData } from '@/types/therapy';

type Message = MessageData;

type Session = { id: string; title: string; messageCount?: number; startedAt?: Date };

export interface ChatController {
  // state
  messages: Message[];
  sessions: Session[];
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
  createObsessionsCompulsionsTable: () => Promise<void>;
}

export function useChatController(options?: { model: string; webSearchEnabled: boolean }): ChatController {
  const {
    messages,
    loadMessages,
    addMessageToChat: _addMessageToChat,
    clearMessages,
    setMessages,
    updateMessageMetadata,
  } = useChatMessages();

  const dispatch = useAppDispatch();
  const t = useTranslations();
  const { selectSession } = useSelectSession();
  const resolveDefaultTitle = useCallback((): string => {
    const val = t('sessions.defaultTitle');
    return typeof val === 'string' && val.length > 0 ? val : 'New Chat';
  }, [t]);

  const { sessions, loadSessions: loadSessionsFromStore, removeSession, createSession } = useSessionStore();
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { memoryContext, setMemoryContext } = useMemoryContext(currentSession);
  const setMemoryContextRef = useRef(setMemoryContext);
  useEffect(() => {
    setMemoryContextRef.current = setMemoryContext;
  }, [setMemoryContext]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const aiPlaceholderIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);
  const sessionsLoadingRef = useRef(false);
  // Background creation removed; associated refs removed

  const { scrollToBottom, isNearBottom } = useScrollToBottom({
    isStreaming: isLoading,
    messages,
    container: messagesContainerRef.current,
    behavior: 'smooth',
    respectUserScroll: true,
  });

  // AI SDK transport and chat
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

  // Memory-context hydration whenever current session changes (or none)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await checkMemoryContext(currentSession ?? undefined);
        if (active) setMemoryContextRef.current(info);
      } catch {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [currentSession]);

  const loadSessions = useCallback(async () => {
    if (sessionsLoadingRef.current) return;
    sessionsLoadingRef.current = true;
    try {
      await loadSessionsFromStore();
    } finally {
      sessionsLoadingRef.current = false;
    }
  }, [loadSessionsFromStore]);

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

  const loadCurrentSession = useCallback(async () => {
    try {
      const data = await apiClient.getCurrentSession();
      const currentSessionData: { currentSession?: { id: string; messageCount?: number } } = (data && (data as { success?: boolean }).success)
        ? (data as { data: { currentSession?: { id: string; messageCount?: number } } }).data
        : (data as { currentSession?: { id: string; messageCount?: number } });
      if (currentSessionData?.currentSession) {
        const sessionId = currentSessionData.currentSession.id;
        setCurrentSession(sessionId);
        dispatch(setCurrentSessionAction(sessionId));
        await loadMessages(sessionId);
        if (typeof window !== 'undefined') localStorage.setItem('currentSessionId', sessionId);
        return;
      }

      // Fallback: nothing on server, clear any stale local
      setCurrentSession(null);
      dispatch(setCurrentSessionAction(null));
      if (typeof window !== 'undefined') localStorage.removeItem('currentSessionId');
    } catch {
      // ignore
    }
  }, [loadMessages, dispatch]);

  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;
    loadSessions();
    loadCurrentSession();
  }, [loadSessions, loadCurrentSession]);

  // mobile/responsive viewport tracking
  useEffect(() => {
    const updateViewport = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      if (isMobileDevice) {
        const actualHeight = Math.min(window.innerHeight, window.screen.height);
        setViewportHeight(`${actualHeight}px`);
        document.documentElement.style.setProperty('--app-height', `${actualHeight}px`);
        document.documentElement.style.setProperty('--vh', `${actualHeight * 0.01}px`);
      } else {
        setViewportHeight('100vh');
        document.documentElement.style.removeProperty('--app-height');
        document.documentElement.style.removeProperty('--vh');
      }
    };
    updateViewport();
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateViewport, 150);
    };
    window.addEventListener('resize', debouncedResize);
    const handleOrientationChange = () => setTimeout(updateViewport, 300);
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const setCurrentSessionAndSync = useCallback(async (sessionId: string) => {
    await selectSession(sessionId);
    setCurrentSession(sessionId);
    if (typeof window !== 'undefined') localStorage.setItem('currentSessionId', sessionId);
    await loadMessages(sessionId);
  }, [selectSession, loadMessages]);

  const startNewSession = () => {
    // Clear selection; do not create DB session until first send
    setCurrentSession(null);
    dispatch(setCurrentSessionAction(null));
    clearMessages();
    if (typeof window !== 'undefined') localStorage.removeItem('currentSessionId');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await removeSession(sessionId);
      if (currentSession === sessionId) {
        setCurrentSession(null);
        await selectSession(null);
        clearMessages();
        if (typeof window !== 'undefined') localStorage.removeItem('currentSessionId');
        // Hydrate current session from server to align with authoritative state
        await loadCurrentSession();
      } else {
        // Still refresh sessions list for accurate counts
        await loadSessions();
      }
    } catch {
      // ignore
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    let sessionId = currentSession;
    if (!sessionId) {
      // Create now at first send (no background creation)
      try {
        const defaultTitle = resolveDefaultTitle();
        const newSession = await createSession(defaultTitle);
        if (!newSession) return;
        await setCurrentSessionAndSync(newSession.id);
        sessionId = newSession.id;
      } catch {
        return;
      }
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    if (!sessionId) return;
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
          sessionId: sessionId ?? undefined,
          webSearchEnabled: options?.webSearchEnabled ?? false,
          selectedModel: options?.model,
          state: {},
        },
      });
    } catch (error) {
      setIsLoading(false);
      logger.error('Error sending message to AI', { component: 'useChatController', sessionId: sessionId || 'none', model: options?.model }, error instanceof Error ? error : new Error(String(error)));
    }
  }, [input, isLoading, currentSession, options?.webSearchEnabled, options?.model, setCurrentSessionAndSync, setMessages, sendAiMessage, saveMessage, resolveDefaultTitle, createSession]);

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

  const createObsessionsCompulsionsTable = useCallback(async () => {
    let sessionId = currentSession;
    if (!sessionId) {
      // Create new session if none exists
      try {
        const defaultTitle = resolveDefaultTitle();
        const newSession = await createSession(defaultTitle);
        if (!newSession) return;
        await setCurrentSessionAndSync(newSession.id);
        sessionId = newSession.id;
      } catch (error) {
        logger.error('Failed to create session for obsessions table', { error });
        return;
      }
    }

    const baseData: ObsessionsCompulsionsData = {
      obsessions: [],
      compulsions: [],
      lastModified: new Date().toISOString(),
    };

    const { formatObsessionsCompulsionsForChat } = await import('@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions');
    const tableContent = formatObsessionsCompulsionsForChat(baseData);

    // Create obsessions and compulsions table message
    await _addMessageToChat({
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
  }, [currentSession, resolveDefaultTitle, setCurrentSessionAndSync, setMessages, saveMessage, createSession]);

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
    addMessageToChat: _addMessageToChat,
    updateMessageMetadata,
    setMemoryContext,
    createObsessionsCompulsionsTable,
  };
}
