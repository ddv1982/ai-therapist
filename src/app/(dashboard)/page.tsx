'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
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
  Brain
} from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { generateUUID } from '@/lib/utils/utils';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/utils/logger';
import { checkMemoryContext, formatMemoryInfo, type MemoryContextInfo } from '@/lib/chat/memory-utils';
// Removed handleStreamingResponse - AI SDK handles streaming automatically
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import type { MessageData } from '@/features/chat/messages/message';
import { MobileDebugInfo } from '@/components/layout/mobile-debug-info';
import { MemoryManagementModal } from '@/features/therapy/memory/memory-management-modal';
import { therapeuticInteractive, getTherapeuticIconButton } from '@/lib/ui/design-tokens';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/types/api.generated';
import { getApiData } from '@/lib/api/api-response';

type ListSessionsResponse = import('@/lib/api/api-response').ApiResponse<components['schemas']['Session'][]>;
type CreateSessionResponse = import('@/lib/api/api-response').ApiResponse<components['schemas']['Session']>;

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

function ChatPageContent() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Use the new chat messages hook
  const {
    messages,
    loadMessages,
    addMessageToChat,
    clearMessages,
    setMessages
  } = useChatMessages();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  // Environment API key is configured server-side
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [memoryContext, setMemoryContext] = useState<MemoryContextInfo>({ hasMemory: false, reportCount: 0 });
  const [showMemoryModal, setShowMemoryModal] = useState(false);
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
      
      logger.error(`Mobile Safari error in ${context}`, {
        component: 'ChatPage',
        operation: context,
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
        isMobileSafari: true
      }, error instanceof Error ? error : new Error(String(error)));
      
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
        logger.error('Failed to log mobile error to API', {
          component: 'ChatPage',
          operation: 'logMobileError',
          originalContext: context
        }, loggingError instanceof Error ? loggingError : new Error(String(loggingError)));
      }
    }
  }, []);


  // Load sessions from database on component mount (memoized)
  const loadSessions = useCallback(async () => {
    try {
      const sessionsData: ListSessionsResponse = await apiClient.listSessions();
      const sessions = getApiData(sessionsData);
      // Map API date strings to UI Session type (which expects Date)
      const uiSessions: Session[] = (sessions || []).map((s) => ({
        ...s,
        startedAt: s.startedAt ? new Date(s.startedAt as unknown as string) : undefined,
        endedAt: s.endedAt ? new Date(s.endedAt as unknown as string) : undefined,
        createdAt: s.createdAt ? new Date(s.createdAt as unknown as string) : undefined,
        updatedAt: s.updatedAt ? new Date(s.updatedAt as unknown as string) : undefined,
      })) as unknown as Session[];
      setSessions(uiSessions);
    } catch (error) {
      logger.error('Failed to load chat sessions', {
        component: 'ChatPage', 
        operation: 'loadSessions'
      }, error instanceof Error ? error : new Error(String(error)));
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
  // Enhanced loadMessages that uses the hook and also loads memory context
  const loadMessagesWithMemory = useCallback(async (sessionId: string) => {
    try {
      // Load messages using the hook
      await loadMessages(sessionId);
      
      // Check for memory context when loading session
      const memoryInfo = await checkMemoryContext(sessionId);
      setMemoryContext(memoryInfo);
    } catch (error) {
      logger.error('Failed to load messages with memory context', {
        component: 'ChatPage',
        operation: 'loadMessagesWithMemory',
        sessionId
      }, error instanceof Error ? error : new Error(String(error)));
      await logMobileError(error, 'loadMessages');
      showToast({
        type: 'error',
        title: 'Loading Error',
        message: 'Failed to load chat messages. Please try again.'
      });
    }
  }, [loadMessages, logMobileError, showToast]);

  // Save message to database (memoized)
  const saveMessage = useCallback(async (sessionId: string, role: 'user' | 'assistant', content: string, modelUsed?: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          content,
          modelUsed,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Handle new standardized API response format
        return result.success ? result.data : result;
      } else {
        logger.error('Failed to save message to database', {
          component: 'ChatPage',
          operation: 'saveMessage',
          sessionId,
          role,
          status: response.status
        });
        return null;
      }
    } catch (error) {
      logger.error('Error saving message to database', {
        component: 'ChatPage',
        operation: 'saveMessage',
        sessionId,
        role
      }, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }, []);

  // Simple, reliable scroll behavior
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
          await loadMessagesWithMemory(sessionId);
          
          // Save to localStorage for faster future loads
          localStorage.setItem('currentSessionId', sessionId);
          
          logger.info('Loaded current session successfully', {
            component: 'ChatPage',
            operation: 'loadCurrentSession',
            sessionId,
            messageCount: currentSessionData.currentSession.messageCount
          });
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
            await loadMessagesWithMemory(savedCurrentSession);
            logger.info('Restored session from localStorage', {
              component: 'ChatPage',
              operation: 'loadCurrentSession',
              sessionId: savedCurrentSession
            });
          } else {
            // Saved session no longer exists, clear localStorage
            localStorage.removeItem('currentSessionId');
          }
        } catch (error) {
          logger.error('Failed to verify saved session from localStorage', {
            component: 'ChatPage',
            operation: 'loadCurrentSession',
            sessionId: savedCurrentSession
          }, error instanceof Error ? error : new Error(String(error)));
          localStorage.removeItem('currentSessionId');
        }
      }
    } catch (error) {
      logger.error('Failed to load current session', {
        component: 'ChatPage',
        operation: 'loadCurrentSession'
      }, error instanceof Error ? error : new Error(String(error)));
    }
  }, [loadMessagesWithMemory]); // Only depends on loadMessagesWithMemory

  // Load sessions and current session on component mount
  useEffect(() => {
    loadSessions();
    loadCurrentSession();
  }, [loadSessions, loadCurrentSession]);

  // Environment API key is automatically configured





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
      await fetch('/api/sessions/current', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
      
      setCurrentSession(sessionId);
      localStorage.setItem('currentSessionId', sessionId);
      await loadMessagesWithMemory(sessionId);
    } catch (error) {
      logger.error('Failed to sync current session across devices', {
        component: 'ChatPage',
        operation: 'setCurrentSessionAndSync',
        sessionId
      }, error instanceof Error ? error : new Error(String(error)));
      // Still set locally even if sync fails
      setCurrentSession(sessionId);
      localStorage.setItem('currentSessionId', sessionId);
      await loadMessagesWithMemory(sessionId);
    }
  }, [loadMessagesWithMemory]);

  const startNewSession = () => {
    // Just clear current session and messages - don't create DB session yet
    setCurrentSession(null);
    clearMessages();
    localStorage.removeItem('currentSessionId');
    // Focus the input field after starting new session
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const resp = await apiClient.deleteSession(sessionId);
      if (resp) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        if (currentSession === sessionId) {
          setCurrentSession(null);
          clearMessages();
          localStorage.removeItem('currentSessionId');
        }
      } else {
        logger.error('Failed to delete session', {
          component: 'ChatPage',
          operation: 'deleteSession',
          sessionId
        });
      }
    } catch (error) {
      logger.error('Error deleting session', {
        component: 'ChatPage',
        operation: 'deleteSession',
        sessionId
      }, error instanceof Error ? error : new Error(String(error)));
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    // Environment API key is automatically handled by the server

    // Auto-create session if none exists, using first message as title
    let sessionId = currentSession;
    if (!sessionId) {
      try {
        const title = input.slice(0, 50) + (input.length > 50 ? '...' : '');
        const result: CreateSessionResponse = await apiClient.createSession({ title });
        const created = getApiData(result);
        const newSession: Session = {
          ...created,
          startedAt: created.startedAt ? new Date(created.startedAt as unknown as string) : undefined,
          endedAt: created.endedAt ? new Date(created.endedAt as unknown as string) : undefined,
          createdAt: created.createdAt ? new Date(created.createdAt as unknown as string) : undefined,
          updatedAt: created.updatedAt ? new Date(created.updatedAt as unknown as string) : undefined,
        } as unknown as Session;
        if (newSession) {
          setSessions(prev => [newSession, ...prev]);
          
          // Set as current session and sync across devices
          await setCurrentSessionAndSync(newSession.id);
          sessionId = newSession.id;
        } else {
          logger.error('Failed to create new session', {
          component: 'ChatPage',
          operation: 'sendMessage',
          title: title,
          status: 500
        });
          return;
        }
      } catch (error) {
        logger.error('Error creating new session', {
          component: 'ChatPage',
          operation: 'sendMessage'
        }, error instanceof Error ? error : new Error(String(error)));
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
    
    // Reload sessions to update message count in sidebar
    await loadSessions();

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
          selectedModel: 'openai/gpt-oss-20b',
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Create AI message placeholder
      const aiMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Handle AI SDK streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'text-delta' && data.delta) {
                    fullContent += data.delta;
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
          
          // Save AI response to database with model information
          await saveMessage(sessionId!, 'assistant', fullContent, 'openai/gpt-oss-20b');
          
          // Reload sessions to update message count in sidebar
          await loadSessions();
          
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
          logger.error('Error processing AI response stream', {
            component: 'ChatPage',
            operation: 'sendMessage',
            sessionId: sessionId!,
            model: 'openai/gpt-oss-20b'
          }, error instanceof Error ? error : new Error(String(error)));
          showToast({
            type: 'error',
            title: 'Streaming Error',
            message: 'Failed to process AI response. Please try again.'
          });
        }
      }
    } catch (error) {
      setIsLoading(false);
      logger.error('Error sending message to AI', {
        component: 'ChatPage',
        operation: 'sendMessage',
        sessionId: sessionId || 'none',
        model: 'openai/gpt-oss-20b'
      }, error instanceof Error ? error : new Error(String(error)));
      
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
  }, [input, isLoading, messages, currentSession, showToast, saveMessage, setCurrentSessionAndSync, loadSessions, setMessages]);

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

    logger.therapeuticOperation('session_report_generation_started', {
      sessionId: currentSession,
      messageCount: messages.length
    });

    setIsGeneratingReport(true);
    try {
      const result = await apiClient.generateReportDetailed({
        sessionId: currentSession,
        messages: messages.filter(msg => !msg.content.startsWith('📊 **Session Report**')).map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp.toISOString?.() })),
        model: 'openai/gpt-oss-120b',
      });

      if (result) {
        
        // Add the report content to the current chat
        if (result.reportContent && currentSession) {
          const reportMessage = {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: `📊 **Session Report**\n\n${result.reportContent}`,
            timestamp: new Date(),
            modelUsed: 'openai/gpt-oss-120b' // Reports use the larger model
          };
          
          setMessages(prev => [...prev, reportMessage]);
          
          // Save the report message to database with model information
          try {
            await saveMessage(currentSession, 'assistant', reportMessage.content, 'openai/gpt-oss-120b');
            
            // Reload sessions to update message count in sidebar
            await loadSessions();
          } catch (error) {
            logger.error('Failed to save report message to database', {
              component: 'ChatPage',
              operation: 'generateReport',
              sessionId: currentSession
            }, error instanceof Error ? error : new Error(String(error)));
          }
        }
        
        showToast({
          type: 'success',
          title: 'Report Generated',
          message: 'Session report has been added to this chat!'
        });
      } else {
        const error: { error?: string } = (result as { error?: string }) || { error: 'Unknown error' };
        logger.error('Session report generation failed', {
          component: 'ChatPage',
          operation: 'generateReport',
          sessionId: currentSession,
          messageCount: messages.length,
          status: 500,
          error: error
        });
        
        showToast({
          type: 'error',
          title: 'Report Failed',
          message: error.error || 'Failed to generate report. Please try again.'
        });
      }
    } catch (error) {
      logger.error('Error during report generation', {
        component: 'ChatPage',
        operation: 'generateReport',
        sessionId: currentSession
      }, error instanceof Error ? error : new Error(String(error)));
      showToast({
        type: 'error',
        title: 'Report Failed',
        message: 'Failed to generate report. Please try again.'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const openCBTDiary = useCallback(() => {
    router.push('/cbt-diary');
  }, [router]);

  // Create the chat UI bridge for CBT components
  const chatUIBridge: ChatUIBridge = {
    addMessageToChat: async (message) => {
      return await addMessageToChat({
        content: message.content,
        role: message.role,
        sessionId: message.sessionId,
        modelUsed: message.modelUsed,
        source: message.source
      });
    },
    currentSessionId: currentSession,
    isLoading: isLoading
  };

  return (
    <ChatUIProvider bridge={chatUIBridge}>
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
                <h2 className="text-lg gradient-text">Therapeutic AI</h2>
                <p className="text-sm text-muted-foreground">Your compassionate companion</p>
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
              <p className="text-sm text-muted-foreground">No sessions yet</p>
              <p className="text-sm text-muted-foreground/70">Start a conversation to begin</p>
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
                  <h3 className="text-base font-medium truncate mb-1">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {session._count?.messages ? `${session._count.messages} messages` : 'No messages yet'}
                    </p>
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30"></div>
                    <p className="text-sm text-muted-foreground">
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

        {/* API Key Status */}
        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-green-50/30 to-transparent dark:from-green-900/10">
          <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>✓ API Key Configured</span>
          </div>
        </div>


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
                <h1 className="text-lg md:text-xl">
                  {currentSession ? 'Therapeutic Session' : 'New Conversation'}
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {currentSession ? 'Safe space for healing and growth' : 'Start typing to begin your session'}
                </p>
              </div>
            </div>
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={openCBTDiary}
                className={getTherapeuticIconButton('large')}
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
                title={isMobile ? "CBT diary & reports" : "Open CBT diary for structured reflection"}
              >
                <div className="shimmer-effect"></div>
                <Brain className="w-5 h-5 relative z-10" />
              </Button>
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
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-primary/80 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    {formatMemoryInfo(memoryContext)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMemoryModal(true)}
                    className="text-primary/60 hover:text-primary hover:bg-primary/10 h-6 px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
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
                  <h2 className="text-lg sm:text-xl mb-3 sm:mb-4 gradient-text">
                    Welcome to Your Therapeutic Space
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                    This is a safe, judgment-free environment where you can explore your thoughts 
                    and feelings with compassionate AI support. Take your time, breathe deeply, 
                    and know that you&apos;re in a space designed for healing and growth.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-left">
                    <h3 className="text-lg text-primary mb-2">🌟 Compassionate Support</h3>
                    <p className="text-sm text-muted-foreground">Receive empathetic, non-judgmental guidance tailored to your needs</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-left">
                    <h3 className="text-lg text-accent mb-2">🔒 Private & Secure</h3>
                    <p className="text-sm text-muted-foreground">Your conversations are confidential and stored securely</p>
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
          
          {/* Simple scroll anchor for auto-scroll */}
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
          </div>
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
        </div>
      </main>

      {/* Mobile Debug Info - only shows on mobile Safari with network URL */}
      <MobileDebugInfo />
      
      
      {/* Memory Management Modal */}
      <MemoryManagementModal
        open={showMemoryModal}
        onOpenChange={setShowMemoryModal}
        currentSessionId={currentSession ?? undefined}
        onMemoryUpdated={setMemoryContext}
      />
      </div>
    </AuthGuard>
    </ChatUIProvider>
  );
}

// Main export with ChatUIProvider wrapper
export default function ChatPage() {
  return <ChatPageContent />;
}