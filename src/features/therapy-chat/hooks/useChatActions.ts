/**
 * Chat Actions Hook
 *
 * Consolidates all action handlers for the chat interface.
 * Extracts actions from ChatPageContent to reduce complexity.
 */

'use client';

import { useCallback } from 'react';
import type { ObsessionsCompulsionsData } from '@/types';
import type { ChatState } from './useChatState';

export interface ChatActions {
  // Input handlers
  handleInputChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleFormSubmit: (e: React.FormEvent) => void;

  // Navigation
  openCBTDiary: () => void;

  // Obsessions/Compulsions
  handleObsessionsCompulsionsComplete: (data: ObsessionsCompulsionsData) => Promise<void>;
  handleCreateObsessionsTable: () => Promise<void>;

  // Settings toggles
  handleWebSearchToggle: () => void;
  handleSmartModelToggle: () => void;
  handleLocalModelToggle: () => Promise<void>;

  // Scroll actions
  scrollToBottom: () => void;
}

export interface UseChatActionsParams {
  // State
  chatState: ChatState;

  // Core actions from controller
  setInput: (value: string) => void;
  sendMessage: () => Promise<void>;
  addMessageToChat: (message: {
    content: string;
    role: 'user' | 'assistant';
    sessionId: string;
    metadata?: Record<string, unknown>;
  }) => Promise<{ success: boolean; error?: string }>;
  createObsessionsCompulsionsTable: () => Promise<{ success: boolean; error?: string }>;
  scrollToBottom: (force?: boolean, delay?: number) => void;

  // Settings
  updateSettings: (settings: { model?: string; webSearchEnabled?: boolean }) => void;
  settings: { model: string; webSearchEnabled: boolean };

  // Navigation
  router: { push: (path: string) => void };

  // Toast
  showToast: (toast: {
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
  }) => void;

  // Translations
  toastT: (key: string) => string;
}

/**
 * Hook to consolidate all chat action handlers.
 * Uses useCallback for optimization and accepts chatState as parameter.
 */
export function useChatActions(params: UseChatActionsParams): ChatActions {
  const {
    chatState,
    setInput,
    sendMessage,
    addMessageToChat,
    createObsessionsCompulsionsTable,
    scrollToBottom: scrollToBottomFn,
    updateSettings,
    settings,
    router,
    showToast,
    toastT,
  } = params;

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
    },
    [setInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void sendMessage();
    },
    [sendMessage]
  );

  const openCBTDiary = useCallback(() => {
    router.push('/cbt-diary');
  }, [router]);

  const handleObsessionsCompulsionsComplete = useCallback(
    async (data: ObsessionsCompulsionsData) => {
      if (!chatState.currentSession) return;

      try {
        const { formatObsessionsCompulsionsForChat } = await import(
          '@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions'
        );
        const messageContent = formatObsessionsCompulsionsForChat(data);

        await addMessageToChat({
          content: messageContent,
          role: 'user',
          sessionId: chatState.currentSession,
          metadata: {
            type: 'obsessions-compulsions-table',
            data,
          },
        });
      } catch {
        showToast({
          type: 'error',
          title: toastT('saveFailedTitle'),
          message: toastT('saveFailedBody'),
        });
      }
    },
    [chatState.currentSession, addMessageToChat, showToast, toastT]
  );

  const handleCreateObsessionsTable = useCallback(async () => {
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
  }, [createObsessionsCompulsionsTable, showToast, toastT]);

  const handleWebSearchToggle = useCallback(() => {
    const newWebSearchEnabled = !settings.webSearchEnabled;
    updateSettings({
      webSearchEnabled: newWebSearchEnabled,
      ...(newWebSearchEnabled ? { model: 'gpt-4o' } : {}),
    });
  }, [settings.webSearchEnabled, updateSettings]);

  const handleSmartModelToggle = useCallback(() => {
    const nextModel = settings.model === 'claude-3-7-sonnet' ? 'gpt-4o' : 'claude-3-7-sonnet';
    updateSettings({
      model: nextModel,
      ...(nextModel === 'claude-3-7-sonnet' ? { webSearchEnabled: false } : {}),
    });
  }, [settings.model, updateSettings]);

  const handleLocalModelToggle = useCallback(async () => {
    const isLocal = settings.model === 'llama3.2';

    if (isLocal) {
      updateSettings({
        model: 'gpt-4o',
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
        updateSettings({
          model: 'llama3.2',
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
  }, [settings.model, updateSettings, showToast, toastT]);

  const scrollToBottom = useCallback(() => {
    scrollToBottomFn();
    setTimeout(() => chatState.textareaRef.current?.focus(), 50);
  }, [scrollToBottomFn, chatState.textareaRef]);

  return {
    handleInputChange,
    handleKeyDown,
    handleFormSubmit,
    openCBTDiary,
    handleObsessionsCompulsionsComplete,
    handleCreateObsessionsTable,
    handleWebSearchToggle,
    handleSmartModelToggle,
    handleLocalModelToggle,
    scrollToBottom,
  };
}
