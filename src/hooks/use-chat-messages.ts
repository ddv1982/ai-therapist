/**
 * Chat Messages Hook
 * 
 * Provides message management functionality that can be shared between
 * the main chat interface and CBT components to ensure messages appear
 * in the UI immediately when sent.
 */

'use client';

import { useState, useCallback } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import { logger } from '@/lib/utils/logger';

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
export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  /**
   * Load messages from the database for a session
   */
  const loadMessages = useCallback(async (sessionId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const messagesData = await response.json();
        // Handle new standardized API response format
        const messages = messagesData.success ? (messagesData.data || []) : messagesData;
        const messageArray = Array.isArray(messages) ? messages : [];
        
        // Convert timestamp strings to Date objects
        const formattedMessages = messageArray.map((msg: { id: string; role: string; content: string; timestamp: string }) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      } else {
        logger.error('Failed to load messages from API', {
          component: 'useChatMessages',
          operation: 'loadMessages',
          sessionId,
          status: response.status,
          statusText: response.statusText
        });
        setMessages([]);
      }
    } catch (error) {
      logger.error('Error loading messages', {
        component: 'useChatMessages',
        operation: 'loadMessages',
        sessionId
      }, error instanceof Error ? error : new Error(String(error)));
      setMessages([]);
    }
  }, []);

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
      const uiMessage: Message = {
        id: tempId,
        role: message.role,
        content: message.content,
        timestamp: new Date()
      };

      // Immediately add to UI state
      setMessages(prev => [...prev, uiMessage]);

      // Save to database
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: message.sessionId,
          role: message.role,
          content: message.content,
          modelUsed: message.modelUsed
          // Note: We don't send 'source' as it's not in the schema
        }),
      });

      if (!response.ok) {
        // If DB save failed, remove from UI and show error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw new Error(`Failed to save message: ${response.status} ${response.statusText}`);
      }

      // Get the actual message data from the response
      const savedMessage = await response.json();
      
      // Update the temporary message with the real ID from the database
      if (savedMessage.success && savedMessage.data) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { 
                ...msg, 
                id: savedMessage.data.id,
                timestamp: new Date(savedMessage.data.timestamp)
              } 
            : msg
        ));
      } else if (savedMessage.id) {
        // Handle different response format
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { 
                ...msg, 
                id: savedMessage.id,
                timestamp: new Date(savedMessage.timestamp)
              } 
            : msg
        ));
      }

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
  }, []);

  /**
   * Clear all messages (for new session)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Update a specific message (for streaming responses)
   */
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  /**
   * Add a message to UI only (without saving to database)
   * Useful for temporary messages like loading states
   */
  const addTemporaryMessage = useCallback((message: Omit<Message, 'id'>) => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...message
    };
    setMessages(prev => [...prev, tempMessage]);
    return tempMessage.id;
  }, []);

  /**
   * Remove a temporary message
   */
  const removeTemporaryMessage = useCallback((messageId: string) => {
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