'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { MobileDebugInfo } from '@/components/layout/mobile-debug-info';
import { ModalSkeleton } from '@/components/ui/loading-fallback';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import { useInputFooterHeight } from '@/hooks/use-input-footer-height';
import { ChatSidebar } from '@/features/chat/components/dashboard/chat-sidebar';
import { ChatHeader } from '@/features/chat/components/chat-header';
import { ChatContainer } from '@/features/chat/components/chat-container';
import { ChatControls } from '@/features/chat/components/chat-controls';
import { ChatProvider, useChat } from '@/features/chat/context/chat-context';

const MemoryManagementModal = dynamic(
  () =>
    import('@/features/therapy/memory/memory-management-modal').then((mod) => ({
      default: mod.MemoryManagementModal,
    })),
  {
    loading: () => <ModalSkeleton />,
  }
);

const ApiKeysPanel = dynamic(
  () =>
    import('@/features/settings/api-keys-panel').then((mod) => ({
      default: mod.ApiKeysPanel,
    })),
  {
    loading: () => <ModalSkeleton />,
  }
);

function ChatPageInner() {
  const { state: chatState, modals, modalActions, controller } = useChat();
  const t = useTranslations('chat');

  useInputFooterHeight(controller.inputContainerRef, controller.messagesContainerRef);

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
        className="gradient-bg-app bg-app-subtle flex"
        role="application"
        aria-label={t('app.aria')}
        style={appContainerStyle}
      >
        <div id="navigation">
          <ChatSidebar />
        </div>

        <main
          id="main-content"
          className="relative flex min-h-0 flex-1 flex-col"
          role="main"
          aria-label={t('main.aria')}
        >
          <ChatHeader />

          <ChatContainer />

          <ChatControls />
        </main>

        <MobileDebugInfo />

        <MemoryManagementModal
          open={modals.showMemoryModal}
          onOpenChange={modalActions.setShowMemoryModal}
          currentSessionId={chatState.currentSession ?? undefined}
          onMemoryUpdated={controller.setMemoryContext}
        />

        <ApiKeysPanel
          open={modals.showApiKeysPanel}
          onOpenChange={modalActions.setShowApiKeysPanel}
        />
      </div>
    </ChatUIProvider>
  );
}

export default function RootPage() {
  return (
    <ChatProvider>
      <ChatPageInner />
    </ChatProvider>
  );
}
