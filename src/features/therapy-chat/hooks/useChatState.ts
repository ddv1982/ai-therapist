/**
 * Chat State Hook
 *
 * Consolidates all state management for the chat interface.
 * Extracts state from ChatPageContent to reduce complexity.
 */

'use client';

import { useMemo } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import type { UiSession } from '@/lib/chat/session-mapper';
import type { MemoryContextInfo } from '@/lib/chat/memory-utils';

export interface ChatState {
  // Message state
  messages: MessageData[];
  isLoading: boolean;
  isGeneratingReport: boolean;

  // Session state
  sessions: UiSession[];
  currentSession: string | null;

  // Input state
  input: string;

  // UI state
  isMobile: boolean;
  viewportHeight: string;
  showSidebar: boolean;
  isNearBottom: boolean;

  // Memory context
  memoryContext: MemoryContextInfo;

  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  inputContainerRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseChatStateParams {
  messages: MessageData[];
  sessions: UiSession[];
  currentSession: string | null;
  input: string;
  isLoading: boolean;
  isMobile: boolean;
  viewportHeight: string;
  isGeneratingReport: boolean;
  memoryContext: MemoryContextInfo;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  inputContainerRef: React.RefObject<HTMLDivElement | null>;
  isNearBottom: boolean;
  showSidebar: boolean;
}

/**
 * Hook to consolidate chat state into a single object.
 * This reduces prop drilling and makes state management clearer.
 */
export function useChatState(params: UseChatStateParams): ChatState {
  const chatState = useMemo<ChatState>(
    () => ({
      messages: params.messages,
      sessions: params.sessions,
      currentSession: params.currentSession,
      input: params.input,
      isLoading: params.isLoading,
      isMobile: params.isMobile,
      viewportHeight: params.viewportHeight,
      isGeneratingReport: params.isGeneratingReport,
      memoryContext: params.memoryContext,
      textareaRef: params.textareaRef,
      messagesContainerRef: params.messagesContainerRef,
      inputContainerRef: params.inputContainerRef,
      isNearBottom: params.isNearBottom,
      showSidebar: params.showSidebar,
    }),
    [
      params.messages,
      params.sessions,
      params.currentSession,
      params.input,
      params.isLoading,
      params.isMobile,
      params.viewportHeight,
      params.isGeneratingReport,
      params.memoryContext,
      params.textareaRef,
      params.messagesContainerRef,
      params.inputContainerRef,
      params.isNearBottom,
      params.showSidebar,
    ]
  );

  return chatState;
}
