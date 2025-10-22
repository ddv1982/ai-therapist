/**
 * Chat Messages Hook
 * 
 * Provides message management functionality that can be shared between
 * the main chat interface and CBT components to ensure messages appear
 * in the UI immediately when sent.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import { logger } from '@/lib/utils/logger';
import { apiClient } from '@/lib/api/client';
import { getApiData } from '@/lib/api/api-response';
import type { components } from '@/types/api/messages';
import { parseObsessionsCompulsionsFromMarkdown } from '@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions';
import { isObsessionsCompulsionsMessage } from '@/features/therapy/obsessions-compulsions/utils/obsessions-message-detector';
import type { ObsessionsCompulsionsData } from '@/types/therapy';

type ListMessagesResponse = import('@/lib/api/api-response').ApiResponse<import('@/lib/api/api-response').PaginatedResponse<components['schemas']['Message']>>;

// Using MessageData from the message system
export type Message = MessageData;

type ApiMessage = components['schemas']['Message'] & {
  metadata?: Record<string, unknown> | null;
  modelUsed?: string | null;
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelUsed?: string;
}

/**
 * Hook for managing chat messages with both UI state and database persistence
 */
const MAX_METADATA_RETRY_ATTEMPTS = 3;

const cloneMetadata = (value?: Record<string, unknown>) => {
  if (!value) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return { ...value };
  }
};

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const pendingMetadataRef = useRef(new Map<string, { sessionId: string; metadata: Record<string, unknown>; mergeStrategy: 'merge' | 'replace'; retries: number }>());
  const pendingFlushRef = useRef(new Set<string>());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const hydrateMessage = useCallback((raw: Message, metadata?: Message['metadata']) => {
    const normalizedTimestamp = raw.timestamp instanceof Date ? raw.timestamp : new Date(raw.timestamp);
    const nextMetadata = metadata ?? raw.metadata;
    return {
      ...raw,
      timestamp: normalizedTimestamp,
      metadata: nextMetadata,
    } as Message;
  }, []);

  const flushPendingMetadata = useCallback(async (messageId: string) => {
    const pending = pendingMetadataRef.current.get(messageId);
    if (!pending) return;
    if (messageId.startsWith('temp-')) return;
    if (pendingFlushRef.current.has(messageId)) return;

    pendingFlushRef.current.add(messageId);

    try {
      const response = await apiClient.patchMessageMetadata(pending.sessionId, messageId, {
        metadata: pending.metadata,
        mergeStrategy: pending.mergeStrategy,
      });

      if (!response || !response.success) {
        throw new Error('Failed to persist queued metadata update');
      }

      const data = (getApiData(response) ?? response.data) as ApiMessage | undefined;
      if (data) {
        const normalizedTimestamp = data.timestamp ? new Date(data.timestamp as string) : new Date();
        const messageMetadata = (data.metadata as Record<string, unknown> | null) ?? undefined;

        setMessages(prev => prev.map(msg => {
          if (msg.id !== data.id) return msg;
          const next: Message = {
            ...msg,
            content: data.content,
            timestamp: normalizedTimestamp,
            modelUsed: typeof data.modelUsed === 'string' && data.modelUsed.length > 0 ? data.modelUsed : msg.modelUsed,
            metadata: messageMetadata ?? msg.metadata,
          };
          return hydrateMessage(next, messageMetadata ?? next.metadata);
        }));
      }

      pendingMetadataRef.current.delete(messageId);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 404) {
        // Message not yet persisted; keep pending for retry
        return;
      }

      const entry = pendingMetadataRef.current.get(messageId);
      if (entry) {
        const retries = entry.retries + 1;
        if (retries >= MAX_METADATA_RETRY_ATTEMPTS) {
          pendingMetadataRef.current.delete(messageId);
          logger.error('Dropping queued metadata update after repeated failures', {
            component: 'useChatMessages',
            operation: 'flushPendingMetadata',
            messageId,
            sessionId: entry.sessionId,
            retries,
          }, error instanceof Error ? error : new Error(String(error)));
        } else {
          pendingMetadataRef.current.set(messageId, {
            ...entry,
            retries,
          });
          logger.error('Failed to persist queued metadata update', {
            component: 'useChatMessages',
            operation: 'flushPendingMetadata',
            messageId,
            sessionId: entry.sessionId,
            retries,
          }, error instanceof Error ? error : new Error(String(error)));
        }
      } else {
        logger.error('Failed to persist queued metadata update', {
          component: 'useChatMessages',
          operation: 'flushPendingMetadata',
          messageId,
        }, error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      pendingFlushRef.current.delete(messageId);
    }
  }, [hydrateMessage]);

  const schedulePendingFlush = useCallback((messageId: string, delayMs = 60) => {
    setTimeout(() => {
      void flushPendingMetadata(messageId);
    }, delayMs);
  }, [flushPendingMetadata]);

  /**
   * Load messages from the database for a session
   */
  const loadMessages = useCallback(async (sessionId: string): Promise<void> => {
    try {
      const resp: ListMessagesResponse = await apiClient.listMessages(sessionId);
      if (!resp) {
        logger.error('Failed to load messages from API', {
          component: 'useChatMessages',
          operation: 'loadMessages',
          sessionId,
          status: 500,
          statusText: 'Client wrapper error'
        });
        return;
      }

      const page = getApiData(resp);
      const items = page.items as Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
        modelUsed?: string | null;
        metadata?: Record<string, unknown> | null;
      }>;

      // Convert timestamp strings to Date objects
      const formattedMessages = items.map(msg => {
        const baseMessage: Message = {
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.timestamp),
          modelUsed: typeof msg.modelUsed === 'string' && msg.modelUsed.length > 0 ? msg.modelUsed : undefined,
        };
        const metadataFromServer = msg.metadata ?? undefined;
        const metadata = metadataFromServer ?? deriveMetadataFromContent(msg.content);
        const hydrated = hydrateMessage(baseMessage, metadata);
        return hydrated;
      });
      setMessages(formattedMessages);
    } catch (error) {
      logger.error('Error loading messages', {
        component: 'useChatMessages',
        operation: 'loadMessages',
        sessionId
      }, error instanceof Error ? error : new Error(String(error)));
    }
  }, [hydrateMessage]);

  /**
   * Add a message to both UI state and database
   * This is the key bridge function that CBT components will use
   */
  const addMessageToChat = useCallback(async (
    message: {
      content: string;
      role: 'user' | 'assistant';
      sessionId: string;
      modelUsed?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Generate a temporary ID for immediate UI update
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create message object for UI
      const baseMessage: Message = {
        id: tempId,
        role: message.role,
        content: message.content,
        timestamp: new Date(),
        modelUsed: message.modelUsed,
      };
      const metadata = message.metadata ?? deriveMetadataFromContent(message.content);
      const uiMessage = hydrateMessage(baseMessage, metadata);

      // Immediately add to UI state
      setMessages(prev => [...prev, uiMessage]);

      // Save to database
      const saved = await apiClient.postMessage(message.sessionId, {
        role: message.role,
        content: message.content,
        modelUsed: message.modelUsed,
        metadata: message.metadata,
      });
      if (!saved.success || !saved.data) {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw new Error('Failed to save message');
      }

      const savedMessage = saved.data as ApiMessage;
      setMessages(prev => prev.map(msg => {
        if (msg.id !== tempId) return msg;
        const updatedMetadata = (savedMessage.metadata as Record<string, unknown> | null) ?? message.metadata ?? metadata;
        const updated: Message = {
          ...msg,
          id: savedMessage.id as string,
          timestamp: new Date(savedMessage.timestamp as string),
          modelUsed: typeof savedMessage.modelUsed === 'string' ? savedMessage.modelUsed : msg.modelUsed,
          metadata: updatedMetadata,
        };
        const pending = pendingMetadataRef.current.get(tempId);
        if (pending) {
          pendingMetadataRef.current.delete(tempId);
          pendingMetadataRef.current.set(savedMessage.id as string, {
            sessionId: message.sessionId,
            metadata: pending.metadata,
            mergeStrategy: pending.mergeStrategy,
            retries: pending.retries,
          });
          schedulePendingFlush(savedMessage.id as string);
        }
        return hydrateMessage(updated, updatedMetadata ?? msg.metadata);
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Failed to add message to chat', {
        component: 'useChatMessages',
        operation: 'addMessageToChat',
        sessionId: message.sessionId,
        role: message.role,
        source: message.source
      }, error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: errorMessage };
    }
  }, [hydrateMessage, schedulePendingFlush]);

  /**
   * Clear all messages (for new session)
   */
  const clearMessages = useCallback(() => {
    pendingMetadataRef.current.clear();
    pendingFlushRef.current.clear();
    setMessages([]);
  }, []);

  /**
   * Update a specific message (for streaming responses)
   */
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      const next: Message = {
        ...msg,
        ...updates,
      };
      const metadata = updates.metadata ?? msg.metadata;
      return hydrateMessage(next, metadata);
    }));
  }, [hydrateMessage]);

  /**
   * Add a message to UI only (without saving to database)
   * Useful for temporary messages like loading states
   */
  const addTemporaryMessage = useCallback((message: Omit<Message, 'id'>) => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...message
    };
    const hydrated = hydrateMessage(tempMessage, tempMessage.metadata);
    setMessages(prev => [...prev, hydrated]);
    return hydrated.id;
  }, [hydrateMessage]);

  /**
   * Remove a temporary message
   */
  const removeTemporaryMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  useEffect(() => {
    pendingMetadataRef.current.forEach((entry, messageId) => {
      if (messageId.startsWith('temp-')) return;
      const exists = messages.some(msg => msg.id === messageId);
      if (exists && entry.retries < MAX_METADATA_RETRY_ATTEMPTS) {
        schedulePendingFlush(messageId);
      }
    });
    // Snapshot the current ref value for cleanup to satisfy react-hooks rules
    const pendingFlushAtEffectTime = pendingFlushRef.current;
    return () => {
      // Prevent dangling scheduled flushes after unmount
      pendingFlushAtEffectTime.clear();
    };
  }, [messages, schedulePendingFlush]);

  const updateMessageMetadata = useCallback(
    async (
      sessionId: string,
      messageId: string,
      metadata: Record<string, unknown>,
      options?: { mergeStrategy?: 'merge' | 'replace' }
    ): Promise<{ success: boolean; error?: string }> => {
      const mergeStrategy = options?.mergeStrategy ?? 'merge';

      const currentMessages = messagesRef.current;
      const target = currentMessages.find(msg => msg.id === messageId);
      if (!target) {
        logger.warn('Message not found when attempting to update metadata', {
          component: 'useChatMessages',
          operation: 'updateMessageMetadata',
          sessionId,
          messageId,
        });
        return { success: false, error: 'Message not found' };
      }

      const previousMetadata = cloneMetadata(target.metadata as Record<string, unknown> | undefined);
      const baseMetadata = mergeStrategy === 'replace'
        ? {}
        : (previousMetadata ? { ...previousMetadata } : {});

      let nextMetadata: Record<string, unknown>;
      try {
        const sanitizedIncoming = JSON.parse(JSON.stringify(metadata ?? {})) as Record<string, unknown>;
        nextMetadata = { ...baseMetadata, ...sanitizedIncoming };
      } catch {
        nextMetadata = { ...baseMetadata, ...metadata };
      }

      const nextMetadataClone = cloneMetadata(nextMetadata) ?? {};

      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        const next: Message = {
          ...msg,
          metadata: nextMetadataClone,
        };
        return hydrateMessage(next, nextMetadataClone);
      }));

      const queuePendingUpdate = (strategy: 'merge' | 'replace', shouldSchedule: boolean) => {
        pendingMetadataRef.current.set(messageId, {
          sessionId,
          metadata: cloneMetadata(nextMetadataClone) ?? {},
          mergeStrategy: strategy,
          retries: 0,
        });
        if (shouldSchedule) {
          schedulePendingFlush(messageId);
        }
      };

      if (messageId.startsWith('temp-')) {
        queuePendingUpdate(mergeStrategy, false);
        return { success: true };
      }

      try {
        const response = await apiClient.patchMessageMetadata(sessionId, messageId, {
          metadata: cloneMetadata(nextMetadataClone) ?? {},
          mergeStrategy,
        });

        if (!response || !response.success) {
          throw new Error('Failed to update message metadata');
        }

        const data = (getApiData(response) ?? response.data) as ApiMessage | undefined;
        if (!data) {
          throw new Error('Empty response when updating metadata');
        }

        const normalizedTimestamp = data.timestamp ? new Date(data.timestamp as string) : new Date();
        const messageMetadata = (data.metadata as Record<string, unknown> | null) ?? undefined;

        setMessages(prev => prev.map(msg => {
          if (msg.id !== data.id) return msg;
          const next: Message = {
            ...msg,
            content: data.content,
            timestamp: normalizedTimestamp,
            modelUsed: typeof data.modelUsed === 'string' && data.modelUsed.length > 0 ? data.modelUsed : msg.modelUsed,
            metadata: messageMetadata,
          };
          return hydrateMessage(next, messageMetadata ?? next.metadata);
        }));

        pendingMetadataRef.current.delete(messageId);
        return { success: true };
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          queuePendingUpdate(mergeStrategy, true);
          logger.info('Queued metadata update for message awaiting persistence', {
            component: 'useChatMessages',
            operation: 'updateMessageMetadata',
            sessionId,
            messageId,
          });
          return { success: true };
        }

        setMessages(prev => prev.map(msg => {
          if (msg.id !== messageId) return msg;
          const next: Message = {
            ...msg,
            metadata: previousMetadata,
          };
          return hydrateMessage(next, previousMetadata);
        }));
        pendingMetadataRef.current.delete(messageId);

        const errorMessage = error instanceof Error ? error.message : 'Failed to update message metadata';
        logger.error('Failed to update message metadata', {
          component: 'useChatMessages',
          operation: 'updateMessageMetadata',
          sessionId,
          messageId,
        }, error instanceof Error ? error : new Error(String(error)));
        return { success: false, error: errorMessage };
      }
    }, [hydrateMessage, schedulePendingFlush]);

  return {
    messages,
    loadMessages,
    addMessageToChat,
    clearMessages,
    updateMessage,
    addTemporaryMessage,
    removeTemporaryMessage,
    setMessages, // For backward compatibility with existing chat interface
    updateMessageMetadata,
  };
}

function deriveMetadataFromContent(content: string): Message['metadata'] | undefined {
  if (!content || !isObsessionsCompulsionsMessage(content)) {
    return undefined;
  }

  const parsed: ObsessionsCompulsionsData | null = parseObsessionsCompulsionsFromMarkdown(content);
  const data: ObsessionsCompulsionsData = parsed ?? {
    obsessions: [],
    compulsions: [],
    lastModified: new Date().toISOString(),
  };

  return {
    type: 'obsessions-compulsions-table',
    step: 'obsessions-compulsions',
    data,
  };
}
