/**
 * Chat Core Hook
 *
 * Provides core message state management with a clean, minimal interface.
 * This hook handles the fundamental message operations that other hooks build upon.
 *
 * Responsibilities:
 * - Message state (messages array)
 * - Basic CRUD operations (add, update, remove)
 * - Temporary message handling
 * - State synchronization with ref
 */

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { MessageData } from '@/features/chat/messages/message';

export type Message = MessageData;

/**
 * Hydrates a message ensuring proper timestamp format.
 */
function hydrateMessage(raw: Message, metadata?: Message['metadata']): Message {
  return {
    ...raw,
    timestamp: raw.timestamp instanceof Date ? raw.timestamp : new Date(raw.timestamp),
    metadata: metadata ?? raw.metadata,
  };
}

/**
 * Generates a temporary ID for optimistic UI updates.
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Core message state interface returned by the hook.
 */
export interface ChatCoreState {
  /** Array of all messages in the current session */
  messages: Message[];
  /** Ref to current messages for use in callbacks */
  messagesRef: React.RefObject<Message[]>;
}

/**
 * Core message actions interface returned by the hook.
 */
export interface ChatCoreActions {
  /** Sets all messages (replaces current state) */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** Adds a message to the state */
  addMessage: (message: Message) => void;
  /** Updates a specific message by ID */
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  /** Removes a message by ID */
  removeMessage: (messageId: string) => void;
  /** Clears all messages */
  clearMessages: () => void;
  /** Adds a temporary message (UI only) and returns its ID */
  addTemporaryMessage: (message: Omit<Message, 'id'>) => string;
  /** Removes a temporary message by ID */
  removeTemporaryMessage: (messageId: string) => void;
  /** Replaces a temporary message ID with a permanent one */
  replaceTempId: (tempId: string, newId: string, updates?: Partial<Message>) => void;
}

/**
 * Hook for core message state management.
 * Provides a clean, minimal interface for message operations.
 *
 * @returns Object containing message state and actions
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { messages, actions } = useChatCore();
 *
 *   const handleSend = async (content: string) => {
 *     const tempId = actions.addTemporaryMessage({
 *       role: 'user',
 *       content,
 *       timestamp: new Date(),
 *     });
 *
 *     const savedMessage = await saveToServer(content);
 *     actions.replaceTempId(tempId, savedMessage.id);
 *   };
 *
 *   return <MessageList messages={messages} />;
 * }
 * ```
 */
export function useChatCore(): { state: ChatCoreState; actions: ChatCoreActions } {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /** Adds a message to the state */
  const addMessage = useCallback((message: Message) => {
    const hydrated = hydrateMessage(message, message.metadata);
    setMessages((prev) => [...prev, hydrated]);
  }, []);

  /** Updates a specific message by ID */
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        return hydrateMessage({ ...msg, ...updates }, updates.metadata ?? msg.metadata);
      })
    );
  }, []);

  /** Removes a message by ID */
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  /** Clears all messages */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /** Adds a temporary message (UI only) and returns its ID */
  const addTemporaryMessage = useCallback((message: Omit<Message, 'id'>) => {
    const tempId = generateTempId();
    const tempMessage: Message = { id: tempId, ...message };
    const hydrated = hydrateMessage(tempMessage, tempMessage.metadata);
    setMessages((prev) => [...prev, hydrated]);
    return tempId;
  }, []);

  /** Removes a temporary message by ID */
  const removeTemporaryMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  /** Replaces a temporary message ID with a permanent one */
  const replaceTempId = useCallback((tempId: string, newId: string, updates?: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== tempId) return msg;
        const updated: Message = {
          ...msg,
          ...updates,
          id: newId,
        };
        return hydrateMessage(updated, updates?.metadata ?? msg.metadata);
      })
    );
  }, []);

  // Memoize state object
  const state = useMemo<ChatCoreState>(
    () => ({
      messages,
      messagesRef,
    }),
    [messages]
  );

  // Memoize actions object
  const actions = useMemo<ChatCoreActions>(
    () => ({
      setMessages,
      addMessage,
      updateMessage,
      removeMessage,
      clearMessages,
      addTemporaryMessage,
      removeTemporaryMessage,
      replaceTempId,
    }),
    [
      addMessage,
      updateMessage,
      removeMessage,
      clearMessages,
      addTemporaryMessage,
      removeTemporaryMessage,
      replaceTempId,
    ]
  );

  return { state, actions };
}

export default useChatCore;
