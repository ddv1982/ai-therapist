/**
 * Chat Persistence Hook
 *
 * Provides message persistence functionality for the chat interface.
 * Handles loading messages from Convex and saving messages back.
 * Integrates with the message encryption system for sensitive therapeutic content.
 *
 * @module useChatPersistence
 */

'use client';

import { useCallback, useMemo } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import { MessagePersistenceService } from '@/features/chat/lib/message-persistence.service';
import { chatApiClientAdapter } from '@/features/chat/lib/api-client-adapter';
import { logger } from '@/lib/utils/logger';

/**
 * Result type for load messages operation.
 */
export interface LoadMessagesResult {
  messages: MessageData[];
  success: boolean;
  error?: string;
}

/**
 * Result type for save message operation.
 */
export interface SaveMessageResult {
  success: boolean;
  savedMessage?: MessageData;
  error?: string;
}

/**
 * Payload for saving a new message.
 */
export interface SaveMessagePayload {
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Return type for the useChatPersistence hook.
 */
export interface UseChatPersistenceReturn {
  /** Load all messages for the current session */
  loadMessages: () => Promise<LoadMessagesResult>;
  /** Save a new message to the current session */
  saveMessage: (payload: SaveMessagePayload) => Promise<SaveMessageResult>;
  /** Check if the hook has a valid session */
  hasSession: boolean;
}

/**
 * Hook for persisting chat messages to the database.
 * Provides load and save functionality for messages in a therapy session.
 *
 * @param sessionId - The session ID to persist messages for, or null if no session
 * @returns Object containing load/save functions and session status
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { loadMessages, saveMessage, hasSession } = useChatPersistence(sessionId);
 *
 *   useEffect(() => {
 *     if (hasSession) {
 *       loadMessages().then(result => {
 *         if (result.success) {
 *           setMessages(result.messages);
 *         }
 *       });
 *     }
 *   }, [hasSession, loadMessages]);
 *
 *   const handleSendMessage = async (content: string) => {
 *     const result = await saveMessage({ role: 'user', content });
 *     if (!result.success) {
 *       console.error(result.error);
 *     }
 *   };
 * }
 * ```
 */
export function useChatPersistence(sessionId: string | null): UseChatPersistenceReturn {
  // Memoize the persistence service to avoid recreation
  const persistenceService = useMemo(
    () => new MessagePersistenceService({ apiClient: chatApiClientAdapter }),
    []
  );

  const hasSession = sessionId !== null && sessionId.length > 0;

  /**
   * Load all messages for the current session from the database.
   * Returns an empty array if no session is set.
   */
  const loadMessages = useCallback(async (): Promise<LoadMessagesResult> => {
    if (!sessionId) {
      return { messages: [], success: true };
    }

    try {
      const result = await persistenceService.loadMessages(sessionId);

      if (!result.success) {
        logger.error('Failed to load messages', {
          component: 'useChatPersistence',
          operation: 'loadMessages',
          sessionId,
          error: result.error.message,
        });
        return {
          messages: [],
          success: false,
          error: result.error.message,
        };
      }

      // Transform to MessageData format with proper timestamps
      const messages: MessageData[] = result.data.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
        modelUsed: msg.modelUsed,
        metadata: msg.metadata,
      }));

      return { messages, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error loading messages';
      logger.error(
        'Error loading messages',
        {
          component: 'useChatPersistence',
          operation: 'loadMessages',
          sessionId,
        },
        error instanceof Error ? error : new Error(errorMessage)
      );
      return {
        messages: [],
        success: false,
        error: errorMessage,
      };
    }
  }, [sessionId, persistenceService]);

  /**
   * Save a new message to the current session.
   * Returns an error if no session is set.
   */
  const saveMessage = useCallback(
    async (payload: SaveMessagePayload): Promise<SaveMessageResult> => {
      if (!sessionId) {
        return {
          success: false,
          error: 'No session ID provided. Cannot save message.',
        };
      }

      try {
        const result = await persistenceService.saveMessage(sessionId, {
          role: payload.role,
          content: payload.content,
          modelUsed: payload.modelUsed,
          metadata: payload.metadata,
        });

        if (!result.success) {
          logger.error('Failed to save message', {
            component: 'useChatPersistence',
            operation: 'saveMessage',
            sessionId,
            role: payload.role,
            error: result.error.message,
          });
          return {
            success: false,
            error: result.error.message,
          };
        }

        // Transform the saved message to MessageData format
        const savedMessage: MessageData = {
          id: result.data.savedMessage.id,
          role: result.data.savedMessage.role as 'user' | 'assistant',
          content: result.data.savedMessage.content,
          timestamp: result.data.savedMessage.timestamp
            ? new Date(result.data.savedMessage.timestamp)
            : new Date(),
          modelUsed: result.data.savedMessage.modelUsed ?? undefined,
          metadata: result.data.savedMessage.metadata ?? undefined,
        };

        return { success: true, savedMessage };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error saving message';
        logger.error(
          'Error saving message',
          {
            component: 'useChatPersistence',
            operation: 'saveMessage',
            sessionId,
            role: payload.role,
          },
          error instanceof Error ? error : new Error(errorMessage)
        );
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [sessionId, persistenceService]
  );

  return {
    loadMessages,
    saveMessage,
    hasSession,
  };
}
