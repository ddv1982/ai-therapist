'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Settings, 
  Send, 
  Plus, 
  MessageSquare, 
  FileText,
  Trash2,
  Menu,
  X,
  Heart,
  Sparkles,
  User,
  Mail
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ModelConfig } from '@/types/index';
import { generateUUID } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [hasEnvApiKey, setHasEnvApiKey] = useState(false);
  const [model, setModel] = useState('openai/gpt-oss-120b');
  const [temperature, setTemperature] = useState(0.6);
  const [maxTokens, setMaxTokens] = useState(32000);
  const [topP, setTopP] = useState(0.95);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [emailService, setEmailService] = useState('smtp');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromEmail, setFromEmail] = useState('AI Therapist <noreply@therapist.ai>');
  const [saveEmailSettings, setSaveEmailSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Model-specific token limits
  const getModelMaxTokens = (modelName: string): number => {
    // First check if we have the model in our available models list
    const modelInfo = availableModels.find(m => m.id === modelName);
    if (modelInfo && modelInfo.maxTokens) {
      return modelInfo.maxTokens;
    }
    
    // Fallback to default limit if model not found in API data
    return 8192;
  };

  // Load sessions from database on component mount
  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const sessionsData = await response.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // Load messages for a specific session
  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const messagesData = await response.json();
        // Convert timestamp strings to Date objects
        const formattedMessages = messagesData.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Save message to database
  const saveMessage = async (sessionId: string, role: 'user' | 'assistant', content: string) => {
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
        return await response.json();
      } else {
        console.error('Failed to save message');
        return null;
      }
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

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

  // Load saved email settings
  useEffect(() => {
    const savedEmailSettings = localStorage.getItem('emailSettings');
    if (savedEmailSettings) {
      try {
        const settings = JSON.parse(savedEmailSettings);
        setEmailService(settings.emailService || 'smtp');
        setSmtpHost(settings.smtpHost || 'smtp.gmail.com');
        setSmtpUser(settings.smtpUser || '');
        setSmtpPass(settings.smtpPass || '');
        setFromEmail(settings.fromEmail || 'AI Therapist <noreply@therapist.ai>');
        // Load saved email address and checkbox state
        if (settings.emailAddress) {
          setEmailAddress(settings.emailAddress);
        }
        if (settings.saveEmailSettings !== undefined) {
          setSaveEmailSettings(settings.saveEmailSettings);
        }
      } catch (error) {
        console.error('Failed to load email settings:', error);
      }
    }
  }, []);

  // Fetch available models
  useEffect(() => {  
    const abortController = new AbortController();
    
    fetch('/api/models', { signal: abortController.signal })
      .then(res => res.json())
      .then(data => {
        if (data.models) {
          setAvailableModels(data.models);
          
          // Migration: Fix old kimi model ID to new one
          let currentModel = model;
          if (currentModel === 'kimi/kimi-k2-instruct') {
            currentModel = 'moonshotai/kimi-k2-instruct';
            setModel(currentModel);
          }
          
          // Check if current model exists and update maxTokens accordingly
          const currentModelData = data.models.find((m: ModelConfig) => m.id === currentModel);
          if (currentModelData) {
            // Model exists, ensure maxTokens doesn't exceed its limit
            if (maxTokens > currentModelData.maxTokens) {
              setMaxTokens(currentModelData.maxTokens);
            }
          } else if (data.models.length > 0) {
            // Model doesn't exist, switch to first available model
            const firstModel = data.models[0];
            setModel(firstModel.id);
            setMaxTokens(firstModel.maxTokens);
          }
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch models:', error);
          // Fallback to basic models if API fails
          setAvailableModels([
            { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', provider: 'OpenAI', maxTokens: 32000, category: 'featured' },
            { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Meta', maxTokens: 32000, category: 'production' },
            { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'Google', maxTokens: 8192, category: 'production' },
            { id: 'moonshotai/kimi-k2-instruct', name: 'Kimi K2 Instruct', provider: 'Moonshot', maxTokens: 16000, category: 'preview' }
          ]);
        }
      });

    return () => abortController.abort();
  }, [model]);

  // Update maxTokens when model changes or available models data loads
  useEffect(() => {
    if (availableModels.length > 0) {
      const modelLimit = getModelMaxTokens(model);
      if (maxTokens > modelLimit) {
        setMaxTokens(modelLimit);
      }
    }
  }, [model, availableModels]);

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

  const startNewSession = () => {
    // Just clear current session and messages - don't create DB session yet
    setCurrentSession(null);
    setMessages([]);
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
        }
      } else {
        console.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Check if we have API key either from user input or environment
    if (!apiKey && !hasEnvApiKey) {
      alert('Please enter your Groq API key in the settings panel or set GROQ_API_KEY environment variable');
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
          const newSession = await response.json();
          setSessions(prev => [newSession, ...prev]);
          setCurrentSession(newSession.id);
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
          apiKey: apiKey,
          model: model,
          temperature: temperature,
          maxTokens: maxTokens,
          topP: topP
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
            } catch (e) {
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
        alert(`The selected model "${model}" is not available. Please choose a different model in the settings panel.`);
      } else if (errorMessage.includes('Failed to fetch')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Failed to send message. Please check your API key and settings.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateAndSendReport = async () => {
    if (!emailAddress.trim() || !currentSession || messages.length === 0) {
      alert('Please enter a valid email address and ensure you have messages in the current session.');
      return;
    }

    // Validate email configuration if not using console logging
    if (emailService === 'smtp') {
      if (!smtpHost.trim() || !smtpUser.trim() || !smtpPass.trim() || !fromEmail.trim()) {
        alert('Please fill in all SMTP configuration fields or use console logging for testing.');
        return;
      }
    }

    // Save email settings if requested
    if (saveEmailSettings) {
      const emailSettingsToSave = {
        emailService,
        smtpHost,
        smtpUser,
        smtpPass,
        fromEmail,
        emailAddress: emailAddress.trim(),
        saveEmailSettings: true
      };
      localStorage.setItem('emailSettings', JSON.stringify(emailSettingsToSave));
    }

    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/reports/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession,
          messages: messages,
          emailAddress: emailAddress.trim(),
          model: model,
          emailConfig: {
            service: emailService,
            smtpHost: smtpHost.trim(),
            smtpUser: smtpUser.trim(),
            smtpPass: smtpPass.trim(),
            fromEmail: fromEmail.trim()
          }
        }),
      });

      if (response.ok) {
        alert('Report has been sent to your email address!');
        setShowEmailModal(false);
        setEmailAddress('');
      } else {
        const error = await response.json();
        let errorMessage = `Failed to send report: ${error.error || 'Unknown error'}`;
        if (error.details) {
          errorMessage += `\n\nDetails: ${error.details}`;
        }
        if (error.helpUrl) {
          errorMessage += `\n\nFor help, visit: ${error.helpUrl}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error sending report:', error);
      alert('Failed to send report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
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
                className="rounded-full h-8 w-8 p-0 hover:bg-primary/10 relative overflow-hidden group"
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
                  setCurrentSession(session.id);
                  loadMessages(session.id);
                  // Hide sidebar on mobile after selecting a chat
                  if (isMobile) {
                    setShowSidebar(false);
                  }
                }}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  currentSession === session.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary'
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

        {/* Settings Panel */}
        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent dark:from-muted/10">
          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full justify-start gap-2 text-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/30 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </Button>
          
          {showSettings && (
            <div className="mt-4 space-y-4">
              {hasEnvApiKey ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm font-medium text-green-800 mb-1">
                    ✓ API Key Configured
                  </div>
                  <div className="text-xs text-green-700">
                    Using GROQ_API_KEY from environment variable
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium block mb-1">
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
                    <div className="text-xs text-orange-600 mt-1">
                      ⚠ API key required for chat functionality
                    </div>
                  )}
                  {apiKey && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ API key provided
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium block mb-1">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                >
                  {availableModels.length === 0 ? (
                    <option disabled>Loading models...</option>
                  ) : (
                    availableModels.map((modelOption) => (
                      <option key={modelOption.id} value={modelOption.id}>
                        {modelOption.id} {modelOption.maxTokens ? `(${(modelOption.maxTokens / 1000).toFixed(0)}K tokens)` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Controls randomness (0 = focused, 2 = creative)
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">
                  Max Tokens: {maxTokens.toLocaleString()} / {getModelMaxTokens(model).toLocaleString()}
                </label>
                <input
                  type="range"
                  min="256"
                  max={getModelMaxTokens(model)}
                  step="512"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Maximum response length for {model.split('/').pop()}: {getModelMaxTokens(model).toLocaleString()} tokens
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">
                  Top P: {topP}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Nucleus sampling threshold
                </div>
              </div>
            </div>
          )}
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
                className="rounded-full h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors relative overflow-hidden group touch-manipulation"
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
              {currentSession && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailModal(true)}
                  className="rounded-full h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors relative overflow-hidden group touch-manipulation"
                  style={{
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  title="Generate session report"
                >
                  <div className="shimmer-effect"></div>
                  <FileText className="w-5 h-5 relative z-10" />
                </Button>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-accent/50 text-accent-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-therapy-sm font-medium">Online</span>
              </div>
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
                
                <Button 
                  onClick={() => {
                    startNewSession();
                    // Focus the input field after starting new session
                    setTimeout(() => textareaRef.current?.focus(), 100);
                  }} 
                  size="lg"
                  className="h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <Heart className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  <span className="text-therapy-base font-medium">Start New Session</span>
                  <Sparkles className="w-5 h-5 ml-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </div>
          ) : (
            <div className={`max-w-4xl mx-auto ${isMobile ? 'space-y-3 pb-3' : 'space-y-6'}`}>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`animate-message-in ${
                    isMobile 
                      ? 'w-full' 
                      : `flex gap-2 sm:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {!isMobile && message.role === 'assistant' && (
                    <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      {/* Subtle breathing glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary animate-gentle-glow"></div>
                      
                      {/* Heart icon - calm and stable */}
                      <Heart 
                        className="relative w-5 h-5 text-white z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" 
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))'
                        }}
                      />
                      
                      {/* Gentle sparkle on hover only */}
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  )}
                  <div
                    className={`${
                      isMobile 
                        ? `w-full rounded-xl px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md mb-3 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                              : 'bg-card border border-border/50 text-card-foreground backdrop-blur-sm'
                          }`
                        : `message-bubble ${
                            message.role === 'user'
                              ? 'message-bubble-user'
                              : 'message-bubble-assistant'
                          }`
                    }`}
                  >
                    {/* Mobile header with role indicator */}
                    {isMobile && (
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-current/10">
                        <div className="flex items-center gap-2">
                          {message.role === 'assistant' ? (
                            <>
                              <Heart className="w-4 h-4" />
                              <span className="text-sm font-medium">AI Therapist</span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4" />
                              <span className="text-sm font-medium">You</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs opacity-60">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    )}
                    
                    <div className="text-therapy-sm sm:text-therapy-base leading-relaxed prose prose-sm max-w-none dark:prose-invert [&>*:last-child]:mb-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl sm:text-2xl font-bold mb-4 text-foreground border-b border-border/30 pb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg sm:text-xl font-semibold mb-3 text-foreground mt-6 first:mt-0" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground mt-4 first:mt-0" {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-sm sm:text-base font-semibold mb-2 text-foreground mt-3 first:mt-0" {...props} />,
                          p: ({node, ...props}) => <p className="mb-4 text-foreground leading-relaxed last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-foreground bg-primary/10 px-1 py-0.5 rounded" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-accent font-medium" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-foreground" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 space-y-2 text-foreground" {...props} />,
                          li: ({node, ...props}) => <li className="text-foreground leading-relaxed pl-1" {...props} />,
                          blockquote: ({node, ...props}) => (
                            <blockquote className="border-l-4 border-primary bg-primary/5 pl-6 pr-4 py-3 my-4 rounded-r-lg italic text-foreground relative" {...props}>
                              <div className="absolute top-2 left-2 text-primary/50 text-xl">&quot;</div>
                            </blockquote>
                          ),
                          code: ({node, ...props}) => {
                            // Check if code is inline by looking at parent node
                            const isInline = node?.tagName !== 'pre';
                            return isInline ? (
                              <code className="bg-muted px-2 py-1 rounded text-sm text-foreground font-mono border border-border/30" {...props} />
                            ) : (
                              <code className="block bg-muted p-4 rounded-lg text-sm text-foreground font-mono border border-border/30 overflow-x-auto my-4" {...props} />
                            );
                          },
                          pre: ({node, ...props}) => <pre className="bg-muted p-4 rounded-lg border border-border/30 overflow-x-auto my-4" {...props} />,
                          a: ({node, ...props}) => <a className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium" {...props} />,
                          hr: ({node, ...props}) => <hr className="border-border/50 my-6" {...props} />,
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-6 rounded-lg border border-border/30 bg-card shadow-sm">
                              <table className="w-full border-collapse" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-primary/10 border-b border-border/30" {...props} />,
                          tbody: ({node, ...props}) => <tbody {...props} />,
                          tr: ({node, ...props}) => <tr className="border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors" {...props} />,
                          th: ({node, ...props}) => <th className="px-4 py-3 text-left font-semibold text-foreground text-sm uppercase tracking-wide bg-primary/5" {...props} />,
                          td: ({node, ...props}) => <td className="px-4 py-3 text-foreground border-r border-border/10 last:border-r-0" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Desktop timestamp and AI indicator */}
                    {!isMobile && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs sm:text-therapy-sm opacity-60">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-1 opacity-60">
                            <Sparkles className="w-3 h-3" />
                            <span className="text-xs">AI</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!isMobile && message.role === 'user' && (
                    <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      {/* Subtle breathing glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent animate-gentle-glow"></div>
                      
                      {/* User icon - calm and stable */}
                      <User 
                        className="relative w-5 h-5 text-white z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" 
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))'
                        }}
                      />
                      
                      {/* Gentle sparkle on hover only */}
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className={`${isMobile ? 'w-full mb-3' : 'flex gap-4 justify-start'} animate-message-in`}>
                  {!isMobile && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Heart className="w-5 h-5 text-white animate-pulse" />
                    </div>
                  )}
                  <div className={`${
                    isMobile 
                      ? 'w-full rounded-xl px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md bg-card border border-border/50 text-card-foreground backdrop-blur-sm'
                      : 'message-bubble message-bubble-assistant'
                  }`}>
                    {isMobile && (
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-current/10">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm font-medium">AI Therapist</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <span className="text-therapy-sm text-muted-foreground">Reflecting on your words...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`${isMobile ? 'p-3 pt-2' : 'p-3 sm:p-6'} border-t border-border/30 bg-card/50 backdrop-blur-md relative flex-shrink-0`} role="form" aria-label="Send message">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
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

      {/* Email Report Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full border border-border/50 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Send Session Report</h3>
                    <p className="text-sm text-muted-foreground">Configure email and generate therapeutic session summary</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailAddress('');
                  }}
                  className="rounded-full h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="text-sm font-medium block mb-2">
                    Recipient Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter recipient email address"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
                    disabled={isGeneratingReport}
                    style={{
                      fontSize: isMobile ? '16px' : undefined // Prevent zoom on iOS
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    Email Service
                  </label>
                  <select
                    value={emailService}
                    onChange={(e) => setEmailService(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
                    disabled={isGeneratingReport}
                  >
                    <option value="console">Console Log (Testing)</option>
                    <option value="smtp">SMTP (Gmail, Outlook, etc.)</option>
                  </select>
                </div>

                {emailService === 'smtp' && (
                  <>
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        SMTP Host (pre-filled for Gmail)
                      </label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="Enter SMTP host"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
                        disabled={isGeneratingReport}
                        style={{
                          fontSize: isMobile ? '16px' : undefined
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">
                        SMTP Username/Email
                      </label>
                      <input
                        type="email"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="your-email@gmail.com"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
                        disabled={isGeneratingReport}
                        style={{
                          fontSize: isMobile ? '16px' : undefined
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">
                        SMTP Password/App Password
                      </label>
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="Your app password"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
                        disabled={isGeneratingReport}
                        style={{
                          fontSize: isMobile ? '16px' : undefined
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        For Gmail: Use an App Password, not your regular password. 
                        <br />Go to Google Account → Security → App passwords
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">
                        From Email Address (can be any address)
                      </label>
                      <input
                        type="text"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="Enter from email address"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
                        disabled={isGeneratingReport}
                        style={{
                          fontSize: isMobile ? '16px' : undefined
                        }}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveSettings"
                    checked={saveEmailSettings}
                    onChange={(e) => setSaveEmailSettings(e.target.checked)}
                    className="rounded border-border focus:ring-2 focus:ring-primary/30"
                    disabled={isGeneratingReport}
                  />
                  <label htmlFor="saveSettings" className="text-sm text-muted-foreground">
                    Save email configuration for future use
                  </label>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {emailService === 'console' 
                      ? "Email will be logged to console for testing. Check server logs to see the report content."
                      : "The report will include key themes, insights, and recommendations from your current session."
                    }
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailModal(false);
                      setEmailAddress('');
                    }}
                    disabled={isGeneratingReport}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={generateAndSendReport}
                    disabled={isGeneratingReport || !emailAddress.trim()}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                  >
                    {isGeneratingReport ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {emailService === 'console' ? 'Generate Report' : 'Send Report'}
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}