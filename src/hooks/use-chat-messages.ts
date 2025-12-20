/**
 * Chat Messages Hook
 *
 * Provides message management functionality that can be shared between
 * the main chat interface and CBT components to ensure messages appear
 * in the UI immediately when sent.
 *
 * This hook orchestrates message state using extracted services:
 * - MessagePersistenceService: handles API communication
 * - MetadataManager: handles metadata updates and queuing
 */

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import { logger } from '@/lib/utils/logger';
import type { ObsessionsCompulsionsData } from '@/types';
import { parseObsessionsCompulsionsFromMarkdown } from '@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions';
import { isObsessionsCompulsionsMessage } from '@/features/therapy/obsessions-compulsions/utils/obsessions-message-detector';
import { MessagePersistenceService, MetadataManager } from '@/features/chat/lib';
import { chatApiClientAdapter } from '@/features/chat/lib/api-client-adapter';

export type Message = MessageData;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelUsed?: string;
}

/** Derives metadata from message content for special message types */
function deriveMetadataFromContent(content: string): Message['metadata'] | undefined {
  if (!content || !isObsessionsCompulsionsMessage(content)) return undefined;
  const parsed: ObsessionsCompulsionsData | null = parseObsessionsCompulsionsFromMarkdown(content);
  return {
    type: 'obsessions-compulsions-table',
    step: 'obsessions-compulsions',
    data: parsed ?? { obsessions: [], compulsions: [], lastModified: new Date().toISOString() },
  };
}

/** Hydrates a message ensuring proper timestamp format */
function hydrateMessage(raw: Message, metadata?: Message['metadata']): Message {
  return {
    ...raw,
    timestamp: raw.timestamp instanceof Date ? raw.timestamp : new Date(raw.timestamp),
    metadata: metadata ?? raw.metadata,
  };
}

/**
 * Hook for managing chat messages with both UI state and database persistence.
 * Uses extracted services for persistence and metadata management.
 */
export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  // Initialize services (memoized to prevent recreation)
  const persistenceService = useMemo(
    () => new MessagePersistenceService({ apiClient: chatApiClientAdapter }),
    []
  );
  const metadataManager = useMemo(
    () => new MetadataManager({ apiClient: chatApiClientAdapter }),
    []
  );

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Schedule pending metadata flushes
  const schedulePendingFlush = useCallback(
    (messageId: string, delayMs = 60) => {
      setTimeout(() => void metadataManager.flushPending(messageId), delayMs);
    },
    [metadataManager]
  );

  // Retry pending metadata updates when messages change
  useEffect(() => {
    metadataManager.getPendingIds().forEach((messageId) => {
      if (messageId.startsWith('temp-')) return;
      const exists = messages.some((msg) => msg.id === messageId);
      if (exists && metadataManager.getRetryCount(messageId) < 3) {
        schedulePendingFlush(messageId);
      }
    });
    return () => metadataManager.clearFlushTracking();
  }, [messages, schedulePendingFlush, metadataManager]);

  /** Load messages from the database for a session */
  const loadMessages = useCallback(
    async (sessionId: string): Promise<void> => {
      const result = await persistenceService.loadMessages(sessionId);
      if (!result.success) return;
      const formattedMessages = result.data.messages.map((msg) => {
        const metadata = msg.metadata ?? deriveMetadataFromContent(msg.content);
        return hydrateMessage(msg, metadata);
      });
      setMessages(formattedMessages);
    },
    [persistenceService]
  );

  /** Add a message to both UI state and database */
  const addMessageToChat = useCallback(
    async (message: {
      content: string;
      role: 'user' | 'assistant';
      sessionId: string;
      modelUsed?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    }): Promise<{ success: boolean; error?: string }> => {
      const tempId = persistenceService.generateTempId();
      const metadata = message.metadata ?? deriveMetadataFromContent(message.content);
      const uiMessage = hydrateMessage(
        {
          id: tempId,
          role: message.role,
          content: message.content,
          timestamp: new Date(),
          modelUsed: message.modelUsed,
        },
        metadata
      );

      // Optimistic UI update
      setMessages((prev) => [...prev, uiMessage]);

      // Persist to database
      const result = await persistenceService.saveMessage(message.sessionId, {
        role: message.role,
        content: message.content,
        modelUsed: message.modelUsed,
        metadata: message.metadata,
      });

      if (!result.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        logger.error('Failed to add message to chat', {
          component: 'useChatMessages',
          sessionId: message.sessionId,
          role: message.role,
        });
        return { success: false, error: result.error.message };
      }

      const saved = result.data.savedMessage;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== tempId) return msg;
          const updatedMetadata = saved.metadata ?? message.metadata ?? metadata;

          // Transfer pending metadata if any
          if (metadataManager.hasPending(tempId)) {
            metadataManager.transferPending(tempId, saved.id, message.sessionId);
            schedulePendingFlush(saved.id);
          }

          return hydrateMessage(
            {
              ...msg,
              id: saved.id,
              timestamp: new Date(saved.timestamp),
              modelUsed: saved.modelUsed ?? msg.modelUsed,
            },
            updatedMetadata
          );
        })
      );

      return { success: true };
    },
    [persistenceService, metadataManager, schedulePendingFlush]
  );

  /** Clear all messages (for new session) */
  const clearMessages = useCallback(() => {
    metadataManager.clearAll();
    setMessages([]);
  }, [metadataManager]);

  /** Update a specific message (for streaming responses) */
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        return hydrateMessage({ ...msg, ...updates }, updates.metadata ?? msg.metadata);
      })
    );
  }, []);

  /** Add a message to UI only (without saving to database) */
  const addTemporaryMessage = useCallback(
    (message: Omit<Message, 'id'>) => {
      const tempMessage: Message = { id: persistenceService.generateTempId(), ...message };
      const hydrated = hydrateMessage(tempMessage, tempMessage.metadata);
      setMessages((prev) => [...prev, hydrated]);
      return hydrated.id;
    },
    [persistenceService]
  );

  /** Remove a temporary message */
  const removeTemporaryMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  /** Update metadata for a specific message */
  const updateMessageMetadata = useCallback(
    async (
      sessionId: string,
      messageId: string,
      metadata: Record<string, unknown>,
      options?: { mergeStrategy?: 'merge' | 'replace' }
    ): Promise<{ success: boolean; error?: string }> => {
      const mergeStrategy = options?.mergeStrategy ?? 'merge';
      const target = messagesRef.current.find((msg) => msg.id === messageId);

      if (!target) {
        logger.warn('Message not found when attempting to update metadata', {
          component: 'useChatMessages',
          sessionId,
          messageId,
        });
        return { success: false, error: 'Message not found' };
      }

      const previousMetadata = metadataManager.cloneMetadata(
        target.metadata as Record<string, unknown> | undefined
      );
      const nextMetadata = metadataManager.mergeMetadata(previousMetadata, metadata, mergeStrategy);
      const nextMetadataClone = metadataManager.cloneMetadata(nextMetadata) ?? {};

      // Optimistic UI update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id !== messageId
            ? msg
            : hydrateMessage({ ...msg, metadata: nextMetadataClone }, nextMetadataClone)
        )
      );

      // Queue for temp IDs
      if (messageId.startsWith('temp-')) {
        metadataManager.queueUpdate(messageId, {
          sessionId,
          metadata: nextMetadataClone,
          mergeStrategy,
          retries: 0,
        });
        return { success: true };
      }

      // Persist to database
      const result = await metadataManager.updateMetadata(sessionId, messageId, nextMetadataClone, {
        mergeStrategy,
      });

      if (!result.success) {
        // Rollback on failure
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id !== messageId
              ? msg
              : hydrateMessage({ ...msg, metadata: previousMetadata }, previousMetadata)
          )
        );
        return { success: false, error: result.error.message };
      }

      return { success: true };
    },
    [metadataManager]
  );

  return {
    messages,
    loadMessages,
    addMessageToChat,
    clearMessages,
    updateMessage,
    addTemporaryMessage,
    removeTemporaryMessage,
    setMessages,
    updateMessageMetadata,
  };
}
