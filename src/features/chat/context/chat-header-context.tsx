/**
 * Chat Header Context
 *
 * Provides centralized state management for chat header components.
 * Reduces prop drilling by making header state accessible to all nested components.
 *
 * @module ChatHeaderContext
 */

'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * State and actions available through ChatHeaderContext.
 * Provides all props needed by ChatHeader component and its children.
 *
 * @interface ChatHeaderState
 */
export interface ChatHeaderState {
  /** Whether the sidebar is currently visible */
  showSidebar: boolean;
  /** Callback to toggle sidebar visibility */
  onToggleSidebar: () => void;
  /** Whether there is an active chat session */
  hasActiveSession: boolean;
  /** Whether there are any messages in the current session */
  hasMessages: boolean;
  /** Whether a report is currently being generated */
  isGeneratingReport: boolean;
  /** Whether the chat is currently loading/streaming */
  isLoading: boolean;
  /** Whether the app is running on a mobile device */
  isMobile: boolean;
  /** Callback to generate a therapy session report */
  onGenerateReport: () => void;
  /** Callback to stop the current generation (message or report) */
  onStopGenerating: () => void;
  /** Callback to open the CBT diary modal */
  onOpenCBTDiary: () => void;
  /** Callback to create an obsessions/compulsions table */
  onCreateObsessionsTable: () => void;
  /** Display label for the current AI model */
  modelLabel: string;
}

/**
 * Context for sharing chat header state across components.
 * Value is undefined when used outside of ChatHeaderProvider.
 *
 * @private
 */
const ChatHeaderContext = createContext<ChatHeaderState | undefined>(undefined);

/**
 * Props for ChatHeaderProvider component.
 *
 * @interface ChatHeaderProviderProps
 */
export interface ChatHeaderProviderProps {
  /** Child components that will have access to chat header context */
  children: ReactNode;
  /** Initial state and callbacks for the chat header */
  value: ChatHeaderState;
}

/**
 * Provider component for chat header context.
 * Wraps ChatHeader and provides state to all child components.
 *
 * @component
 * @example
 * ```tsx
 * <ChatHeaderProvider value={headerState}>
 *   <ChatHeader />
 * </ChatHeaderProvider>
 * ```
 *
 * @param {ChatHeaderProviderProps} props - Provider configuration
 * @returns {JSX.Element} Provider component with context value
 */
export function ChatHeaderProvider({ children, value }: ChatHeaderProviderProps) {
  // Memoize the context value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => value, [
    value.showSidebar,
    value.hasActiveSession,
    value.hasMessages,
    value.isGeneratingReport,
    value.isLoading,
    value.isMobile,
    value.modelLabel,
    value.onToggleSidebar,
    value.onGenerateReport,
    value.onStopGenerating,
    value.onOpenCBTDiary,
    value.onCreateObsessionsTable,
  ]);

  return (
    <ChatHeaderContext value={memoizedValue}>
      {children}
    </ChatHeaderContext>
  );
}

/**
 * Hook to access chat header context.
 * Must be used within a ChatHeaderProvider.
 *
 * @throws {Error} When used outside of ChatHeaderProvider
 * @returns {ChatHeaderState} The current chat header state and callbacks
 *
 * @example
 * ```tsx
 * function HeaderButton() {
 *   const { onGenerateReport, isGeneratingReport } = useChatHeader();
 *   return (
 *     <button onClick={onGenerateReport} disabled={isGeneratingReport}>
 *       Generate Report
 *     </button>
 *   );
 * }
 * ```
 */
export function useChatHeader(): ChatHeaderState {
  const context = useContext(ChatHeaderContext);
  if (!context) {
    throw new Error('useChatHeader must be used within ChatHeaderProvider');
  }
  return context;
}
