'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import type { MessageData } from '@/features/chat/messages/message';
import { renderMessageItem, type RenderCBTComponent } from './message-item';

// Virtual scrolling configuration
export const VIRTUAL_SCROLL_THRESHOLD = 50; // Use virtual scrolling when messages exceed this count
export const ESTIMATED_MESSAGE_HEIGHT = 120; // Default estimated height for regular messages
export const ESTIMATED_CBT_STEP_HEIGHT = 350; // Larger height for CBT step components
const OVERSCAN_COUNT = 5; // Number of items to render outside visible area

const getMessageContainerClassName = (isMobile: boolean) =>
  `max-w-4xl mx-auto ${isMobile ? 'space-y-3 pb-6' : 'space-y-6 pb-12'}`;

const scrollToLastMessage = <T extends Element>(
  virtualizer: Virtualizer<T, Element>,
  messageCount: number,
  behavior: 'auto' | 'smooth'
) => {
  if (messageCount <= 0) return;
  virtualizer.scrollToIndex(messageCount - 1, {
    align: 'end',
    behavior,
  });
};

function estimateMessageHeight(message: MessageData): number {
  const metadata = message.metadata as Record<string, unknown> | undefined;

  // CBT steps have larger heights
  if (metadata?.step) {
    return ESTIMATED_CBT_STEP_HEIGHT;
  }

  // Obsessions-compulsions flow is also larger
  if (metadata?.type === 'obsessions-compulsions-table') {
    return ESTIMATED_CBT_STEP_HEIGHT;
  }

  // Estimate based on content length for regular messages
  const contentLength = message.content?.length ?? 0;
  const baseHeight = ESTIMATED_MESSAGE_HEIGHT;
  const additionalHeight = Math.floor(contentLength / 200) * 24; // Add ~24px per 200 chars

  return Math.min(baseHeight + additionalHeight, 600); // Cap at 600px estimate
}

export function filterVisibleMessages(messages: MessageData[]): MessageData[] {
  return messages.filter((message) => {
    const metadata = message.metadata as Record<string, unknown> | undefined;

    // Skip dismissed messages
    if (metadata?.dismissed) {
      return false;
    }

    // Skip obsessions-compulsions-table without step (legacy format)
    if (!metadata?.step && metadata?.type === 'obsessions-compulsions-table') {
      return false;
    }

    return true;
  });
}

function getVisibleMessages(messages: MessageData[], maxVisible: number) {
  if (messages.length <= maxVisible) return messages;
  return messages.slice(-maxVisible);
}

export function shouldUseVirtualization(
  enableVirtualization: boolean | undefined,
  messageCount: number
): boolean {
  if (enableVirtualization === false) return false;
  if (enableVirtualization === true) return true;
  return messageCount > VIRTUAL_SCROLL_THRESHOLD;
}

function isLastIndex(index: number, total: number) {
  return index === total - 1;
}

function getVirtualRowStyle(start: number) {
  return {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    transform: `translateY(${start}px)`,
  };
}

function getVirtualContainerStyle(totalSize: number) {
  return {
    height: `${totalSize}px`,
    width: '100%',
    position: 'relative' as const,
  };
}

/**
 * TanStack Virtual powered message list for large conversations
 */
export function VirtualMessageListInner({
  messages,
  isStreaming,
  isMobile,
  scrollContainerRef,
  renderCBTComponent,
}: {
  messages: MessageData[];
  isStreaming: boolean;
  isMobile: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  renderCBTComponent: RenderCBTComponent;
}) {
  const messageCount = messages.length;
  const messageCountRef = useRef(messageCount);
  const lastMessageContent = messages[messageCount - 1]?.content;

  const virtualizer = useVirtualizer({
    count: messageCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => estimateMessageHeight(messages[index]),
    overscan: OVERSCAN_COUNT,
    getItemKey: (index) => messages[index].id,
  });

  useEffect(() => {
    const hasNewMessages = messageCount > messageCountRef.current;
    messageCountRef.current = messageCount;

    if (hasNewMessages && messageCount > 0) {
      requestAnimationFrame(() => {
        scrollToLastMessage(virtualizer, messageCount, 'smooth');
      });
    }
  }, [messageCount, virtualizer]);

  useEffect(() => {
    if (isStreaming && messageCount > 0) {
      const rafId = requestAnimationFrame(() => {
        scrollToLastMessage(virtualizer, messageCount, 'auto');
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isStreaming, messageCount, virtualizer, lastMessageContent]);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const containerClassName = getMessageContainerClassName(isMobile);

  return (
    <div className={containerClassName} style={getVirtualContainerStyle(totalSize)}>
      {virtualItems.map((virtualRow) => {
        const message = messages[virtualRow.index];
        const isLastMessage = isLastIndex(virtualRow.index, messageCount);

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={getVirtualRowStyle(virtualRow.start)}
          >
            {renderMessageItem(message, isLastMessage, isStreaming, renderCBTComponent)}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Simple non-virtualized message list for smaller conversations
 */
export function SimpleMessageList({
  messages,
  isStreaming,
  isMobile,
  maxVisible,
  renderCBTComponent,
}: {
  messages: MessageData[];
  isStreaming: boolean;
  isMobile: boolean;
  maxVisible: number;
  renderCBTComponent: RenderCBTComponent;
}) {
  const visibleMessages = getVisibleMessages(messages, maxVisible);
  const containerClassName = getMessageContainerClassName(isMobile);

  return (
    <div className={containerClassName}>
      {visibleMessages.map((message, index) => {
        const isLastMessage = isLastIndex(index, visibleMessages.length);

        return (
          <div key={message.id}>
            {renderMessageItem(message, isLastMessage, isStreaming, renderCBTComponent)}
          </div>
        );
      })}
    </div>
  );
}
