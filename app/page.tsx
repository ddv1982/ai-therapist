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
  User
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ReactMarkdown from 'react-markdown';

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
  const [model, setModel] = useState('qwen/qwen3-32b');
  const [temperature, setTemperature] = useState(0.6);
  const [maxTokens, setMaxTokens] = useState(40960);
  const [topP, setTopP] = useState(0.95);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Model-specific token limits
  const getModelMaxTokens = (modelName: string): number => {
    const limits: Record<string, number> = {
      'kimi/kimi-k2-instruct': 32768,
      'qwen/qwen3-32b': 40960,
      'gemma2-9b-it': 8192,
      'llama-3.1-8b-instant': 131072,
      'llama-3.3-70b-versatile': 32768,
      'meta-llama/llama-guard-4-12b': 8192,
      'deepseek-r1-distill-llama-70b': 131072,
      'llama-3.1-70b-versatile': 131072,
      'mixtral-8x7b-32768': 32768,
    };
    return limits[modelName] || 8192;
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
    fetch('/api/env')
      .then(res => res.json())
      .then(data => setHasEnvApiKey(data.hasGroqApiKey))
      .catch(() => setHasEnvApiKey(false));
  }, []);

  // Update maxTokens when model changes
  useEffect(() => {
    const modelLimit = getModelMaxTokens(model);
    if (maxTokens > modelLimit) {
      setMaxTokens(modelLimit);
    }
  }, [model, maxTokens]);

  // Mobile detection with dynamic resize handling
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();

    // Add resize listener
    window.addEventListener('resize', checkIsMobile);
    
    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(checkIsMobile, 100); // Small delay for orientation change
    });

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      window.removeEventListener('orientationchange', checkIsMobile);
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
      id: Date.now().toString(),
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
        id: (Date.now() + 1).toString(),
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
      alert('Failed to send message. Please check your API key and try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/20"
      style={{
        height: isMobile ? '100dvh' : '100vh', // Use dynamic viewport height on mobile
        minHeight: isMobile ? '100dvh' : '100vh',
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
      <div className={`${showSidebar ? 'w-80 sm:w-88 md:w-88' : 'w-0'} ${showSidebar ? 'fixed md:relative' : ''} ${showSidebar ? 'inset-y-0 left-0 z-50 md:z-auto' : ''} transition-all duration-500 ease-in-out overflow-hidden bg-card/80 dark:bg-card/80 backdrop-blur-md border-r border-border/50 flex flex-col shadow-xl animate-slide-in`}
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
                  <optgroup label="Featured Models">
                    <option value="kimi/kimi-k2-instruct">Kimi K2 Instruct (~200 tps)</option>
                    <option value="qwen/qwen3-32b">Qwen 3 32B (~400 tps, 40K tokens)</option>
                  </optgroup>
                  <optgroup label="Production Models">
                    <option value="gemma2-9b-it">Gemma 2 9B (8K tokens)</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (131K tokens)</option>
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (32K tokens)</option>
                    <option value="meta-llama/llama-guard-4-12b">Llama Guard 4 12B</option>
                  </optgroup>
                  <optgroup label="Preview Models">
                    <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 Distill (131K tokens)</option>
                    <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
                    <option value="mixtral-8x7b-32768">Mixtral 8x7B (32K tokens)</option>
                  </optgroup>
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
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="p-6 border-b border-border/30 bg-card/50 backdrop-blur-md relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onTouchStart={() => setShowSidebar(!showSidebar)}
                onClick={() => setShowSidebar(!showSidebar)}
                className="rounded-full h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors relative overflow-hidden group touch-manipulation"
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl animate-fade-in px-4">
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
                    and know that you're in a space designed for healing and growth.
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
            <div className="max-w-4xl mx-auto space-y-6">
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
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg sm:text-xl font-semibold mb-3 text-foreground" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base sm:text-lg font-semibold mb-2 text-foreground" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm sm:text-base font-semibold mb-2 text-foreground" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 text-foreground leading-relaxed" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-foreground" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground pl-2" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-foreground pl-2" {...props} />,
                          li: ({node, ...props}) => <li className="text-foreground leading-relaxed" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4" {...props} />,
                          code: ({node, ...props}) => <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm text-foreground font-mono" {...props} />,
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
                <div className="flex gap-4 justify-start animate-message-in">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Heart className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="message-bubble message-bubble-assistant">
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
        <div className="p-3 sm:p-6 border-t border-border/30 bg-card/50 backdrop-blur-md relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
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
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className={`${isMobile ? 'h-[52px] w-[52px] rounded-xl' : 'h-[80px] w-[80px] rounded-2xl'} bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 active:from-primary/80 active:to-accent/80 text-white shadow-lg hover:shadow-xl active:shadow-md transition-all duration-200 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0`}
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Shimmer effect */}
                <div className="shimmer-effect"></div>
                <Send className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} relative z-10`} />
              </Button>
            </div>
            
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-therapy-sm text-muted-foreground">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
              <span className="text-center">This AI provides support but is not a replacement for professional therapy</span>
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
            </div>
          </div>
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}