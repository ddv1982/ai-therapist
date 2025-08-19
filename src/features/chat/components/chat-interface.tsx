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

export function ChatInterface({ initialMessages: _initialMessages = [] }: ChatInterfaceProps) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [hasEnvApiKey, setHasEnvApiKey] = useState(false);
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
      // Save the AI response to database after completion
      if (currentSession) {
        try {
          // Extract text content from message parts
          const textContent = message.parts
            .filter(part => part.type === 'text')
            .map(part => part.text)
            .join('');
            
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentSession.id,
              role: 'assistant',
              content: textContent,
              modelUsed: 'ai-sdk', // We'll capture the actual model later
            }),
          });
        } catch (error) {
          logger.error('Failed to save assistant message', { component: 'ChatInterface', operation: 'saveMessage' }, error as Error);
        }
      }
    }
  });
  
  // Derived state for loading indicator
  const isLoading = status === 'streaming' || status === 'submitted';

  // Check if environment variable is set
  useEffect(() => {
    const abortController = new AbortController();
    
    fetch('/api/env', { signal: abortController.signal })
      .then(res => res.json())
      .then(data => setHasEnvApiKey(data.hasGroqApiKey))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setHasEnvApiKey(false);
        }
      });

    return () => abortController.abort();
  }, []);

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
      
      // Generate session report
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          messages
        }),
      });
      
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
    
    // Save user message to database before sending
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          role: 'user',
          content: messageContent,
        }),
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
      
      {!hasEnvApiKey && !apiKey && (
        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                API Key Required
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                Please enter your Groq API key to start chatting.
              </p>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Enter your Groq API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground">
                  Get your free API key at{' '}
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline"
                  >
                    console.groq.com/keys
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                disabled={!input.trim() || isLoading || (!hasEnvApiKey && !apiKey)}
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