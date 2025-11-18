/**
 * Chat UI Context
 *
 * Provides a bridge between CBT components and the main chat UI,
 * allowing CBT messages to appear in the chat interface immediately
 * when they are sent.
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { logger } from '@/lib/utils/logger';

// Chat UI Bridge interface
export interface ChatUIBridge {
  /**
   * Add a message to both the chat UI and database
   * This is the main function CBT components will use
   */
  addMessageToChat: (message: {
    content: string;
    role: 'user' | 'assistant';
    sessionId: string;
    modelUsed?: string;
    source?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  /**
   * Current active session ID
   */
  currentSessionId: string | null;

  /**
   * Whether the chat is currently in a loading state
   */
  isLoading?: boolean;
}

// Create the context with undefined default (will be provided by provider)
const ChatUIContext = createContext<ChatUIBridge | null>(null);

// Provider component props
interface ChatUIProviderProps {
  children: ReactNode;
  bridge: ChatUIBridge;
}

/**
 * Provider component that makes the chat UI bridge available to child components
 */
export function ChatUIProvider({ children, bridge }: ChatUIProviderProps) {
  return <ChatUIContext.Provider value={bridge}>{children}</ChatUIContext.Provider>;
}

/**
 * Hook to access the chat UI bridge from CBT components
 */
export function useChatUI(): ChatUIBridge {
  const context = useContext(ChatUIContext);

  if (!context) {
    // Provide a fallback that logs warnings but doesn't crash
    logger.warn('useChatUI called outside of ChatUIProvider', {
      component: 'ChatUIContext',
      operation: 'useChatUI',
      message: 'CBT messages will not appear in chat UI',
    });
    return {
      addMessageToChat: async (message) => {
        logger.warn('CBT message not added to chat UI', {
          component: 'ChatUIContext',
          operation: 'addMessageToChat',
          reason: 'No ChatUIProvider found',
          messagePreview: message.content.substring(0, 50) + '...',
        });
        return { success: false, error: 'No ChatUIProvider found' };
      },
      currentSessionId: null,
      isLoading: false,
    };
  }

  return context;
}

/**
 * Hook to check if chat UI bridge is available
 */
export function useChatUIAvailable(): boolean {
  const context = useContext(ChatUIContext);
  return context !== null;
}
