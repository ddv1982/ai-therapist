'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MobileDebugInfo } from '@/components/layout/mobile-debug-info';
import { ModalSkeleton } from '@/components/ui/loading-fallback';

const MemoryManagementModal = dynamic(
  () =>
    import('@/features/therapy/memory/memory-management-modal').then((mod) => ({
      default: mod.MemoryManagementModal,
    })),
  {
    loading: () => <ModalSkeleton />,
  }
);
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import { useInputFooterHeight } from '@/hooks/use-input-footer-height';
import { useChatSettings } from '@/contexts/chat-settings-context';
import { useChatController } from '@/hooks';
import { LOCAL_MODEL_ID, ANALYTICAL_MODEL_ID } from '@/features/chat/config';
import { useToast } from '@/components/ui/toast';
import { ChatSidebar } from '@/features/chat/components/dashboard/chat-sidebar';
import { ChatHeader } from '@/features/chat/components/chat-header';
import { ChatHeaderProvider } from '@/features/chat/context/chat-header-context';
import { getModelDisplayName, supportsWebSearch } from '@/ai/model-metadata';
import { useChatState } from '@/features/therapy-chat/hooks/use-chat-state';
import { useChatActions } from '@/features/therapy-chat/hooks/use-chat-actions';
import { useChatModals } from '@/features/therapy-chat/hooks/use-chat-modals';
import { ChatContainer } from '@/features/therapy-chat/components/chat-container';
import { ChatControls } from '@/features/therapy-chat/components/chat-controls';

function ChatPageContent() {
  const router = useRouter();
  const { settings, updateSettings } = useChatSettings();
  const t = useTranslations('chat');
  const toastT = useTranslations('toast');
  const { showToast } = useToast();

  const effectiveModelId = settings.webSearchEnabled ? ANALYTICAL_MODEL_ID : settings.model;
  const modelLabel = useMemo(() => {
    const base = getModelDisplayName(effectiveModelId);
    return supportsWebSearch(effectiveModelId) ? `${base} (Deep Analysis)` : base;
  }, [effectiveModelId]);

  const controller = useChatController({
    model: settings.model,
    webSearchEnabled: settings.webSearchEnabled,
  });

  useInputFooterHeight(controller.inputContainerRef, controller.messagesContainerRef);

  const chatState = useChatState({
    messages: controller.messages,
    sessions: controller.sessions,
    currentSession: controller.currentSession,
    input: controller.input,
    isLoading: controller.isLoading,
    isMobile: controller.isMobile,
    viewportHeight: controller.viewportHeight,
    isGeneratingReport: controller.isGeneratingReport,
    memoryContext: controller.memoryContext,
    textareaRef: controller.textareaRef,
    messagesContainerRef: controller.messagesContainerRef,
    inputContainerRef: controller.inputContainerRef,
    isNearBottom: controller.isNearBottom,
    showSidebar: controller.showSidebar,
  });

  const chatActions = useChatActions({
    chatState,
    setInput: controller.setInput,
    sendMessage: controller.sendMessage,
    addMessageToChat: controller.addMessageToChat,
    createObsessionsCompulsionsTable: controller.createObsessionsCompulsionsTable,
    scrollToBottom: controller.scrollToBottom,
    updateSettings,
    settings,
    router,
    showToast,
    toastT,
  });

  const { modals, actions: modalActions } = useChatModals();

  const chatUIBridge: ChatUIBridge = useMemo(
    () => ({
      addMessageToChat: async (message) => {
        return await controller.addMessageToChat({
          content: message.content,
          role: message.role,
          sessionId: message.sessionId,
          modelUsed: message.modelUsed,
          source: message.source,
        });
      },
      currentSessionId: controller.currentSession,
      isLoading: controller.isLoading,
    }),
    [controller]
  );

  const chatHeaderState = useMemo(
    () => ({
      showSidebar: chatState.showSidebar,
      onToggleSidebar: () => controller.setShowSidebar(!chatState.showSidebar),
      hasActiveSession: Boolean(chatState.currentSession),
      hasMessages: chatState.messages.length > 0,
      isGeneratingReport: chatState.isGeneratingReport,
      isLoading: chatState.isLoading,
      isMobile: chatState.isMobile,
      onGenerateReport: controller.generateReport,
      onStopGenerating: controller.stopGenerating,
      onOpenCBTDiary: chatActions.openCBTDiary,
      onCreateObsessionsTable: () => {
        void chatActions.handleCreateObsessionsTable();
      },
      modelLabel,
    }),
    [
      chatState.showSidebar,
      chatState.currentSession,
      chatState.messages.length,
      chatState.isGeneratingReport,
      chatState.isLoading,
      chatState.isMobile,
      controller,
      chatActions,
      modelLabel,
    ]
  );

  const appContainerStyle = useMemo<React.CSSProperties>(
    () => ({
      height: chatState.viewportHeight,
      minHeight: chatState.viewportHeight,
      maxHeight: chatState.viewportHeight,
      overflow: 'hidden',
    }),
    [chatState.viewportHeight]
  );

  return (
    <ChatUIProvider bridge={chatUIBridge}>
      <div
        className="gradient-bg-app flex bg-app-subtle"
        role="application"
        aria-label={t('app.aria')}
        style={appContainerStyle}
      >
        <div id="navigation">
          <ChatSidebar
            open={chatState.showSidebar}
            sessions={chatState.sessions}
            currentSessionId={chatState.currentSession}
            isMobile={chatState.isMobile}
            onClose={() => controller.setShowSidebar(false)}
            onStartNewSession={controller.startNewSession}
            onSelectSession={controller.setCurrentSessionAndSync}
            onDeleteSession={controller.deleteSession}
            onToggleSmartModel={chatActions.handleSmartModelToggle}
            onToggleWebSearch={chatActions.handleWebSearchToggle}
            onToggleLocalModel={() => {
              void chatActions.handleLocalModelToggle();
            }}
            webSearchEnabled={settings.webSearchEnabled}
            smartModelActive={!settings.webSearchEnabled && settings.model === ANALYTICAL_MODEL_ID}
            localModelActive={!settings.webSearchEnabled && settings.model === LOCAL_MODEL_ID}
            translate={t}
          />
        </div>

        <main
          id="main-content"
          className="relative flex min-h-0 flex-1 flex-col"
          role="main"
          aria-label={t('main.aria')}
        >
          <ChatHeaderProvider value={chatHeaderState}>
            <ChatHeader />
          </ChatHeaderProvider>

          <ChatContainer
            chatState={chatState}
            onObsessionsCompulsionsComplete={chatActions.handleObsessionsCompulsionsComplete}
            onUpdateMessageMetadata={controller.updateMessageMetadata}
            onManageMemory={modalActions.openMemoryModal}
            onScrollToBottom={chatActions.scrollToBottom}
            translate={t}
          />

          <ChatControls
            chatState={chatState}
            chatActions={chatActions}
            onStop={controller.stopGenerating}
          />
        </main>

        <MobileDebugInfo />

        <MemoryManagementModal
          open={modals.showMemoryModal}
          onOpenChange={modalActions.setShowMemoryModal}
          currentSessionId={chatState.currentSession ?? undefined}
          onMemoryUpdated={controller.setMemoryContext}
        />
      </div>
    </ChatUIProvider>
  );
}

export default function RootPage() {
  return <ChatPageContent />;
}
