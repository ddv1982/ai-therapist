/**
 * Chat Messages Hook
 * 
 * Provides message management functionality that can be shared between
 * the main chat interface and CBT components to ensure messages appear
 * in the UI immediately when sent.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import { logger } from '@/lib/utils/logger';
import * as messagesApi from '@/lib/api/client/messages';
import { getApiData } from '@/lib/api/api-response';
import type { components } from '@/types/api.generated';
import { parseObsessionsCompulsionsFromMarkdown } from '@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions';
import { isObsessionsCompulsionsMessage } from '@/features/therapy/obsessions-compulsions/utils/obsessions-message-detector';
import type { ObsessionsCompulsionsData } from '@/types/therapy';

type ListMessagesResponse = import('@/lib/api/api-response').ApiResponse<import('@/lib/api/api-response').PaginatedResponse<components['schemas']['Message']>>;

// Using MessageData from the message system
export type Message = MessageData;

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
const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
};

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const metadataCacheRef = useRef(new Map<string, { contentHash: string; metadata?: Message['metadata']; digest: string }>());

  const computeDigest = useCallback((message: { id: string; content: string; timestamp: Date; metadata?: Message['metadata'] }) => {
    let metadataKey = '';
    if (message.metadata) {
      try {
        metadataKey = hashString(JSON.stringify(message.metadata));
      } catch {
        metadataKey = 'metadata-error';
      }
    }
    const contentKey = hashString(`${message.content.length}:${message.content}`);
    return `${message.id}:${message.timestamp.getTime()}:${contentKey}:${metadataKey}`;
  }, []);

  const hydrateMessage = useCallback((raw: Message, metadata?: Message['metadata']) => {
    const normalizedTimestamp = raw.timestamp instanceof Date ? raw.timestamp : new Date(raw.timestamp);
    const nextMetadata = metadata ?? raw.metadata;
    const digest = computeDigest({
      id: raw.id,
      content: raw.content,
      timestamp: normalizedTimestamp,
      metadata: nextMetadata,
    });
    metadataCacheRef.current.set(raw.id, {
      contentHash: hashString(`${raw.content.length}:${raw.content}`),
      metadata: nextMetadata,
      digest,
    });
    return {
      ...raw,
      timestamp: normalizedTimestamp,
      metadata: nextMetadata,
      digest,
    } as Message;
  }, [computeDigest]);

  /**
   * Load messages from the database for a session
   */
  const loadMessages = useCallback(async (sessionId: string): Promise<void> => {
    try {
      const resp: ListMessagesResponse = await messagesApi.listMessages(sessionId);
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
      const items = page.items as Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string; modelUsed?: string | null }>;

      // Convert timestamp strings to Date objects
      const formattedMessages = items.map(msg => {
        const baseMessage: Message = {
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.timestamp),
          modelUsed: typeof msg.modelUsed === 'string' && msg.modelUsed.length > 0 ? msg.modelUsed : undefined,
        };
        const cacheEntry = metadataCacheRef.current.get(msg.id);
        const contentHash = hashString(`${msg.content.length}:${msg.content}`);
        const metadata = cacheEntry && cacheEntry.contentHash === contentHash
          ? cacheEntry.metadata
          : deriveMetadataFromContent(msg.content);
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
      const metadata = deriveMetadataFromContent(message.content);
      const uiMessage = hydrateMessage(baseMessage, metadata);

      // Immediately add to UI state
      setMessages(prev => [...prev, uiMessage]);

      // Save to database
      const saved = await messagesApi.postMessage(message.sessionId, {
        role: message.role,
        content: message.content,
        modelUsed: message.modelUsed,
      });
      if (!saved.success || !saved.data) {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw new Error('Failed to save message');
      }

      const savedMessage = saved.data as components['schemas']['Message'] & { modelUsed?: string | null };
      setMessages(prev => prev.map(msg => {
        if (msg.id !== tempId) return msg;
        const updated: Message = {
          ...msg,
          id: savedMessage.id as string,
          timestamp: new Date(savedMessage.timestamp as string),
          modelUsed: typeof savedMessage.modelUsed === 'string' ? savedMessage.modelUsed : msg.modelUsed,
        };
        metadataCacheRef.current.delete(tempId);
        return hydrateMessage(updated, msg.metadata);
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
  }, [hydrateMessage]);

  /**
   * Clear all messages (for new session)
   */
  const clearMessages = useCallback(() => {
    metadataCacheRef.current.clear();
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
    metadataCacheRef.current.delete(messageId);
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  return {
    messages,
    loadMessages,
    addMessageToChat,
    clearMessages,
    updateMessage,
    addTemporaryMessage,
    removeTemporaryMessage,
    setMessages // For backward compatibility with existing chat interface
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
