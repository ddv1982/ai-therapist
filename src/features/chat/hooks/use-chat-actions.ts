/**
 * Chat Actions Hook
 *
 * Consolidates all action handlers for the therapy chat interface.
 * Provides optimized, memoized callbacks for user interactions including
 * input handling, navigation, settings management, and therapy-specific actions.
 *
 * @module useChatActions
 */

'use client';

import { useCallback, useMemo } from 'react';
import type { ChatState } from '@/features/chat/hooks/use-chat-state';
import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID, LOCAL_MODEL_ID } from '@/features/chat/config';

/**
 * Interface for all chat action handlers.
 * Each action is memoized with useCallback for performance optimization.
 *
 * @interface ChatActions
 */
export interface ChatActions {
  /** Updates the input field value as user types */
  handleInputChange: (value: string) => void;
  /** Handles keyboard shortcuts (e.g., Enter to send, Shift+Enter for newline) */
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Handles form submission (send button click) */
  handleFormSubmit: (e: React.FormEvent) => void;

  /** Opens the CBT diary modal for thought tracking */
  openCBTDiary: () => void;

  /** Creates a new obsessions/compulsions tracking table */
  handleCreateObsessionsTable: () => Promise<void>;

  /** Toggles web search feature on/off */
  handleWebSearchToggle: () => void;
  /** Toggles between standard and analytical AI model */
  handleSmartModelToggle: () => void;
  /** Switches to/from local AI model */
  handleLocalModelToggle: () => Promise<void>;

  /** Scrolls messages container to bottom */
  scrollToBottom: () => void;

  /** Controls sidebar visibility */
  setShowSidebar: (show: boolean) => void;
}

export interface UseChatActionsParams {
  // State
  chatState: ChatState;

  // Core actions from controller
  setInput: (value: string) => void;
  sendMessage: () => Promise<void>;
  createObsessionsCompulsionsTable: () => Promise<{ success: boolean; error?: string }>;
  scrollToBottom: (force?: boolean, delay?: number) => void;
  setShowSidebar: (show: boolean) => void;

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

  // BYOK deactivation
  setByokActive: (active: boolean) => void;
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
    createObsessionsCompulsionsTable,
    scrollToBottom: scrollToBottomFn,
    updateSettings,
    settings,
    router,
    showToast,
    toastT,
    setByokActive,
    setShowSidebar,
  } = params;

  /**
   * Helper to update settings while ensuring BYOK is deactivated.
   * This centralizes the synchronization logic between system models and BYOK.
   */
  const updateSettingsWithSync = useCallback(
    (updates: Parameters<typeof updateSettings>[0]) => {
      setByokActive(false);
      updateSettings(updates);
    },
    [updateSettings, setByokActive]
  );

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
    updateSettingsWithSync({
      webSearchEnabled: newWebSearchEnabled,
      model: newWebSearchEnabled ? ANALYTICAL_MODEL_ID : DEFAULT_MODEL_ID,
    });
  }, [settings.webSearchEnabled, updateSettingsWithSync]);

  const handleSmartModelToggle = useCallback(() => {
    const nextModel =
      settings.model === ANALYTICAL_MODEL_ID ? DEFAULT_MODEL_ID : ANALYTICAL_MODEL_ID;
    updateSettingsWithSync({
      model: nextModel,
      webSearchEnabled: false,
    });
  }, [settings.model, updateSettingsWithSync]);

  const handleLocalModelToggle = useCallback(async () => {
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
  }, [settings.model, updateSettingsWithSync, showToast, toastT]);

  const scrollToBottom = useCallback(() => {
    scrollToBottomFn();
    setTimeout(() => chatState.textareaRef.current?.focus(), 50);
  }, [scrollToBottomFn, chatState.textareaRef]);

  // Memoize the actions object to prevent unnecessary re-renders in consumers
  return useMemo(
    () => ({
      handleInputChange,
      handleKeyDown,
      handleFormSubmit,
      openCBTDiary,
      handleCreateObsessionsTable,
      handleWebSearchToggle,
      handleSmartModelToggle,
      handleLocalModelToggle,
      scrollToBottom,
      setShowSidebar,
    }),
    [
      handleInputChange,
      handleKeyDown,
      handleFormSubmit,
      openCBTDiary,
      handleCreateObsessionsTable,
      handleWebSearchToggle,
      handleSmartModelToggle,
      handleLocalModelToggle,
      scrollToBottom,
      setShowSidebar,
    ]
  );
}
