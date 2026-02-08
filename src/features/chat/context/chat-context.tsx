'use client';

import { createContext, useContext, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTherapyChat } from '@/hooks/chat/use-therapy-chat';
import { useChatUI } from '@/hooks/chat/use-chat-ui';
import {
  useChatModals,
  type ChatModalsState,
  type ChatModalsActions,
} from '@/features/chat/hooks/use-chat-modals';
import { useChatSessions } from '@/hooks/chat/use-chat-sessions';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { useMemoryContext } from '@/hooks/use-memory-context';
import { useChatSettings } from '@/contexts/chat-settings-context';
import { useSession } from '@/contexts/session-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useApiKeys } from '@/hooks/use-api-keys';
import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID, LOCAL_MODEL_ID } from '@/features/chat/config';
import { getModelDisplayName, supportsWebSearch, MODEL_IDS } from '@/ai/model-metadata';
import { logger } from '@/lib/utils/logger';
import { apiClient } from '@/lib/api/client';
import { generateUUID } from '@/lib/utils';
import type { MessageData } from '@/features/chat/messages/message';
import type { UiSession } from '@/features/chat/lib/session-mapper';
import type { MemoryContextInfo } from '@/features/chat/lib/memory-utils';
import type { ObsessionsCompulsionsData } from '@/types';

/**
 * Consolidated chat state interface.
 * Contains all state needed by chat UI components.
 */
export interface ChatState {
  messages: MessageData[];
  isLoading: boolean;
  isGeneratingReport: boolean;
  isSessionReadyForReport: boolean;
  sessions: UiSession[];
  currentSession: string | null;
  input: string;
  isMobile: boolean;
  viewportHeight: string;
  showSidebar: boolean;
  isNearBottom: boolean;
  memoryContext: MemoryContextInfo;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  inputContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Interface for all chat action handlers.
 */
export interface ChatActions {
  handleInputChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  openCBTDiary: () => void;
  handleCreateObsessionsTable: () => Promise<void>;
  handleWebSearchToggle: () => void;
  handleSmartModelToggle: () => void;
  handleLocalModelToggle: () => Promise<void>;
  scrollToBottom: () => void;
  setShowSidebar: (show: boolean) => void;
}

/**
 * Controller interface kept for compatibility with existing consumers.
 * Trimmed to the fields currently used by the app.
 */
export interface ChatController {
  currentSession: string | null;
  isLoading: boolean;
  inputContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  setShowSidebar: (value: boolean) => void;
  generateReport: () => Promise<void>;
  stopGenerating: () => void;
  startNewSession: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
  setCurrentSessionAndSync: (sessionId: string) => Promise<void>;
  addMessageToChat: (message: {
    content: string;
    role: 'user' | 'assistant';
    sessionId: string;
    modelUsed?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<{ success: boolean; error?: string }>;
  updateMessageMetadata: (
    sessionId: string,
    messageId: string,
    metadata: Record<string, unknown>,
    options?: { mergeStrategy?: 'merge' | 'replace' }
  ) => Promise<{ success: boolean; error?: string }>;
  setMemoryContext: (info: MemoryContextInfo) => void;
}

interface ChatContextValue {
  state: ChatState;
  actions: ChatActions;
  modals: ChatModalsState;
  modalActions: ChatModalsActions;
  controller: ChatController;
  modelLabel: string;
  byokActive: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { settings, updateSettings } = useChatSettings();
  const toastT = useTranslations('toast');
  const { showToast } = useToast();
  const { keys: apiKeys, isActive: byokActive, setActive: setByokActive } = useApiKeys();
  const { currentSessionId, selectionStatus } = useSession();

  // Get BYOK key if active
  const byokKey = byokActive ? (apiKeys.openai ?? null) : null;

  // Reset system model selection when BYOK is activated
  useEffect(() => {
    if (byokActive) {
      updateSettings({
        model: DEFAULT_MODEL_ID,
        webSearchEnabled: false,
      });
    }
  }, [byokActive, updateSettings]);

  const effectiveModelId = byokActive
    ? MODEL_IDS.byok
    : settings.webSearchEnabled
      ? ANALYTICAL_MODEL_ID
      : settings.model;

  const modelLabel = useMemo(() => {
    if (byokActive) {
      return `${getModelDisplayName(MODEL_IDS.byok)} (Your Key)`;
    }
    const base = getModelDisplayName(effectiveModelId);
    return supportsWebSearch(effectiveModelId) ? `${base} (Deep Analysis)` : base;
  }, [effectiveModelId, byokActive]);

  // Ref to store loadSessions for use in onFinish callback
  const loadSessionsRef = useRef<(() => Promise<void>) | null>(null);

  // Use the new useTherapyChat hook
  const therapyChat = useTherapyChat({
    sessionId: currentSessionId,
    model: settings.model,
    webSearchEnabled: settings.webSearchEnabled,
    byokKey,
    onFinish: () => {
      // Refresh sessions to pick up title changes
      void loadSessionsRef.current?.();
    },
  });

  // UI state (input, loading, viewport, refs)
  const { state: uiState, refs: uiRefs, actions: uiActions } = useChatUI();
  const { showSidebar, isGeneratingReport, isMobile, viewportHeight } = uiState;
  const { textareaRef, messagesContainerRef, inputContainerRef } = uiRefs;
  const { setShowSidebar, setIsGeneratingReport, scheduleFocus } = uiActions;

  // Memory context
  const { memoryContext, setMemoryContext } = useMemoryContext(currentSessionId);

  // Scroll management
  const { scrollToBottom, isNearBottom } = useScrollToBottom({
    isStreaming: therapyChat.isLoading,
    messages: therapyChat.messages,
    container: messagesContainerRef.current,
    behavior: 'smooth',
    respectUserScroll: true,
  });

  // Session management with message loading via therapyChat
  const loadMessages = useCallback(
    async (_sessionId: string) => {
      // Load messages explicitly when switching sessions
      await therapyChat.loadSessionMessages();
    },
    [therapyChat]
  );

  const clearMessages = useCallback(() => {
    therapyChat.clearSession();
  }, [therapyChat]);

  const resolveDefaultTitle = useCallback((): string => {
    // Use translated title or fallback
    return 'New Chat';
  }, []);

  const {
    sessions,
    currentSession,
    loadSessions,
    ensureActiveSession,
    startNewSession: resetSessionState,
    deleteSession,
    setCurrentSessionAndLoad,
  } = useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle });

  // Store loadSessions in ref for onFinish callback
  loadSessionsRef.current = loadSessions;

  const isSessionReadyForReport =
    Boolean(currentSession) && selectionStatus.phase === 'idle' && !isGeneratingReport;

  const generateReport = useCallback(async () => {
    if (!currentSession || !isSessionReadyForReport) return;
    setIsGeneratingReport(true);

    try {
      const result = await apiClient.generateReportDetailed({
        sessionId: currentSession,
        model: settings.model,
      });

      const dataObj = (result as { success?: boolean; data?: { reportContent?: unknown } }).data;
      const legacyReport = (result as { reportContent?: unknown }).reportContent;
      const content =
        typeof dataObj?.reportContent === 'string'
          ? (dataObj.reportContent as string)
          : typeof legacyReport === 'string'
            ? (legacyReport as string)
            : undefined;

      if (content) {
        const reportMessage: MessageData = {
          id: generateUUID(),
          role: 'assistant' as const,
          content: `📊 **Session Report**\n\n${content}`,
          timestamp: new Date(),
          modelUsed: settings.model,
        };
        therapyChat.setMessages((prev) => [...prev, reportMessage]);
        try {
          await apiClient.postMessage(currentSession, {
            role: 'assistant',
            content: reportMessage.content,
            modelUsed: settings.model,
          });
          await loadSessions();
        } catch {
          // Ignore persistence errors for reports
        }
      } else {
        logger.error('Invalid report generation response payload', {
          component: 'ChatProvider',
          operation: 'generateReport',
          sessionId: currentSession,
        });
        showToast({
          type: 'error',
          title: toastT('issueReportFailedTitle'),
          message: toastT('generalRetry'),
        });
      }
    } catch (error) {
      const apiError = error as Error & { status?: number; body?: unknown };
      const body = apiError.body as { error?: { code?: string; message?: string } } | undefined;
      const isNoMessagesError =
        apiError.status === 422 && body?.error?.code === 'NO_REPORTABLE_MESSAGES';

      if (isNoMessagesError) {
        showToast({
          type: 'info',
          title: toastT('noCbtSessionTitle'),
          message: 'No reportable messages found for this session yet.',
        });
        return;
      }

      logger.error(
        'Report generation failed',
        {
          component: 'ChatProvider',
          operation: 'generateReport',
          sessionId: currentSession,
          status: apiError.status,
        },
        apiError
      );
      showToast({
        type: 'error',
        title: toastT('sendFailedTitle'),
        message: body?.error?.message || toastT('sendFailedBody'),
      });
    } finally {
      setIsGeneratingReport(false);
    }
  }, [
    currentSession,
    isSessionReadyForReport,
    settings.model,
    loadSessions,
    setIsGeneratingReport,
    therapyChat,
    showToast,
    toastT,
  ]);

  // Send message handler
  const sendMessage = useCallback(async () => {
    const messageText = therapyChat.input;
    if (!messageText.trim() || therapyChat.isLoading) return;

    // Pass ensureSession to handleSubmit to create session if needed
    await therapyChat.handleSubmit(undefined, { ensureSession: ensureActiveSession });
  }, [therapyChat, ensureActiveSession]);

  // Stop generating
  const stopGenerating = useCallback(() => {
    therapyChat.stop();
    scheduleFocus(50);
  }, [therapyChat, scheduleFocus]);

  // Start new session
  const startNewSession = useCallback(() => {
    void (async () => {
      await resetSessionState();
      therapyChat.clearSession();
      scheduleFocus(100);
    })();
  }, [resetSessionState, therapyChat, scheduleFocus]);

  // Set current session and sync
  const setCurrentSessionAndSync = useCallback(
    async (sessionId: string) => {
      await setCurrentSessionAndLoad(sessionId);
    },
    [setCurrentSessionAndLoad]
  );

  // Add message to chat (for backward compatibility)
  const addMessageToChat = useCallback(
    async (message: {
      content: string;
      role: 'user' | 'assistant';
      sessionId: string;
      modelUsed?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    }): Promise<{ success: boolean; error?: string }> => {
      const tempId = generateUUID();
      const newMessage: MessageData = {
        id: tempId,
        role: message.role,
        content: message.content,
        timestamp: new Date(),
        modelUsed: message.modelUsed,
        metadata: message.metadata,
      };

      // Add to UI immediately
      therapyChat.setMessages((prev) => [...prev, newMessage]);

      try {
        // Persist to database
        const response = await apiClient.postMessage(message.sessionId, {
          role: message.role,
          content: message.content,
          modelUsed: message.modelUsed,
          metadata: message.metadata,
        });

        // Update with real database ID
        const dbId = response.data?.id;
        if (dbId && dbId !== tempId) {
          therapyChat.setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: dbId } : m))
          );
        }

        return { success: true };
      } catch (error) {
        // Remove the message on failure
        therapyChat.setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const errorMessage = error instanceof Error ? error.message : 'Failed to add message';
        return { success: false, error: errorMessage };
      }
    },
    [therapyChat]
  );

  // Update message metadata
  const updateMessageMetadata = useCallback(
    async (
      sessionId: string,
      messageId: string,
      metadata: Record<string, unknown>,
      options?: { mergeStrategy?: 'merge' | 'replace' }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await apiClient.patchMessageMetadata(sessionId, messageId, {
          metadata,
          mergeStrategy: options?.mergeStrategy,
        });

        // Update in UI
        therapyChat.setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  metadata:
                    options?.mergeStrategy === 'replace'
                      ? metadata
                      : { ...(msg.metadata ?? {}), ...metadata },
                }
              : msg
          )
        );

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update metadata';
        return { success: false, error: errorMessage };
      }
    },
    [therapyChat]
  );

  // Create obsessions/compulsions table
  const createObsessionsCompulsionsTable = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    let sessionId: string;

    try {
      sessionId = await ensureActiveSession();
    } catch (error) {
      logger.error(
        'Failed to ensure session for obsessions table',
        { component: 'ChatProvider' },
        error instanceof Error ? error : new Error(String(error))
      );
      return { success: false, error: 'Could not prepare a session for the tracker.' };
    }

    const baseData: ObsessionsCompulsionsData = {
      obsessions: [],
      compulsions: [],
      lastModified: new Date().toISOString(),
    };

    const { formatObsessionsCompulsionsForChat } =
      await import('@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions');
    const tableContent = formatObsessionsCompulsionsForChat(baseData);

    const result = await addMessageToChat({
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
        component: 'ChatProvider',
        operation: 'createObsessionsCompulsionsTable',
        sessionId,
        error: result.error,
      });
      return { success: false, error: result.error ?? 'Failed to add the tracker message.' };
    }

    return { success: true };
  }, [ensureActiveSession, addMessageToChat]);

  // Build the controller object for compatibility with existing consumers
  const controller: ChatController = useMemo(
    () => ({
      currentSession,
      isLoading: therapyChat.isLoading,
      messagesContainerRef,
      inputContainerRef,
      stopGenerating,
      startNewSession,
      deleteSession,
      setCurrentSessionAndSync,
      generateReport,
      setShowSidebar,
      addMessageToChat,
      updateMessageMetadata,
      setMemoryContext,
    }),
    [
      currentSession,
      therapyChat.isLoading,
      messagesContainerRef,
      inputContainerRef,
      stopGenerating,
      startNewSession,
      deleteSession,
      setCurrentSessionAndSync,
      generateReport,
      setShowSidebar,
      addMessageToChat,
      updateMessageMetadata,
      setMemoryContext,
    ]
  );

  // Build the consolidated state object
  const state: ChatState = useMemo(
    () => ({
      messages: therapyChat.messages,
      sessions,
      currentSession,
      input: therapyChat.input,
      isLoading: therapyChat.isLoading,
      isMobile,
      viewportHeight,
      isGeneratingReport,
      isSessionReadyForReport,
      memoryContext,
      textareaRef,
      messagesContainerRef,
      inputContainerRef,
      isNearBottom,
      showSidebar,
    }),
    [
      therapyChat.messages,
      therapyChat.input,
      therapyChat.isLoading,
      sessions,
      currentSession,
      isMobile,
      viewportHeight,
      isGeneratingReport,
      isSessionReadyForReport,
      memoryContext,
      textareaRef,
      messagesContainerRef,
      inputContainerRef,
      isNearBottom,
      showSidebar,
    ]
  );

  // Helper to update settings with BYOK sync
  const updateSettingsWithSync = useCallback(
    (updates: Parameters<typeof updateSettings>[0]) => {
      setByokActive(false);
      updateSettings(updates);
    },
    [updateSettings, setByokActive]
  );

  // Build the actions object
  const actions: ChatActions = useMemo(() => {
    const handleInputChange = (value: string) => {
      therapyChat.setInput(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      void sendMessage();
    };

    const openCBTDiary = () => {
      router.push('/cbt-diary');
    };

    const handleCreateObsessionsTable = async () => {
      const result = await createObsessionsCompulsionsTable();
      if (!result.success) {
        showToast({
          type: 'error',
          title: toastT('trackerCreateFailedTitle'),
          message: result.error ?? toastT('generalRetry'),
        });
        return;
      }
      showToast({
        type: 'success',
        title: toastT('trackerCreateSuccessTitle'),
        message: toastT('trackerCreateSuccessBody'),
      });
    };

    const handleWebSearchToggle = () => {
      const newWebSearchEnabled = !settings.webSearchEnabled;
      updateSettingsWithSync({
        webSearchEnabled: newWebSearchEnabled,
        model: newWebSearchEnabled ? ANALYTICAL_MODEL_ID : DEFAULT_MODEL_ID,
      });
    };

    const handleSmartModelToggle = () => {
      const nextModel =
        settings.model === ANALYTICAL_MODEL_ID ? DEFAULT_MODEL_ID : ANALYTICAL_MODEL_ID;
      updateSettingsWithSync({
        model: nextModel,
        webSearchEnabled: false,
      });
    };

    const handleLocalModelToggle = async () => {
      const isLocal = settings.model === LOCAL_MODEL_ID;

      if (isLocal) {
        updateSettingsWithSync({
          model: DEFAULT_MODEL_ID,
          webSearchEnabled: false,
        });
        return;
      }

      showToast({
        type: 'info',
        title: toastT('checkingLocalModelTitle'),
        message: toastT('checkingLocalModelBody'),
      });

      try {
        const response = await fetch('/api/ollama/health', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(
            payload?.error?.message ?? 'Unexpected response from Ollama health endpoint.'
          );
        }

        const health = payload.data as
          | { ok?: boolean; message?: string; status?: string }
          | undefined;

        if (health?.ok) {
          updateSettingsWithSync({
            model: LOCAL_MODEL_ID,
            webSearchEnabled: false,
          });
          showToast({
            type: 'success',
            title: toastT('localModelReadyTitle'),
            message: health.message ?? toastT('localModelReadyBody'),
          });
        } else {
          const statusMessage = health?.message ?? toastT('localModelUnavailableBody');
          showToast({
            type: 'error',
            title: toastT('localModelUnavailableTitle'),
            message: statusMessage,
          });
        }
      } catch {
        showToast({
          type: 'error',
          title: toastT('connectionErrorTitle'),
          message: toastT('connectionErrorBody'),
        });
      }
    };

    const actionScrollToBottom = () => {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 50);
    };

    return {
      handleInputChange,
      handleKeyDown,
      handleFormSubmit,
      openCBTDiary,
      handleCreateObsessionsTable,
      handleWebSearchToggle,
      handleSmartModelToggle,
      handleLocalModelToggle,
      scrollToBottom: actionScrollToBottom,
      setShowSidebar,
    };
  }, [
    therapyChat,
    sendMessage,
    router,
    showToast,
    toastT,
    createObsessionsCompulsionsTable,
    settings,
    updateSettingsWithSync,
    scrollToBottom,
    textareaRef,
    setShowSidebar,
  ]);

  const { modals, actions: modalActions } = useChatModals();

  const value = useMemo(
    () => ({
      state,
      actions,
      modals,
      modalActions,
      controller,
      modelLabel,
      byokActive,
    }),
    [state, actions, modals, modalActions, controller, modelLabel, byokActive]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
