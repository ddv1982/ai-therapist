'use client';

import { memo, useMemo, useRef, type RefObject, Profiler } from 'react';
import type { MessageData } from '@/features/chat/messages/message';
import type {
  SituationData,
  EmotionData,
  ThoughtData,
  ActionPlanData,
  CoreBeliefData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData,
  CBTStepType,
} from '@/types';
import { onRenderCallback, ENABLE_PROFILING } from '@/lib/utils/render-profiler';
import { useCBTMessageRenderer } from '@/features/chat/components/chat-message-list/cbt-renderer';
import {
  VirtualMessageListInner,
  SimpleMessageList,
  filterVisibleMessages,
  shouldUseVirtualization,
} from '@/features/chat/components/chat-message-list/virtual-lists';

interface ChatMessageListProps {
  messages: MessageData[];
  isStreaming: boolean;
  isMobile: boolean;
  maxVisible?: number;
  activeCBTStep?: CBTStepType | 'complete';
  onCBTStepNavigate?: (step: CBTStepType) => void;
  // CBT component handlers - optional for normal chat
  onCBTSituationComplete?: (data: SituationData) => void;
  onCBTEmotionComplete?: (data: EmotionData) => void;
  onCBTThoughtComplete?: (data: ThoughtData[]) => void;
  onCBTCoreBeliefComplete?: (data: CoreBeliefData) => void;
  onCBTChallengeQuestionsComplete?: (data: ChallengeQuestionsData) => void;
  onCBTRationalThoughtsComplete?: (data: RationalThoughtsData) => void;
  onCBTSchemaModesComplete?: (data: SchemaModesData) => void;
  onCBTSendToChat?: () => void; // For triggering send to chat from final emotions step
  onCBTFinalEmotionsComplete?: (data: EmotionData) => void;
  onCBTActionComplete?: (data: ActionPlanData) => void;
  onUpdateMessageMetadata?: (
    sessionId: string,
    messageId: string,
    metadata: Record<string, unknown>,
    options?: { mergeStrategy?: 'merge' | 'replace' }
  ) => Promise<{ success: boolean; error?: string }>;
  sessionId?: string;
  /**
   * Reference to the scroll container element for virtual scrolling.
   * If not provided, falls back to internal scroll container.
   */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  /**
   * Whether to enable virtual scrolling. Defaults to auto (based on message count).
   * Set to false to force non-virtual rendering (useful for testing or small lists).
   */
  enableVirtualization?: boolean;
}

function getMessageDigest(message: MessageData): string {
  if (message.digest) return message.digest;
  const contentKey = `${message.content.length}:${message.content}`;
  const stepKey = message.metadata?.step ?? '';
  return `${message.id}:${contentKey}:${stepKey}`;
}

function areNonMessagePropsEqual(prevProps: ChatMessageListProps, nextProps: ChatMessageListProps) {
  return (
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.maxVisible === nextProps.maxVisible &&
    prevProps.activeCBTStep === nextProps.activeCBTStep &&
    prevProps.onCBTStepNavigate === nextProps.onCBTStepNavigate &&
    prevProps.onCBTSituationComplete === nextProps.onCBTSituationComplete &&
    prevProps.onCBTEmotionComplete === nextProps.onCBTEmotionComplete &&
    prevProps.onCBTThoughtComplete === nextProps.onCBTThoughtComplete &&
    prevProps.onCBTCoreBeliefComplete === nextProps.onCBTCoreBeliefComplete &&
    prevProps.onCBTChallengeQuestionsComplete === nextProps.onCBTChallengeQuestionsComplete &&
    prevProps.onCBTRationalThoughtsComplete === nextProps.onCBTRationalThoughtsComplete &&
    prevProps.onCBTSchemaModesComplete === nextProps.onCBTSchemaModesComplete &&
    prevProps.onCBTSendToChat === nextProps.onCBTSendToChat &&
    prevProps.onCBTFinalEmotionsComplete === nextProps.onCBTFinalEmotionsComplete &&
    prevProps.onCBTActionComplete === nextProps.onCBTActionComplete &&
    prevProps.onUpdateMessageMetadata === nextProps.onUpdateMessageMetadata &&
    prevProps.sessionId === nextProps.sessionId &&
    prevProps.scrollContainerRef === nextProps.scrollContainerRef &&
    prevProps.enableVirtualization === nextProps.enableVirtualization
  );
}

function areMessageWindowsEqual(
  prevMessages: MessageData[],
  nextMessages: MessageData[],
  windowSize: number
): boolean {
  if (windowSize <= 0) return true;
  const prevSliceStart = Math.max(prevMessages.length - windowSize, 0);
  const nextSliceStart = Math.max(nextMessages.length - windowSize, 0);
  if (prevMessages.length - prevSliceStart !== nextMessages.length - nextSliceStart) {
    return false;
  }
  const prevDigests = new Array(windowSize);
  const nextDigests = new Array(windowSize);
  for (let i = 0; i < windowSize; i += 1) {
    const prevMessage = prevMessages[prevSliceStart + i];
    const nextMessage = nextMessages[nextSliceStart + i];
    if (!prevMessage || !nextMessage) {
      return false;
    }
    if (prevMessage.id !== nextMessage.id) {
      return false;
    }
    prevDigests[i] = getMessageDigest(prevMessage);
    nextDigests[i] = getMessageDigest(nextMessage);
  }
  for (let i = 0; i < prevDigests.length; i += 1) {
    if (prevDigests[i] !== nextDigests[i]) {
      return false;
    }
  }
  return true;
}

function wrapWithProfiler(content: React.ReactNode) {
  if (!ENABLE_PROFILING) return content;
  return (
    <Profiler id="ChatMessageList" onRender={onRenderCallback}>
      {content}
    </Profiler>
  );
}

function ChatMessageListComponent({
  messages,
  isStreaming,
  isMobile,
  maxVisible = 50,
  activeCBTStep,
  onCBTStepNavigate,
  onCBTSituationComplete,
  onCBTEmotionComplete,
  onCBTThoughtComplete,
  onCBTCoreBeliefComplete,
  onCBTChallengeQuestionsComplete,
  onCBTRationalThoughtsComplete,
  onCBTSchemaModesComplete,
  onCBTSendToChat,
  onCBTFinalEmotionsComplete,
  onCBTActionComplete,
  onUpdateMessageMetadata,
  sessionId,
  scrollContainerRef: externalScrollRef,
  enableVirtualization,
}: ChatMessageListProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = externalScrollRef ?? internalScrollRef;

  const filteredMessages = useMemo(() => filterVisibleMessages(messages), [messages]);

  const shouldVirtualize = useMemo(
    () => shouldUseVirtualization(enableVirtualization, filteredMessages.length),
    [enableVirtualization, filteredMessages.length]
  );

  const { renderCBTComponent } = useCBTMessageRenderer({
    filteredMessages,
    activeCBTStep,
    onCBTStepNavigate,
    onCBTSituationComplete,
    onCBTEmotionComplete,
    onCBTThoughtComplete,
    onCBTCoreBeliefComplete,
    onCBTChallengeQuestionsComplete,
    onCBTRationalThoughtsComplete,
    onCBTSchemaModesComplete,
    onCBTSendToChat,
    onCBTFinalEmotionsComplete,
    onCBTActionComplete,
    onUpdateMessageMetadata,
    sessionId,
  });

  const listContent = shouldVirtualize ? (
    <VirtualMessageListInner
      messages={filteredMessages}
      isStreaming={isStreaming}
      isMobile={isMobile}
      scrollContainerRef={scrollContainerRef}
      renderCBTComponent={renderCBTComponent}
    />
  ) : (
    <SimpleMessageList
      messages={filteredMessages}
      isStreaming={isStreaming}
      isMobile={isMobile}
      maxVisible={maxVisible}
      renderCBTComponent={renderCBTComponent}
    />
  );

  return wrapWithProfiler(listContent);
}

export const ChatMessageList = memo(ChatMessageListComponent, (prevProps, nextProps) => {
  if (prevProps.messages === nextProps.messages) {
    return areNonMessagePropsEqual(prevProps, nextProps);
  }

  const prevVisible = prevProps.maxVisible ?? 50;
  const nextVisible = nextProps.maxVisible ?? 50;
  if (!areMessageWindowsEqual(prevProps.messages, nextProps.messages, prevVisible)) return false;
  if (
    prevVisible !== nextVisible &&
    !areMessageWindowsEqual(prevProps.messages, nextProps.messages, nextVisible)
  ) {
    return false;
  }

  return areNonMessagePropsEqual(prevProps, nextProps);
});
