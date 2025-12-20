/**
 * Chat State Hook
 *
 * Consolidates all state management for the chat interface.
 * Reduces complexity by aggregating chat-related state from multiple sources
 * into a single, memoized object for efficient prop passing.
 *
 * @module useChatState
 */

'use client';

import { useMemo } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import type { UiSession } from '@/features/chat/lib/session-mapper';
import type { MemoryContextInfo } from '@/features/chat/lib/memory-utils';

/**
 * Consolidated chat state interface.
 * Contains all state needed by chat UI components.
 *
 * @interface ChatState
 */
export interface ChatState {
  /** Array of all messages in the current session */
  messages: MessageData[];
  /** Whether AI is currently generating a response */
  isLoading: boolean;
  /** Whether a therapy report is being generated */
  isGeneratingReport: boolean;

  /** All available chat sessions */
  sessions: UiSession[];
  /** Currently active session ID */
  currentSession: string | null;

  /** Current value of the message input field */
  input: string;

  /** Whether running on mobile device */
  isMobile: boolean;
  /** CSS height value for viewport */
  viewportHeight: string;
  /** Whether the sidebar is visible */
  showSidebar: boolean;
  /** Whether user is scrolled near bottom */
  isNearBottom: boolean;

  /** Memory context for the current session */
  memoryContext: MemoryContextInfo;

  /** Ref to the input textarea element */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Ref to the messages scrollable container */
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to the input container for height measurements */
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
 * Consolidates multiple chat state parameters into a single, memoized state object.
 *
 * This hook aggregates chat state from various sources (controller, UI state, refs)
 * into a unified ChatState object, improving performance through memoization and
 * reducing prop drilling by providing a single state object to child components.
 *
 * @param {UseChatStateParams} params - All individual state parameters to consolidate
 * @returns {ChatState} Memoized chat state object containing all consolidated state
 *
 * @example
 * ```tsx
 * const chatState = useChatState({
 *   messages: controller.messages,
 *   sessions: controller.sessions,
 *   currentSession: controller.currentSession,
 *   input: controller.input,
 *   isLoading: controller.isLoading,
 *   // ... other params
 * });
 *
 * // Pass consolidated state to child components
 * <ChatContainer chatState={chatState} />
 * ```
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
