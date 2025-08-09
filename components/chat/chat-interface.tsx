'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Message } from '@/components/message';
import { TypingIndicator } from './typing-indicator';
import { SessionControls } from './session-controls';
import type { ChatInterfaceProps } from '@/types/chat';
import type { Message as MessageType } from '@/types';
import type { Session } from '@/types';
import { Send } from 'lucide-react';
import { generateSessionTitle, generateUUID } from '@/lib/utils';

export function ChatInterface({ initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
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
      console.error('Failed to end session:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentSession || isLoading) return;

    const userMessage: MessageType = {
      id: generateUUID(),
      sessionId: currentSession.id,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage: MessageType = {
        id: generateUUID(),
        sessionId: currentSession.id,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                assistantMessage.content += content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  )
                );
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
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
            <div className="text-center text-muted-foreground text-therapy-base mt-8">
              <p>Welcome to your therapy session.</p>
              <p className="mt-2">How are you feeling today? What would you like to talk about?</p>
            </div>
          )}
          
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
            />
          ))}
          
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
                onChange={(e) => setInput(e.target.value)}
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
            <div className="text-therapy-sm text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </form>
        </div>
      )}
    </div>
  );
}