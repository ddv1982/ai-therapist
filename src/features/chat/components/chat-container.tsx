/**
 * Chat Container Component
 *
 * Renders the messages list, handles loading states, and manages scrolling.
 * Extracted from ChatPageContent to reduce complexity.
 * Optimized with React.memo and useMemo for better performance.
 */

'use client';

import { memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { SystemBanner } from '@/features/chat/components/system-banner';
import { ChatEmptyState } from '@/features/chat/components/dashboard/chat-empty-state';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { formatMemoryInfo } from '@/features/chat/lib/memory-utils';
import { useChat } from '@/features/chat/context/chat-context';
import { useTranslations } from 'next-intl';

/**
 * Component that renders the chat messages container.
 * Includes system banner, messages list, empty state, and scroll-to-bottom button.
 * Wrapped with React.memo to prevent unnecessary re-renders.
 */
export const ChatContainer = memo(function ChatContainer() {
  const { state: chatState, actions: chatActions, modalActions, controller } = useChat();
  const translate = useTranslations('chat');

  const {
    messages,
    isLoading,
    isMobile,
    currentSession,
    memoryContext,
    isNearBottom,
    messagesContainerRef,
    textareaRef,
  } = chatState;

  // Memoize container className computation
  const containerClassName = useMemo(() => {
    const baseClasses = 'custom-scrollbar relative flex-1 overflow-y-auto';
    const mobileClasses = isMobile
      ? messages.length === 0
        ? 'prevent-bounce p-2 pb-0'
        : 'prevent-bounce p-3 pb-0'
      : 'p-3 sm:p-6';
    return `${baseClasses} ${mobileClasses}`;
  }, [isMobile, messages.length]);

  // Memoize container style
  const containerStyle = useMemo(
    () => ({
      minHeight: 0,
      WebkitOverflowScrolling: 'touch' as const,
      overscrollBehavior: 'contain' as const,
      scrollPaddingBottom: isMobile
        ? `calc(var(--input-h, 0px) + env(safe-area-inset-bottom) + 12px)`
        : undefined,
    }),
    [isMobile]
  );

  // Memoize scroll button click handler
  const handleScrollButtonClick = useCallback(() => {
    chatActions.scrollToBottom();
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [chatActions, textareaRef]);

  return (
    <div
      ref={messagesContainerRef}
      className={containerClassName}
      style={containerStyle}
      role="log"
      aria-label={translate('main.messagesAria')}
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions text"
      aria-busy={Boolean(isLoading)}
    >
      <SystemBanner
        hasMemory={memoryContext.hasMemory}
        messageCount={messages.length}
        isMobile={isMobile}
        onManageMemory={modalActions.openMemoryModal}
        formatText={formatMemoryInfo}
        contextInfo={memoryContext}
      />

      {messages.length === 0 ? (
        <ChatEmptyState isMobile={isMobile} translate={translate} />
      ) : (
        <VirtualizedMessageList
          messages={messages}
          isStreaming={isLoading}
          isMobile={isMobile}
          sessionId={currentSession ?? undefined}
          onUpdateMessageMetadata={controller.updateMessageMetadata}
        />
      )}

      <div className="pointer-events-none sticky bottom-3 flex justify-center">
        {!isNearBottom && (
          <Button
            onClick={handleScrollButtonClick}
            variant="glass"
            size="sm"
            className="pointer-events-auto gap-2 rounded-full px-3 py-1"
            aria-label={translate('main.jumpToLatest')}
          >
            <ArrowDown className="h-4 w-4" />
            {translate('main.latest')}
          </Button>
        )}
      </div>
    </div>
  );
});
