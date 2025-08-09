'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/primitives/button';
import { Textarea } from '@/components/ui/primitives/textarea';
import { Card } from '@/components/ui/primitives/card';
import { 
  Send, 
  FileText,
  Menu,
  Heart,
  Plus,
  MessageSquare,
  Trash2,
  X,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/enhanced/theme-toggle';
import { generateUUID } from '@/lib/utils';
import { useToast } from '@/components/ui/primitives/toast';
import { checkMemoryContext, formatMemoryInfo, type MemoryContextInfo } from '@/lib/memory-utils';
import { VirtualizedMessageList } from '@/components/chat/virtualized-message-list';
import type { MessageData } from '@/components/messages/message';
import { MobileDebugInfo } from '@/components/ui/layout/mobile-debug-info';
import { CBTDiaryModal } from '@/components/cbt/cbt-diary-modal';
import { therapeuticInteractive, getTherapeuticIconButton } from '@/lib/ui/design-tokens';

// Using MessageData from the new message system
type Message = MessageData;

interface Session {
  id: string;
  title: string;
  lastMessage?: string;
  startedAt: Date;
  _count?: {
    messages: number;
  };
}

export default function ChatPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [hasEnvApiKey, setHasEnvApiKey] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [memoryContext, setMemoryContext] = useState<MemoryContextInfo>({ hasMemory: false, reportCount: 0 });
  const [showCBTModal, setShowCBTModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Mobile Safari debugging
  const logMobileError = useCallback(async (error: unknown, context: string) => {
    const isSafari = typeof navigator !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
    const isNetworkUrl = typeof window !== 'undefined' && !window.location.hostname.match(/localhost|127\.0\.0\.1/);
    
    if (isSafari && isMobileDevice) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error(`MOBILE SAFARI ERROR [${context}]:`, {
        error: errorMessage,
        stack: errorStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        isNetworkUrl,
        timestamp: new Date().toISOString(),
        context
      });
      
      // Send to error logging endpoint
      try {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: errorMessage,
            stack: errorStack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            context,
            isMobileSafari: true,
            isNetworkUrl
          })
        });
      } catch (loggingError) {
        console.error('Failed to log mobile error:', loggingError);
      }
    }
  }, []);


  // Load sessions from database on component mount (memoized)
  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const sessionsData = await response.json();
        // Handle new standardized API response format
        const sessions = sessionsData.success ? (sessionsData.data || []) : sessionsData;
        setSessions(Array.isArray(sessions) ? sessions : []);
      } else {
        throw new Error(`Failed to load sessions: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      await logMobileError(error, 'loadSessions');
      // Ensure sessions is always an array even on error
      setSessions([]);
      showToast({
        type: 'error',
        title: 'Loading Error',
        message: 'Failed to load chat sessions. Please refresh the page.'
      });
    }
  }, [logMobileError, showToast]);

  // Load messages for a specific session (memoized)
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const messagesData = await response.json();
        // Handle new standardized API response format
        const messages = messagesData.success ? (messagesData.data || []) : messagesData;
        const messageArray = Array.isArray(messages) ? messages : [];
        
        // Convert timestamp strings to Date objects
        const formattedMessages = messageArray.map((msg: { id: string; role: string; content: string; timestamp: string }) => ({
          ...msg,
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
        
        // Check for memory context when loading session
        const memoryInfo = await checkMemoryContext(sessionId);
        setMemoryContext(memoryInfo);
      } else {
        throw new Error(`Failed to load messages: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      await logMobileError(error, 'loadMessages');
      // Ensure messages is always an array even on error
      setMessages([]);
      showToast({
        type: 'error',
        title: 'Loading Error',
        message: 'Failed to load chat messages. Please try again.'
      });
    }
  }, [logMobileError, showToast]);

  // Save message to database (memoized)
  const saveMessage = useCallback(async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          role,
          content,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Handle new standardized API response format
        return result.success ? result.data : result;
      } else {
        console.error('Failed to save message');
        return null;
      }
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load current active session (memoized)
  const loadCurrentSession = useCallback(async () => {
    try {
      // First try to get from localStorage for faster loading
      const savedCurrentSession = localStorage.getItem('currentSessionId');
      
      const response = await fetch('/api/sessions/current');
      if (response.ok) {
        const data = await response.json();
        // Handle new standardized API response format
        const currentSessionData = data.success ? data.data : data;
        if (currentSessionData?.currentSession) {
          const sessionId = currentSessionData.currentSession.id;
          setCurrentSession(sessionId);
          await loadMessages(sessionId);
          
          // Save to localStorage for faster future loads
          localStorage.setItem('currentSessionId', sessionId);
          
          console.log('Loaded current session:', sessionId, 'with', currentSessionData.currentSession.messageCount, 'messages');
          return;
        }
      }
      
      // Fallback: if no current session from API but we have one saved locally
      if (savedCurrentSession) {
        try {
          // Verify the saved session still exists
          const verifyResponse = await fetch(`/api/sessions/${savedCurrentSession}`);
          if (verifyResponse.ok) {
            setCurrentSession(savedCurrentSession);
            await loadMessages(savedCurrentSession);
            console.log('Restored session from localStorage:', savedCurrentSession);
          } else {
            // Saved session no longer exists, clear localStorage
            localStorage.removeItem('currentSessionId');
          }
        } catch (error) {
          console.error('Failed to verify saved session:', error);
          localStorage.removeItem('currentSessionId');
        }
      }
    } catch (error) {
      console.error('Failed to load current session:', error);
    }
  }, [loadMessages]); // Removed currentSession dependency to avoid circular dependency

  // Load sessions and current session on component mount
  useEffect(() => {
    loadSessions();
    loadCurrentSession();
  }, [loadSessions, loadCurrentSession]);

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





  // Mobile detection with dynamic resize handling and iOS viewport fixes
  useEffect(() => {
    const updateViewport = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice) {
        // Use the smaller of window.innerHeight or screen.height for iOS
        const actualHeight = Math.min(window.innerHeight, window.screen.height);
        setViewportHeight(`${actualHeight}px`);
        
        // Set CSS custom properties for consistent viewport handling
        document.documentElement.style.setProperty('--app-height', `${actualHeight}px`);
        document.documentElement.style.setProperty('--vh', `${actualHeight * 0.01}px`);
      } else {
        setViewportHeight('100vh');
        document.documentElement.style.removeProperty('--app-height');
        document.documentElement.style.removeProperty('--vh');
      }
    };

    // Initial check
    updateViewport();

    // Add resize listener with debounce for performance
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateViewport, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateViewport, 300); // Longer delay for orientation change
    });

    // iOS-specific viewport change detection
    if (typeof window !== 'undefined' && 'visualViewport' in window) {
      const visualViewport = window.visualViewport!;
      visualViewport.addEventListener('resize', updateViewport);
      
      return () => {
        window.removeEventListener('resize', debouncedResize);
        window.removeEventListener('orientationchange', updateViewport);
        visualViewport.removeEventListener('resize', updateViewport);
        clearTimeout(resizeTimeout);
      };
    }

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', updateViewport);
      clearTimeout(resizeTimeout);
    };
  }, []);



  // Set current session for cross-device continuity (memoized)
  const setCurrentSessionAndSync = useCallback(async (sessionId: string) => {
    try {
      // Update the backend to mark this as the current session
      await fetch('/api/sessions/current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      setCurrentSession(sessionId);
      localStorage.setItem('currentSessionId', sessionId);
      await loadMessages(sessionId);
    } catch (error) {
      console.error('Failed to sync current session:', error);
      // Still set locally even if sync fails
      setCurrentSession(sessionId);
      localStorage.setItem('currentSessionId', sessionId);
      await loadMessages(sessionId);
    }
  }, [loadMessages]);

  const startNewSession = () => {
    // Just clear current session and messages - don't create DB session yet
    setCurrentSession(null);
    setMessages([]);
    localStorage.removeItem('currentSessionId');
    // Focus the input field after starting new session
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        if (currentSession === sessionId) {
          setCurrentSession(null);
          setMessages([]);
          localStorage.removeItem('currentSessionId');
        }
      } else {
        console.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    // Check if we have API key either from user input or environment
    if (!apiKey && !hasEnvApiKey) {
      showToast({
        type: 'warning',
        title: 'API Key Required',
        message: 'Please enter your Groq API key in the settings panel or set GROQ_API_KEY environment variable'
      });
      return;
    }

    // Auto-create session if none exists, using first message as title
    let sessionId = currentSession;
    if (!sessionId) {
      try {
        const title = input.slice(0, 50) + (input.length > 50 ? '...' : '');
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Handle new standardized API response format
          const newSession = result.success ? result.data : result;
          setSessions(prev => [newSession, ...prev]);
          
          // Set as current session and sync across devices
          await setCurrentSessionAndSync(newSession.id);
          sessionId = newSession.id;
        } else {
          console.error('Failed to create session');
          return;
        }
      } catch (error) {
        console.error('Error creating session:', error);
        return;
      }
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to database
    await saveMessage(sessionId!, 'user', userMessage.content);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          sessionId: sessionId,
          apiKey: apiKey,
          model: 'openai/gpt-oss-20b',
          temperature: 0.6,
          maxTokens: 30000,
          topP: 1,
          browserSearchEnabled: true,
          reasoningEffort: 'medium'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const aiMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessage.id 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      setIsLoading(false);

      // Save AI response to database
      await saveMessage(sessionId!, 'assistant', fullContent);
    } catch (error) {
      setIsLoading(false);
      console.error('Error sending message:', error);
      
      // Check if it's a model-related error with proper type handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('model_not_found') || errorMessage.includes('404')) {
        showToast({
          type: 'error',
          title: 'Model Not Available',
          message: 'The selected model is not available. Please try again.'
        });
      } else if (errorMessage.includes('Failed to fetch')) {
        showToast({
          type: 'error',
          title: 'Network Error',
          message: 'Please check your connection and try again.'
        });
      } else {
        showToast({
          type: 'error',
          title: 'Message Failed',
          message: 'Failed to send message. Please check your API key and settings.'
        });
      }
    }
  }, [input, isLoading, apiKey, hasEnvApiKey, messages, currentSession, showToast, saveMessage, setCurrentSessionAndSync]);

  // Memoized input handlers for better performance
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  }, [sendMessage]);


  const generateReport = async () => {
    if (!currentSession || messages.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Session Data',
        message: 'Please ensure you have messages in the current session to generate a report.'
      });
      return;
    }

    console.log('Generating report for session:', currentSession);

    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession,
          messages: messages.filter(msg => !msg.content.startsWith('📊 **Session Report**')), // Exclude previous reports
          model: 'openai/gpt-oss-120b'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add the report content to the current chat
        if (result.reportContent && currentSession) {
          const reportMessage = {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: `📊 **Session Report**\n\n${result.reportContent}`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, reportMessage]);
          
          // Save the report message to database
          try {
            await saveMessage(currentSession, 'assistant', reportMessage.content);
          } catch (error) {
            console.error('Failed to save report message:', error);
          }
        }
        
        showToast({
          type: 'success',
          title: 'Report Generated',
          message: 'Session report has been added to this chat!'
        });
      } else {
        const error = await response.json();
        console.error('Report generation failed:', {
          status: response.status,
          error: error,
          currentSession: currentSession,
          messagesLength: messages.length
        });
        
        showToast({
          type: 'error',
          title: 'Report Failed',
          message: error.error || 'Failed to generate report. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showToast({
        type: 'error',
        title: 'Report Failed',
        message: 'Failed to generate report. Please try again.'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const openCBTModal = useCallback(() => {
    setShowCBTModal(true);
  }, []);

  const handleCBTSendToChat = useCallback(async (formattedContent: string) => {
    if (isLoading) return;
    
    // Check if we have API key either from user input or environment
    if (!apiKey && !hasEnvApiKey) {
      showToast({
        type: 'warning',
        title: 'API Key Required',
        message: 'Please enter your Groq API key in the settings panel or set GROQ_API_KEY environment variable'
      });
      return;
    }

    // Auto-create session if none exists, using CBT content as title
    let sessionId = currentSession;
    if (!sessionId) {
      try {
        const title = 'CBT Thought Record - ' + new Date().toLocaleDateString();
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const newSession = result.success ? result.data : result;
          setSessions(prev => [newSession, ...prev]);
          
          await setCurrentSessionAndSync(newSession.id);
          sessionId = newSession.id;
        } else {
          console.error('Failed to create session');
          return;
        }
      } catch (error) {
        console.error('Error creating session:', error);
        return;
      }
    }

    // Add CBT diary as a user message
    const cbtMessage: Message = {
      id: `cbt-${Date.now()}`,
      role: 'user',
      content: formattedContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, cbtMessage]);
    setIsLoading(true);

    // Save user message to database
    await saveMessage(sessionId!, 'user', cbtMessage.content);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, cbtMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          sessionId: sessionId,
          apiKey: apiKey,
          model: 'openai/gpt-oss-120b',
          temperature: 0.6,
          maxTokens: 30000,
          topP: 1,
          browserSearchEnabled: true,
          reasoningEffort: 'medium'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const aiMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessage.id 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      setIsLoading(false);

      // Save AI response to database
      await saveMessage(sessionId!, 'assistant', fullContent);
    } catch (error) {
      setIsLoading(false);
      console.error('Error sending CBT message:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('model_not_found') || errorMessage.includes('404')) {
        showToast({
          type: 'error',
          title: 'Model Not Available',
          message: 'The selected model is not available. Please try again.'
        });
      } else if (errorMessage.includes('Failed to fetch')) {
        showToast({
          type: 'error',
          title: 'Network Error',
          message: 'Please check your connection and try again.'
        });
      } else {
        showToast({
          type: 'error',
          title: 'Message Failed',
          message: 'Failed to send CBT diary. Please check your API key.'
        });
      }
    }
  }, [isLoading, apiKey, hasEnvApiKey, messages, currentSession, showToast, saveMessage, setCurrentSessionAndSync, setSessions]);

  return (
    <AuthGuard>
      <div 
        className="flex bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/20"
        role="application"
        aria-label="AI Therapist Chat Application"
      style={{
        height: viewportHeight,
        minHeight: viewportHeight,
        maxHeight: viewportHeight,
        overflow: 'hidden', // Prevent page-level scrolling
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, hsl(var(--accent) / 0.05) 0%, transparent 50%)
        `
      }}
    >
      {/* Mobile backdrop overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        id="chat-sidebar"
        className={`${showSidebar ? 'w-80 sm:w-88 md:w-88' : 'w-0'} ${showSidebar ? 'fixed md:relative' : ''} ${showSidebar ? 'inset-y-0 left-0 z-50 md:z-auto' : ''} transition-all duration-500 ease-in-out overflow-hidden bg-card/80 dark:bg-card/80 backdrop-blur-md border-r border-border/50 flex flex-col shadow-xl animate-slide-in`}
        role="navigation"
        aria-label="Chat sessions"
        aria-hidden={!showSidebar}
        style={{
          background: 'var(--sidebar-background)',
          backgroundImage: `
            linear-gradient(180deg, transparent 0%, hsl(var(--accent) / 0.03) 100%),
            radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.05) 0%, transparent 50%)
          `
        }}
      >
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-therapy-lg gradient-text">Therapeutic AI</h2>
                <p className="text-therapy-sm text-muted-foreground">Your compassionate companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className={therapeuticInteractive.iconButtonSmall}
              >
                <div className="shimmer-effect"></div>
                <X className="w-4 h-4 relative z-10" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={startNewSession}
            className="w-full justify-start gap-3 h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="shimmer-effect"></div>
            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-medium">Start New Session</span>
            <Sparkles className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-therapy-sm text-muted-foreground">No sessions yet</p>
              <p className="text-therapy-sm text-muted-foreground/70">Start a conversation to begin</p>
            </div>
          ) : (
            sessions.map((session, index) => (
            <Card 
              key={session.id}
              className={`p-4 mb-3 group transition-all duration-300 hover:shadow-lg cursor-pointer animate-fade-in ${
                currentSession === session.id 
                  ? 'ring-2 ring-primary/50 bg-primary/5 dark:bg-primary/5 border-primary/30 shadow-md' 
                  : 'hover:border-primary/20 bg-white/50 dark:bg-card/50 hover:bg-white/80 dark:hover:bg-card/70'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className="flex items-start gap-3"
                onClick={() => {
                  setCurrentSessionAndSync(session.id);
                  // Hide sidebar on mobile after selecting a chat
                  if (isMobile) {
                    setShowSidebar(false);
                  }
                }}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  currentSession === session.id 
                    ? 'bg-primary text-primary-foreground' 
                    : therapeuticInteractive.itemHover
                }`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-therapy-base font-medium truncate mb-1">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-therapy-sm text-muted-foreground truncate">
                      {session._count?.messages ? `${session._count.messages} messages` : 'No messages yet'}
                    </p>
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30"></div>
                    <p className="text-therapy-sm text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive relative overflow-hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                >
                  <div className="shimmer-effect"></div>
                  <Trash2 className="w-4 h-4 relative z-10" />
                </Button>
              </div>
            </Card>
          )))
          }
        </div>

        {/* Simple API Key Input */}
        {!hasEnvApiKey && (
          <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent dark:from-muted/10">
            <div className="space-y-2">
              <label className="text-sm font-medium block">
                Groq API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Groq API key"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              />
              {!apiKey && (
                <div className="text-xs text-orange-600">
                  ⚠ API key required for chat functionality
                </div>
              )}
              {apiKey && (
                <div className="text-xs text-green-600">
                  ✓ API key provided
                </div>
              )}
            </div>
          </div>
        )}


      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-h-0" role="main" aria-label="Chat conversation">
        {/* Header */}
        <div className={`${isMobile ? 'p-3' : 'p-6'} border-b border-border/30 bg-card/50 backdrop-blur-md relative flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
              <Button
                variant="ghost"
                size="sm"
                onTouchStart={() => setShowSidebar(!showSidebar)}
                onClick={() => setShowSidebar(!showSidebar)}
                className={getTherapeuticIconButton('large')}
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
                aria-label="Toggle session sidebar"
                aria-expanded={showSidebar}
                aria-controls="chat-sidebar"
              >
                <div className="shimmer-effect"></div>
                <Menu className="w-5 h-5 relative z-10" />
              </Button>
              <div>
                <h1 className="text-therapy-lg md:text-therapy-xl">
                  {currentSession ? 'Therapeutic Session' : 'New Conversation'}
                </h1>
                <p className="text-therapy-sm text-muted-foreground hidden sm:block">
                  {currentSession ? 'Safe space for healing and growth' : 'Start typing to begin your session'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={openCBTModal}
                className={getTherapeuticIconButton('large')}
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
                title="Open CBT diary with reflection"
              >
                <div className="shimmer-effect"></div>
                <BookOpen className="w-5 h-5 relative z-10" />
              </Button>
              {currentSession && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                  className={getTherapeuticIconButton('large', true)}
                  style={{
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  title="Generate session report"
                >
                  <div className="shimmer-effect"></div>
                  {isGeneratingReport ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin relative z-10" />
                  ) : (
                    <FileText className="w-5 h-5 relative z-10" />
                  )}
                </Button>
              )}
            </div>
          </div>
          {/* Decorative gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        </div>

        {/* Messages */}
        <div 
          className={`flex-1 overflow-y-auto custom-scrollbar ${isMobile ? 'p-3 pb-0 prevent-bounce' : 'p-3 sm:p-6'}`} 
          style={{
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          aria-atomic="false"
        >
          {/* Memory Context Indicator */}
          {memoryContext.hasMemory && currentSession && (
            <div className={`mb-4 ${isMobile ? 'mx-1' : 'mx-2'}`}>
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-primary/80 flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  {formatMemoryInfo(memoryContext)}
                </p>
              </div>
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className={`${isMobile ? 'min-h-full' : 'h-full'} flex items-center justify-center`}>
              <div className={`text-center max-w-2xl animate-fade-in ${isMobile ? 'px-3' : 'px-4'}`}>
                <div className="mb-6 sm:mb-8">
                  <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                    <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-therapy-lg sm:text-therapy-xl mb-3 sm:mb-4 gradient-text">
                    Welcome to Your Therapeutic Space
                  </h2>
                  <p className="text-therapy-sm sm:text-therapy-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                    This is a safe, judgment-free environment where you can explore your thoughts 
                    and feelings with compassionate AI support. Take your time, breathe deeply, 
                    and know that you&apos;re in a space designed for healing and growth.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-left">
                    <h3 className="text-therapy-lg text-primary mb-2">🌟 Compassionate Support</h3>
                    <p className="text-therapy-sm text-muted-foreground">Receive empathetic, non-judgmental guidance tailored to your needs</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-left">
                    <h3 className="text-therapy-lg text-accent mb-2">🔒 Private & Secure</h3>
                    <p className="text-therapy-sm text-muted-foreground">Your conversations are confidential and stored securely</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <VirtualizedMessageList 
              messages={messages}
              isStreaming={isLoading}
              isMobile={isMobile}
            />
          )}
          
          {/* Messages end ref for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`${isMobile ? 'p-3 pt-2' : 'p-3 sm:p-6'} border-t border-border/30 bg-card/50 backdrop-blur-md relative flex-shrink-0`} role="form" aria-label="Send message">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleFormSubmit} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Share what's on your mind... 💙"
                  className="min-h-[52px] sm:min-h-[80px] max-h-[120px] sm:max-h-[200px] resize-none rounded-xl sm:rounded-2xl border-border/50 bg-background/80 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 text-base placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all duration-300 touch-manipulation"
                  disabled={isLoading}
                  style={{
                    fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  aria-label="Type your message"
                  aria-describedby="input-help"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`${isMobile ? 'h-[52px] w-[52px] rounded-xl' : 'h-[80px] w-[80px] rounded-2xl'} bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 active:from-primary/80 active:to-accent/80 text-white shadow-lg hover:shadow-xl active:shadow-md transition-all duration-200 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0`}
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
                aria-label={isLoading ? 'Sending message...' : 'Send message'}
                aria-disabled={isLoading || !input.trim()}
              >
                {/* Shimmer effect */}
                <div className="shimmer-effect"></div>
                <Send className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} relative z-10`} />
              </Button>
            </form>
            
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-therapy-sm text-muted-foreground">
              <span id="input-help">Press Enter to send, Shift+Enter for new line</span>
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
              <span className="text-center">This AI provides support but is not a replacement for professional therapy</span>
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
            </div>
          </div>
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
        </div>
      </main>

      {/* Mobile Debug Info - only shows on mobile Safari with network URL */}
      <MobileDebugInfo />
      
      {/* CBT Diary Modal with Schema Reflection */}
      <CBTDiaryModal
        open={showCBTModal}
        onOpenChange={setShowCBTModal}
        onSendToChat={handleCBTSendToChat}
      />
      </div>
    </AuthGuard>
  );
}