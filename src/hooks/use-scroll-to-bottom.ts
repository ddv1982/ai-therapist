/**
 * Streaming-aware scroll hook for therapeutic chat
 * Handles auto-scrolling during message streaming animations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StreamingStage } from '@/types';

interface UseScrollToBottomOptions {
  isStreaming: boolean;
  messages: unknown[];
  container?: HTMLElement | null;
  behavior?: 'auto' | 'smooth';
  offset?: number;
  respectUserScroll?: boolean;
}

export function useScrollToBottom({
  isStreaming,
  messages,
  container,
  behavior = 'smooth',
  offset = 0,
  respectUserScroll = true,
}: UseScrollToBottomOptions) {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(messages.length);
  const streamingStageRef = useRef<StreamingStage>('revealed');
  const [isNearBottomState, setIsNearBottomState] = useState<boolean>(true);

  const computeIsNearBottom = useCallback(() => {
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, [container]);

  // Enhanced scroll function that works with streaming animations
  const scrollToBottom = useCallback(
    (force = false, delay = 0) => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const performScroll = () => {
        if (!container) return;

        // Use requestAnimationFrame for smooth scrolling during animations
        requestAnimationFrame(() => {
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const maxScroll = scrollHeight - clientHeight;

          if (maxScroll > 0 || force) {
            container.scrollTo({
              top: scrollHeight + offset,
              behavior: behavior,
            });
          }
        });
      };

      if (delay > 0) {
        scrollTimeoutRef.current = setTimeout(performScroll, delay);
      } else {
        performScroll();
      }
    },
    [container, behavior, offset]
  );

  // Streaming-aware scroll that waits for animation stages
  const scrollToBottomWithStreaming = useCallback(
    (stage?: StreamingStage) => {
      if (!isStreaming) {
        // Normal scroll when not streaming
        scrollToBottom();
        return;
      }

      // Handle different streaming stages with appropriate delays
      switch (stage) {
        case 'blur':
          // Don't scroll immediately during blur stage
          break;
        case 'stabilizing':
          // Scroll with delay during stabilizing stage
          scrollToBottom(false, 200);
          break;
        case 'revealed':
          // Final scroll when content is fully revealed
          scrollToBottom(true, 100);
          break;
        default:
          // Default streaming scroll with moderate delay
          scrollToBottom(false, 300);
      }
    },
    [isStreaming, scrollToBottom]
  );

  // Auto-scroll on message changes
  useEffect(() => {
    const messageCountChanged = messages.length !== lastMessageCountRef.current;
    const hasNewMessage = messages.length > lastMessageCountRef.current;

    if (messageCountChanged) {
      lastMessageCountRef.current = messages.length;

      if (hasNewMessage) {
        // Respect user scroll position similar to ChatGPT behavior
        const nearBottom = computeIsNearBottom();
        if (respectUserScroll && !nearBottom) {
          // Do not force-scroll if the user has scrolled up
          return;
        }

        // Scroll for new messages with streaming awareness
        if (isStreaming) {
          scrollToBottomWithStreaming();
        } else {
          scrollToBottom();
        }
      }
    }
  }, [
    messages.length,
    isStreaming,
    scrollToBottom,
    scrollToBottomWithStreaming,
    computeIsNearBottom,
    respectUserScroll,
  ]);

  // Handle streaming stage changes
  const onStreamingStageChange = useCallback(
    (stage: StreamingStage) => {
      streamingStageRef.current = stage;
      scrollToBottomWithStreaming(stage);
    },
    [scrollToBottomWithStreaming]
  );

  // Enhanced scroll with intersection observer for better performance
  const smartScrollToBottom = useCallback(() => {
    if (!container) return;

    // Check if user is near bottom before auto-scrolling
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom || isStreaming) {
      scrollToBottomWithStreaming(streamingStageRef.current);
    }
  }, [container, isStreaming, scrollToBottomWithStreaming]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Track near-bottom state and update on scroll
  useEffect(() => {
    if (!container) return;
    // Initialize state
    setIsNearBottomState(computeIsNearBottom());

    const onScroll = () => {
      setIsNearBottomState(computeIsNearBottom());
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
    };
  }, [container, computeIsNearBottom]);

  return {
    scrollToBottom,
    scrollToBottomWithStreaming,
    onStreamingStageChange,
    smartScrollToBottom,
    isNearBottom: isNearBottomState,
  };
}
