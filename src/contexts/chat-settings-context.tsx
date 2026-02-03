'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { DEFAULT_MODEL_ID } from '@/features/chat/config';
import { getProviderForModel, isBYOKModel } from '@/ai/model-metadata';

interface ChatSettings {
  model: string;
  webSearchEnabled: boolean;
}

/**
 * Extended chat settings with derived properties
 */
export interface ChatSettingsWithDerived extends ChatSettings {
  /** Provider derived from selected model (null for system models) */
  selectedProvider: string | null;
  /** Whether the selected model is a BYOK model */
  isBYOK: boolean;
}

interface ChatState {
  isStreaming: boolean;
  currentInput: string;
  streamingMessageId: string | null;
  error: string | null;
  settings: ChatSettings;
}

interface ChatContextValue extends ChatState {
  updateSettings: (updates: Partial<ChatSettings>) => void;
  setStreaming: (streaming: { isStreaming: boolean; messageId?: string }) => void;
  setCurrentInput: (input: string) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  /** Settings with derived provider info */
  settingsWithProvider: ChatSettingsWithDerived;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatSettingsProvider({ children }: { children: ReactNode }) {
  // Simple React state - no localStorage persistence
  // Settings reset on page refresh (simpler and more predictable)
  const [settings, setSettings] = useState<ChatSettings>({
    model: DEFAULT_MODEL_ID,
    webSearchEnabled: false,
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [currentInput, setCurrentInputState] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [error, setErrorState] = useState<string | null>(null);

  const updateSettings = useCallback((updates: Partial<ChatSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const setStreaming = useCallback(
    ({ isStreaming, messageId }: { isStreaming: boolean; messageId?: string }) => {
      setIsStreaming(isStreaming);
      setStreamingMessageId(messageId || null);
    },
    []
  );

  const setCurrentInput = useCallback((input: string) => {
    setCurrentInputState(input);
  }, []);

  const clearMessages = useCallback(() => {
    setIsStreaming(false);
    setStreamingMessageId(null);
    setErrorState(null);
  }, []);

  const setError = useCallback((error: string | null) => {
    setErrorState(error);
    setIsStreaming(false);
    setStreamingMessageId(null);
  }, []);

  // Derive provider info from selected model
  const settingsWithProvider = useMemo<ChatSettingsWithDerived>(
    () => ({
      ...settings,
      selectedProvider: getProviderForModel(settings.model),
      isBYOK: isBYOKModel(settings.model),
    }),
    [settings]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value: ChatContextValue = useMemo(
    () => ({
      settings,
      isStreaming,
      currentInput,
      streamingMessageId,
      error,
      updateSettings,
      setStreaming,
      setCurrentInput,
      clearMessages,
      setError,
      settingsWithProvider,
    }),
    [
      settings,
      isStreaming,
      currentInput,
      streamingMessageId,
      error,
      updateSettings,
      setStreaming,
      setCurrentInput,
      clearMessages,
      setError,
      settingsWithProvider,
    ]
  );

  return <ChatContext value={value}>{children}</ChatContext>;
}

export function useChatSettings() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatSettings must be used within a ChatSettingsProvider');
  }
  return context;
}
