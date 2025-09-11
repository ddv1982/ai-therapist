'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Plus,
  MessageSquare,
  Trash2,
  X,
  Sparkles,
  Brain,
  Globe,
  Lock,
  ArrowDown
} from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-switcher';
import {useTranslations} from 'next-intl';
import { formatMemoryInfo } from '@/lib/chat/memory-utils';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { ChatHeader } from '@/features/chat/components/chat-header';
import { ChatComposer } from '@/features/chat/components/chat-composer';
import { SystemBanner } from '@/features/chat/components/system-banner';
import { MobileDebugInfo } from '@/components/layout/mobile-debug-info';
import { MemoryManagementModal } from '@/features/therapy/memory/memory-management-modal';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import { useInputFooterHeight } from '@/hooks/use-input-footer-height';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateSettings } from '@/store/slices/chatSlice';
import { useChatController } from '@/hooks';

// types are provided by the controller; no local re-definitions needed

function ChatPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.chat?.settings || { webSearchEnabled: false, model: 'openai/gpt-oss-20b' });
  const t = useTranslations('chat');

  const {
    messages,
    sessions,
    currentSession,
    input,
    isLoading,
    isMobile,
    viewportHeight,
    isGeneratingReport,
    memoryContext,
    setMemoryContext,
    textareaRef,
    messagesContainerRef,
    inputContainerRef,
    isNearBottom,
    scrollToBottom,
    setInput,
    sendMessage,
    stopGenerating,
    startNewSession,
    deleteSession,
    setCurrentSessionAndSync,
    generateReport,
    setShowSidebar,
    showSidebar,
    addMessageToChat,
  } = useChatController({ model: settings.model, webSearchEnabled: settings.webSearchEnabled });
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  // kept for backward compatibility; no longer used since height is managed by hook
  // const inputHeightRef = useRef(0);

  // Keep CSS var for footer height in sync
  useInputFooterHeight(inputContainerRef, messagesContainerRef);

  // Memoized input handlers for better performance
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, [setInput]);

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

  // stopGenerating and generateReport come from the controller

  const openCBTDiary = useCallback(() => {
    router.push('/cbt-diary');
  }, [router]);

  const handleWebSearchToggle = () => {
    const newWebSearchEnabled = !settings.webSearchEnabled;
    dispatch(updateSettings({ 
      webSearchEnabled: newWebSearchEnabled,
      // If enabling web search, ensure smart model is disabled by switching to fast model
      ...(newWebSearchEnabled ? { model: 'openai/gpt-oss-20b' } : {})
    }));
  };

  const handleSmartModelToggle = () => {
    const nextModel = settings.model === 'openai/gpt-oss-120b'
      ? 'openai/gpt-oss-20b'
      : 'openai/gpt-oss-120b';
    dispatch(updateSettings({ 
      model: nextModel,
      // If enabling smart model, force web search off
      ...(nextModel === 'openai/gpt-oss-120b' ? { webSearchEnabled: false } : {})
    }));
  };

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

  // Memoized app container style to avoid expensive repaints on each keystroke
  const appContainerStyle = useMemo<React.CSSProperties>(() => ({
    height: viewportHeight,
    minHeight: viewportHeight,
    maxHeight: viewportHeight,
    overflow: 'hidden',
    backgroundImage: `
      radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, hsl(var(--accent) / 0.05) 0%, transparent 50%)
    `
  }), [viewportHeight]);

  return (
    <ChatUIProvider bridge={chatUIBridge}>
    <AuthGuard>
      <div 
        className="flex gradient-bg-app"
        role="application"
        aria-label={t('app.aria')}
        style={appContainerStyle}
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
        aria-label={t('sidebar.aria')}
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
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold gradient-text">{t('sidebar.brandName')}</h2>
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
                <X className="w-4 h-4 relative z-10" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={startNewSession}
            className="w-full justify-start gap-3 h-12 rounded-xl transition-all duration-200 group"
          >
            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-semibold">{t('sidebar.startNew')}</span>
            <Sparkles className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('sidebar.noSessions')}</p>
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
                    : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary'
                }`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold line-clamp-2 mb-1">
                    {session.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {session.startedAt ? new Date(session.startedAt).toLocaleString() : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 relative z-10" />
                </Button>
              </div>
            </Card>
          )))
          }
        </div>

        {/* Smart Model and Web Search (icon) and Language Toggles */}
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleSmartModelToggle}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                (!settings.webSearchEnabled && settings.model === 'openai/gpt-oss-120b')
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
              aria-pressed={!settings.webSearchEnabled && settings.model === 'openai/gpt-oss-120b'}
              aria-label={(!settings.webSearchEnabled && settings.model === 'openai/gpt-oss-120b') ? t('sidebar.smartEnabled') : t('sidebar.smartDisabled')}
              title={(!settings.webSearchEnabled && settings.model === 'openai/gpt-oss-120b') ? t('sidebar.smartEnabled') : t('sidebar.smartDisabled')}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={handleWebSearchToggle}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.webSearchEnabled 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
              aria-pressed={settings.webSearchEnabled}
              aria-label={settings.webSearchEnabled ? t('sidebar.webSearchEnabled') : t('sidebar.webSearchDisabled')}
              title={settings.webSearchEnabled ? t('sidebar.webSearchEnabled') : t('sidebar.webSearchDisabled')}
            >
              <Globe className="w-4 h-4" />
            </button>
            <LanguageToggle />
          </div>
        </div>

      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-h-0" role="main" aria-label={t('main.aria')}>
        {/* Header */}
        <ChatHeader
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          hasActiveSession={Boolean(currentSession)}
          hasMessages={messages.length > 0}
          isGeneratingReport={isGeneratingReport}
          isLoading={isLoading}
          isMobile={isMobile}
          onGenerateReport={generateReport}
          onStopGenerating={stopGenerating}
          onOpenCBTDiary={openCBTDiary}
        />

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className={`flex-1 overflow-y-auto relative custom-scrollbar ${isMobile ? (messages.length === 0 ? 'p-2 pb-0 prevent-bounce' : 'p-3 pb-0 prevent-bounce') : 'p-3 sm:p-6'}`} 
          style={{
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            // ensure scrollIntoView anchors account for footer height and safe area
            scrollPaddingBottom: isMobile ? `calc(var(--input-h, 0px) + env(safe-area-inset-bottom) + 12px)` : undefined,
          }}
          role="log"
          aria-label={t('main.messagesAria')}
          aria-live="polite"
          aria-atomic="false"
        >
          <SystemBanner
            hasMemory={memoryContext.hasMemory}
            messageCount={messages.length}
            isMobile={isMobile}
            onManageMemory={() => setShowMemoryModal(true)}
            formatText={formatMemoryInfo}
            contextInfo={memoryContext}
          />
          
          {messages.length === 0 ? (
            <div className={`flex items-center justify-center ${isMobile ? 'py-2' : 'py-16'}`}>
              <div className={`text-center max-w-2xl animate-fade-in ${isMobile ? 'px-3' : 'px-6'}`}>
                <div className={`${isMobile ? 'mb-4' : 'mb-8 sm:mb-10'}`}>
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl mb-4 tracking-tight gradient-text">
                    {t('empty.welcome')}
                  </h2>
                  <p className={`text-sm sm:text-base text-muted-foreground ${isMobile ? 'mb-6' : 'mb-8'} leading-relaxed`}>
                    {t('empty.intro')}
                  </p>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isMobile ? 'gap-4 mb-6' : 'gap-6 mb-10'}`}>
                  <div className="p-6 rounded-xl bg-card/70 border border-border text-left flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">{t('empty.compassionTitle')}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t('empty.compassionDesc')}</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-card/70 border border-border text-left flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <Lock className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">{t('empty.privateTitle')}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t('empty.privateDesc')}</p>
                    </div>
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
          
          {/* Jump to latest button when scrolled up */}
          <div className="sticky bottom-3 flex justify-center pointer-events-none">
            {!isNearBottom && (
              <Button
                onClick={() => {
                  scrollToBottom();
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                variant="secondary"
                size="sm"
                className="pointer-events-auto shadow-md rounded-full px-3 py-1 gap-2 bg-background/90 backdrop-blur border"
                aria-label={t('main.jumpToLatest')}
              >
                <ArrowDown className="w-4 h-4" />
                {t('main.latest')}
              </Button>
            )}
          </div>
        </div>

        {/* Input Area */}
        <ChatComposer
          input={input}
          isLoading={Boolean(isLoading)}
          isMobile={isMobile}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSubmit={handleFormSubmit}
          onStop={stopGenerating}
          inputContainerRef={inputContainerRef}
          textareaRef={textareaRef}
        />
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
