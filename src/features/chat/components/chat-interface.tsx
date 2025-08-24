'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Message } from '@/features/chat/messages';
import { TypingIndicator } from './typing-indicator';
import { SessionControls } from './session-controls';
import type { ChatInterfaceProps } from '@/types/chat';
import type { Session } from '@/types';
import { Send } from 'lucide-react';
import { generateSessionTitle } from '@/lib/utils/utils';
import { logger } from '@/lib/utils/logger';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/types/api.generated';

export function ChatInterface({ initialMessages: _initialMessages = [] }: ChatInterfaceProps) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // State for input handling (AI SDK 5 doesn't provide this)
  const [input, setInput] = useState('');
  
  // AI SDK useChat hook for simplified streaming
  const {
    messages,
    sendMessage,
    status
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        selectedModel: 'openai/gpt-oss-20b',
        sessionId: currentSession?.id
      }
    }),
    onError: (error) => {
      logger.error('Chat stream error', { component: 'ChatInterface' }, error);
    },
    onFinish: async ({ message }) => {
      // Decrement in-flight counter on finish
      try {
        const current = inflightSendsRef.current;
        inflightSendsRef.current = current > 0 ? current - 1 : 0;
      } catch {}
      // Save the AI response to database after completion
      if (currentSession) {
        try {
          // Extract text content from message parts
          const textContent = message.parts
            .filter(part => part.type === 'text')
            .map(part => part.text)
            .join('');
            
          await apiClient.postMessage(currentSession.id, {
            role: 'assistant',
            content: textContent,
            modelUsed: 'ai-sdk',
          });
        } catch (error) {
          logger.error('Failed to save assistant message', { component: 'ChatInterface', operation: 'saveMessage' }, error as Error);
        }
      }
    }
  });
  
  // Derived state for loading indicator
  const isLoading = status === 'streaming' || status === 'submitted';

  // Client-side rate guard: cooldown and max concurrency
  const lastSendAtRef = useRef<number>(0);
  const inflightSendsRef = useRef<number>(0);
  const MIN_COOLDOWN_MS = 500;
  const MAX_CONCURRENT_SENDS = 2;

  // Environment API key is configured server-side
  // No need to check or manage API keys on the client

  // Timer for session duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession?.status === 'active') {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession?.status]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  
  // Clear AI SDK messages when starting a new session
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      // Don't clear if we're continuing an existing session
      // The AI SDK will handle message management
    }
  }, [currentSession, messages.length]);

  const handleStartSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generateSessionTitle()
        }),
      });
      
      if (response.ok) {
        const session = await response.json();
        setCurrentSession(session);
        setSessionDuration(0);
        // AI SDK will handle message management
      }
    } catch (error) {
      logger.error('Failed to start session', { component: 'ChatInterface', operation: 'startSession' }, error as Error);
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) return;
    
    try {
      await fetch(`/api/sessions/${currentSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          endedAt: new Date().toISOString()
        }),
      });
      
      // Generate session report: map AI SDK messages to API Message schema
      type TextPart = { type: 'text'; text: string };
      const reportMessages: components['schemas']['Message'][] = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: (m.parts as TextPart[] | undefined)?.filter((p) => p?.type === 'text').map((p) => p.text).join('') ?? '',
        timestamp: new Date().toISOString(),
      }));
      await apiClient.generateReport({ sessionId: currentSession.id, messages: reportMessages });
      
      setCurrentSession(null);
      setSessionDuration(0);
    } catch (error) {
      logger.error('Failed to end session', { component: 'ChatInterface', operation: 'endSession' }, error as Error);
    }
  };

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Enhanced submit handler that integrates AI SDK with therapeutic features
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentSession || isLoading) return;

    const messageContent = input.trim();

    // Cooldown and concurrency guard
    const now = Date.now();
    if (now - lastSendAtRef.current < MIN_COOLDOWN_MS) {
      return;
    }
    if (inflightSendsRef.current >= MAX_CONCURRENT_SENDS) {
      return;
    }
    lastSendAtRef.current = now;
    inflightSendsRef.current = inflightSendsRef.current + 1;
    
    // Save user message to database before sending
    try {
      await apiClient.postMessage(currentSession.id, {
        role: 'user',
        content: messageContent,
      });
    } catch (error) {
      logger.error('Failed to save user message', { component: 'ChatInterface', operation: 'saveUserMessage' }, error as Error);
    }

    // Use AI SDK's sendMessage
    await sendMessage({ 
      role: 'user', 
      parts: [{ type: 'text', text: messageContent }]
    });
    
    // Clear input after sending
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <SessionControls
        sessionId={currentSession?.id}
        onStartSession={handleStartSession}
        onEndSession={handleEndSession}
        sessionDuration={sessionDuration}
        status={currentSession?.status || 'completed'}
      />
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && currentSession && (
            <div className="text-center text-muted-foreground text-base mt-8">
              <p>Welcome to your therapy session.</p>
              <p className="mt-2">How are you feeling today? What would you like to talk about?</p>
            </div>
          )}
          
          {messages.map((message) => {
            // Extract text content from message parts
            const textContent = message.parts
              .filter(part => part.type === 'text')
              .map(part => part.text)
              .join('');
            
            return (
              <Message
                key={message.id}
                message={{
                  id: message.id,
                  role: message.role as 'user' | 'assistant',
                  content: textContent,
                  timestamp: new Date(), // AI SDK 5 doesn't provide timestamp
                }}
              />
            );
          })}
          
          <TypingIndicator isVisible={isLoading} />
        </div>
      </ScrollArea>
      

      {currentSession && (
        <div className="border-t border-border p-4 bg-card">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isLoading}
                className="h-[60px] w-[60px] shrink-0"
              >
                <Send size={20} />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}