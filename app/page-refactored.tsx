'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ChatInterface } from '@/components/chat/chat-interface';
import { SessionSidebar } from '@/components/chat/session-sidebar';
import { SettingsPanel } from '@/components/chat/settings-panel';
import { useToast } from '@/components/ui/toast';
import { MobileDebugInfo } from '@/components/mobile-debug-info';
import type { ModelConfig } from '@/types/index';
import { getCSRFHeaders } from '@/lib/csrf-protection';

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
  
  // Session Management State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  
  // API Configuration State
  const [apiKey, setApiKey] = useState('');
  const [hasEnvApiKey, setHasEnvApiKey] = useState(false);
  
  // Model Configuration State
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    model: 'openai/gpt-oss-120b',
    temperature: 0.6,
    maxTokens: 32000,
    topP: 0.95
  });
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);

  // Mobile detection and viewport handling
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        setViewportHeight(`${window.innerHeight}px`);
        setShowSidebar(false);
      }
    };

    const handleResize = () => {
      checkMobile();
    };

    const handleOrientationChange = () => {
      setTimeout(checkMobile, 100);
    };

    checkMobile();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Check for environment API key
  useEffect(() => {
    const checkEnvApiKey = async () => {
      try {
        const response = await fetch('/api/env');
        const data = await response.json();
        setHasEnvApiKey(data.hasGroqApiKey || false);
      } catch (error) {
        console.error('Failed to check environment API key:', error);
      }
    };

    checkEnvApiKey();
  }, []);

  // Load available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models', {
          headers: {
            ...getCSRFHeaders(),
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const models = await response.json();
          setAvailableModels(models);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };

    fetchModels();
  }, []);

  // Load sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions', {
          headers: {
            ...getCSRFHeaders(),
          },
        });
        if (response.ok) {
          const sessionData = await response.json();
          setSessions(sessionData);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  // Session Management Functions
  const startNewSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          ...getCSRFHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}`
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession.id);
        
        if (isMobile) {
          setShowSidebar(false);
        }
        
        showToast({
          title: 'New session started',
          description: 'Ready to begin your therapeutic conversation.',
        });
      }
    } catch (error) {
      console.error('Failed to start new session:', error);
      showToast({
        title: 'Error',
        description: 'Failed to start a new session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          ...getCSRFHeaders(),
        },
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSession === sessionId) {
          setCurrentSession(null);
        }
        
        showToast({
          title: 'Session deleted',
          description: 'The session has been removed.',
        });
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      showToast({
        title: 'Error',
        description: 'Failed to delete the session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const loadMessages = async (sessionId: string) => {
    // This will be handled by the ChatInterface component
    setCurrentSession(sessionId);
    
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  return (
    <AuthGuard>
      <div 
        className="flex h-screen bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden"
        style={{ height: viewportHeight }}
      >
        {/* Session Sidebar */}
        <SessionSidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          sessions={sessions}
          currentSession={currentSession}
          setCurrentSession={setCurrentSession}
          loadMessages={loadMessages}
          deleteSession={deleteSession}
          startNewSession={startNewSession}
          isMobile={isMobile}
          viewportHeight={viewportHeight}
        >
          {/* Settings Panel inside sidebar */}
          <SettingsPanel
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            hasEnvApiKey={hasEnvApiKey}
            apiKey={apiKey}
            setApiKey={setApiKey}
            model={modelConfig.model}
            setModel={(model) => setModelConfig(prev => ({ ...prev, model }))}
            availableModels={availableModels}
            temperature={modelConfig.temperature}
            setTemperature={(temperature) => setModelConfig(prev => ({ ...prev, temperature }))}
            maxTokens={modelConfig.maxTokens}
            setMaxTokens={(maxTokens) => setModelConfig(prev => ({ ...prev, maxTokens }))}
            topP={modelConfig.topP}
            setTopP={(topP) => setModelConfig(prev => ({ ...prev, topP }))}
            getModelMaxTokens={(modelName: string) => {
              const model = availableModels.find(m => m.name === modelName);
              return model?.context_window || 32000;
            }}
          />
        </SessionSidebar>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface
            currentSession={currentSession}
            apiKey={apiKey}
            hasEnvApiKey={hasEnvApiKey}
            modelConfig={modelConfig}
            isMobile={isMobile}
            onShowSidebar={() => setShowSidebar(true)}
            onShowSettings={() => setShowSettings(true)}
            onSessionUpdate={(session) => {
              setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...session } : s));
            }}
          />
        </div>

        {/* Mobile Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <MobileDebugInfo />
        )}
      </div>
    </AuthGuard>
  );
}