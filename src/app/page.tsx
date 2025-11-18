'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatMemoryInfo } from '@/lib/chat/memory-utils';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { ChatHeader } from '@/features/chat/components/chat-header';
import { ChatComposer } from '@/features/chat/components/chat-composer';
import { SystemBanner } from '@/features/chat/components/system-banner';
import { MobileDebugInfo } from '@/components/layout/mobile-debug-info';

const MemoryManagementModal = dynamic(() =>
  import('@/features/therapy/memory/memory-management-modal').then((mod) => ({
    default: mod.MemoryManagementModal,
  }))
);
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import { useInputFooterHeight } from '@/hooks/use-input-footer-height';
import { useChatSettings } from '@/contexts/chat-settings-context';
import { useChatController } from '@/hooks';
import { ObsessionsCompulsionsData } from '@/types';
import { LOCAL_MODEL_ID, DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID } from '@/features/chat/config';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/utils/logger';
import { ChatSidebar } from '@/features/chat/components/dashboard/chat-sidebar';
import { ChatEmptyState } from '@/features/chat/components/dashboard/chat-empty-state';
import { getModelDisplayName, supportsWebSearch } from '@/ai/model-metadata';

function ChatPageContent() {
  const router = useRouter();
  const { settings, updateSettings } = useChatSettings();
  const t = useTranslations('chat');
  const toastT = useTranslations('toast');

  const effectiveModelId = settings.webSearchEnabled ? ANALYTICAL_MODEL_ID : settings.model;
  const modelLabel = useMemo(() => {
    const base = getModelDisplayName(effectiveModelId);
    return supportsWebSearch(effectiveModelId) ? `${base} (Deep Analysis)` : base;
  }, [effectiveModelId]);

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
    updateMessageMetadata,
    createObsessionsCompulsionsTable,
  } = useChatController({ model: settings.model, webSearchEnabled: settings.webSearchEnabled });
  const { showToast } = useToast();
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  useInputFooterHeight(inputContainerRef, messagesContainerRef);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
    },
    [setInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage();
    },
    [sendMessage]
  );

  const openCBTDiary = useCallback(() => {
    router.push('/cbt-diary');
  }, [router]);

  const handleObsessionsCompulsionsComplete = useCallback(
    async (data: ObsessionsCompulsionsData) => {
      if (!currentSession) return;

      try {
        const { formatObsessionsCompulsionsForChat } = await import(
          '@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions'
        );
        const messageContent = formatObsessionsCompulsionsForChat(data);

        await addMessageToChat({
          content: messageContent,
          role: 'user',
          sessionId: currentSession,
          metadata: {
            type: 'obsessions-compulsions-table',
            data,
          },
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: toastT('saveFailedTitle'),
          message: toastT('saveFailedBody'),
        });
        logger.error(
          'Failed to save obsessions and compulsions data',
          { component: 'ChatPageContent' },
          error as Error
        );
      }
    },
    [currentSession, addMessageToChat, showToast, toastT]
  );

  const handleCreateObsessionsTable = useCallback(async () => {
    const result = await createObsessionsCompulsionsTable();
    if (!result.success) {
      showToast({
        type: 'error',
        title: toastT('trackerCreateFailedTitle'),
        message: result.error ?? toastT('generalRetry'),
      });
      return;
    }
    showToast({
      type: 'success',
      title: toastT('trackerCreateSuccessTitle'),
      message: toastT('trackerCreateSuccessBody'),
    });
  }, [createObsessionsCompulsionsTable, showToast, toastT]);

  const handleWebSearchToggle = () => {
    const newWebSearchEnabled = !settings.webSearchEnabled;
    updateSettings({
      webSearchEnabled: newWebSearchEnabled,
      ...(newWebSearchEnabled ? { model: DEFAULT_MODEL_ID } : {}),
    });
  };

  const handleSmartModelToggle = () => {
    const nextModel =
      settings.model === ANALYTICAL_MODEL_ID ? DEFAULT_MODEL_ID : ANALYTICAL_MODEL_ID;
    updateSettings({
      model: nextModel,
      ...(nextModel === ANALYTICAL_MODEL_ID ? { webSearchEnabled: false } : {}),
    });
  };

  const handleLocalModelToggle = async () => {
    const isLocal = settings.model === LOCAL_MODEL_ID;

    if (isLocal) {
      updateSettings({
        model: DEFAULT_MODEL_ID,
        webSearchEnabled: false,
      });
      return;
    }

    showToast({
      type: 'info',
      title: toastT('checkingLocalModelTitle'),
      message: toastT('checkingLocalModelBody'),
    });

    try {
      const response = await fetch('/api/ollama/health', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error?.message ?? 'Unexpected response from Ollama health endpoint.'
        );
      }

      const health = payload.data as
        | { ok?: boolean; message?: string; status?: string }
        | undefined;

      if (health?.ok) {
        updateSettings({
          model: LOCAL_MODEL_ID,
          webSearchEnabled: false,
        });
        showToast({
          type: 'success',
          title: toastT('localModelReadyTitle'),
          message: health.message ?? toastT('localModelReadyBody'),
        });
      } else {
        const statusMessage = health?.message ?? toastT('localModelUnavailableBody');
        showToast({
          type: 'error',
          title: toastT('localModelUnavailableTitle'),
          message: statusMessage,
        });
      }
    } catch (error) {
      logger.error(
        'Failed to check Ollama availability',
        { component: 'ChatPageContent' },
        error as Error
      );
      showToast({
        type: 'error',
        title: toastT('connectionErrorTitle'),
        message: toastT('connectionErrorBody'),
      });
    }
  };

  const chatUIBridge: ChatUIBridge = {
    addMessageToChat: async (message) => {
      return await addMessageToChat({
        content: message.content,
        role: message.role,
        sessionId: message.sessionId,
        modelUsed: message.modelUsed,
        source: message.source,
      });
    },
    currentSessionId: currentSession,
    isLoading: isLoading,
  };

  const appContainerStyle = useMemo<React.CSSProperties>(
    () => ({
      height: viewportHeight,
      minHeight: viewportHeight,
      maxHeight: viewportHeight,
      overflow: 'hidden',
      backgroundImage: `
      radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, hsl(var(--accent) / 0.05) 0%, transparent 50%)
    `,
    }),
    [viewportHeight]
  );

  return (
    <ChatUIProvider bridge={chatUIBridge}>
      <AuthGuard>
        <div
          className="gradient-bg-app flex"
          role="application"
          aria-label={t('app.aria')}
          style={appContainerStyle}
        >
          <ChatSidebar
            open={showSidebar}
            sessions={sessions}
            currentSessionId={currentSession}
            isMobile={isMobile}
            onClose={() => setShowSidebar(false)}
            onStartNewSession={startNewSession}
            onSelectSession={setCurrentSessionAndSync}
            onDeleteSession={deleteSession}
            onToggleSmartModel={handleSmartModelToggle}
            onToggleWebSearch={handleWebSearchToggle}
            onToggleLocalModel={handleLocalModelToggle}
            webSearchEnabled={settings.webSearchEnabled}
            smartModelActive={!settings.webSearchEnabled && settings.model === ANALYTICAL_MODEL_ID}
            localModelActive={!settings.webSearchEnabled && settings.model === LOCAL_MODEL_ID}
            translate={t}
          />

          <main
            className="relative flex min-h-0 flex-1 flex-col"
            role="main"
            aria-label={t('main.aria')}
          >
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
              onCreateObsessionsTable={() => {
                void handleCreateObsessionsTable();
              }}
              modelLabel={modelLabel}
            />

            <div
              ref={messagesContainerRef}
              className={`custom-scrollbar relative flex-1 overflow-y-auto ${isMobile ? (messages.length === 0 ? 'prevent-bounce p-2 pb-0' : 'prevent-bounce p-3 pb-0') : 'p-3 sm:p-6'}`}
              style={{
                minHeight: 0,
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                scrollPaddingBottom: isMobile
                  ? `calc(var(--input-h, 0px) + env(safe-area-inset-bottom) + 12px)`
                  : undefined,
              }}
              role="log"
              aria-label={t('main.messagesAria')}
              aria-live="polite"
              aria-atomic="false"
              aria-relevant="additions text"
              aria-busy={Boolean(isLoading)}
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
                <ChatEmptyState isMobile={isMobile} translate={t} />
              ) : (
                <VirtualizedMessageList
                  messages={messages}
                  isStreaming={isLoading}
                  isMobile={isMobile}
                  sessionId={currentSession ?? undefined}
                  onObsessionsCompulsionsComplete={handleObsessionsCompulsionsComplete}
                  onUpdateMessageMetadata={updateMessageMetadata}
                />
              )}

              <div className="pointer-events-none sticky bottom-3 flex justify-center">
                {!isNearBottom && (
                  <Button
                    onClick={() => {
                      scrollToBottom();
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                    variant="secondary"
                    size="sm"
                    className="bg-background/90 pointer-events-auto gap-2 rounded-full border px-3 py-1 shadow-md backdrop-blur"
                    aria-label={t('main.jumpToLatest')}
                  >
                    <ArrowDown className="h-4 w-4" />
                    {t('main.latest')}
                  </Button>
                )}
              </div>
            </div>

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

          <MobileDebugInfo />

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

export default function RootPage() {
  return <ChatPageContent />;
}
