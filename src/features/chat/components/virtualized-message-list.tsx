'use client';

import { memo, useMemo, useCallback, useRef, useEffect, type RefObject, Profiler } from 'react';
import dynamic from 'next/dynamic';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircle, Heart } from 'lucide-react';
import { Message, type MessageData } from '@/features/chat/messages';
import type {
  SituationData,
  EmotionData,
  ThoughtData,
  ActionPlanData,
  CoreBeliefData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData,
  SchemaMode,
  ObsessionsCompulsionsData,
  CBTStepType,
  SchemaModeData,
} from '@/types';
import type { CBTChatFlowSessionData } from '@/features/therapy/cbt/hooks/use-cbt-chat-experience';
import { CBT_STEP_CONFIG } from '@/features/therapy/cbt/flow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { onRenderCallback, ENABLE_PROFILING } from '@/lib/utils/render-profiler';

// Virtual scrolling configuration
const VIRTUAL_SCROLL_THRESHOLD = 50; // Use virtual scrolling when messages exceed this count
const ESTIMATED_MESSAGE_HEIGHT = 120; // Default estimated height for regular messages
const ESTIMATED_CBT_STEP_HEIGHT = 350; // Larger height for CBT step components
const OVERSCAN_COUNT = 5; // Number of items to render outside visible area

const SituationPrompt = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/situation-prompt').then((mod) => ({
    default: mod.SituationPrompt,
  }))
);

const EmotionScale = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/emotion-scale').then((mod) => ({
    default: mod.EmotionScale,
  }))
);

const ThoughtRecord = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/thought-record').then((mod) => ({
    default: mod.ThoughtRecord,
  }))
);

const CoreBelief = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/core-belief').then((mod) => ({
    default: mod.CoreBelief,
  }))
);

const ChallengeQuestions = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/challenge-questions').then((mod) => ({
    default: mod.ChallengeQuestions,
  }))
);

const RationalThoughts = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/rational-thoughts').then((mod) => ({
    default: mod.RationalThoughts,
  }))
);

const SchemaModes = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/schema-modes').then((mod) => ({
    default: mod.SchemaModes,
  }))
);

const FinalEmotionReflection = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/final-emotion-reflection').then((mod) => ({
    default: mod.FinalEmotionReflection,
  }))
);

const ActionPlan = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/action-plan').then((mod) => ({
    default: mod.ActionPlan,
  }))
);

const ObsessionsCompulsionsFlow = dynamic(() =>
  import('@/features/therapy/obsessions-compulsions/obsessions-compulsions-flow').then((mod) => ({
    default: mod.ObsessionsCompulsionsFlow,
  }))
);

type SchemaModeLike = SchemaMode | SchemaModeData;

function useSafeToast(): ReturnType<typeof useToast> {
  try {
    return useToast();
  } catch {
    return {
      toasts: [],
      showToast: () => {},
      removeToast: () => {},
    } as ReturnType<typeof useToast>;
  }
}

function capitaliseLabel(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isSchemaModeSelected(mode: SchemaModeLike): boolean {
  if ('selected' in mode) {
    return Boolean(mode.selected);
  }
  return Boolean(mode.isActive);
}

function schemaModeLabel(mode: SchemaModeLike, index: number): string {
  if ('name' in mode) {
    return mode.name ?? `Schema Mode ${index + 1}`;
  }
  return mode.mode ?? `Schema Mode ${index + 1}`;
}

function renderEmotionBadges(emotions?: EmotionData | null) {
  if (!emotions) return null;
  const entries = Object.entries(emotions).filter(([key, score]) => {
    if (key === 'other') return Boolean(emotions.other && emotions.otherIntensity);
    if (key === 'otherIntensity') return false;
    return typeof score === 'number' && score > 0;
  });

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([emotionKey, score]) => (
        <Badge key={emotionKey} variant="outline">
          {capitaliseLabel(emotionKey)}: {score}/10
        </Badge>
      ))}
      {emotions.other && emotions.otherIntensity ? (
        <Badge variant="outline">
          {emotions.other}: {emotions.otherIntensity}/10
        </Badge>
      ) : null}
    </div>
  );
}

function renderCompletedStepSummary(
  step: CBTStepType,
  sessionData: CBTChatFlowSessionData | undefined,
  onNavigate?: (step: CBTStepType) => void,
  isFinalStep: boolean = false
) {
  if (step === 'complete') {
    return null;
  }
  const config = CBT_STEP_CONFIG[step];
  if (!config) return null;

  const title = config.metadata.title.defaultText;
  const content: React.ReactNode[] = [];

  switch (step) {
    case 'situation': {
      const situation = sessionData?.situationData;
      if (situation?.situation) {
        content.push(
          <p key="situation" className="text-foreground text-sm">
            {situation.situation}
          </p>
        );
      }
      if (situation?.date) {
        const formatted = new Date(situation.date).toLocaleDateString();
        content.push(
          <p key="date" className="text-muted-foreground text-xs">
            Date: {formatted}
          </p>
        );
      }
      break;
    }
    case 'emotions':
      content.push(
        <div key="emotions" className="text-muted-foreground text-sm">
          {renderEmotionBadges(sessionData?.emotionData)}
        </div>
      );
      break;
    case 'thoughts': {
      const thoughts = sessionData?.thoughtData ?? [];
      if (thoughts.length > 0) {
        content.push(
          <ul
            key="thoughts"
            className="text-muted-foreground list-inside list-disc space-y-1 text-sm"
          >
            {thoughts.map((thought, index) => (
              <li key={`${thought.thought}-${index}`}>
                {thought.thought} ({thought.credibility}/10)
              </li>
            ))}
          </ul>
        );
      }
      break;
    }
    case 'core-belief': {
      const coreBelief = sessionData?.coreBeliefData;
      if (coreBelief) {
        content.push(
          <p key="core-belief" className="text-muted-foreground text-sm">
            "{coreBelief.coreBeliefText}" ({coreBelief.coreBeliefCredibility}/10)
          </p>
        );
      }
      break;
    }
    case 'challenge-questions': {
      const questions = sessionData?.challengeQuestionsData?.challengeQuestions ?? [];
      if (questions.length > 0) {
        content.push(
          <ul key="challenge" className="text-muted-foreground space-y-2 text-sm">
            {questions.map((item, index) => (
              <li key={`${item.question}-${index}`}>
                <span className="font-medium">{item.question}</span>
                <br />
                <span>{item.answer}</span>
              </li>
            ))}
          </ul>
        );
      }
      break;
    }
    case 'rational-thoughts': {
      const rational = sessionData?.rationalThoughtsData?.rationalThoughts ?? [];
      if (rational.length > 0) {
        content.push(
          <ul
            key="rational"
            className="text-muted-foreground list-inside list-disc space-y-1 text-sm"
          >
            {rational.map((thought, index) => (
              <li key={`${thought.thought}-${index}`}>
                {thought.thought} ({thought.confidence}/10)
              </li>
            ))}
          </ul>
        );
      }
      break;
    }
    case 'schema-modes': {
      const modes =
        sessionData?.schemaModesData?.selectedModes?.filter((mode) => isSchemaModeSelected(mode)) ??
        [];
      if (modes.length > 0) {
        content.push(
          <div key="schema" className="flex flex-wrap gap-2">
            {modes.map((mode, index) => (
              <Badge key={`${schemaModeLabel(mode, index)}-${index}`} variant="secondary">
                {schemaModeLabel(mode, index)}
                {typeof mode.intensity === 'number' ? ` (${mode.intensity}/10)` : ''}
              </Badge>
            ))}
          </div>
        );
      }
      break;
    }
    case 'actions': {
      const actionPlan = sessionData?.actionData;
      if (actionPlan?.newBehaviors) {
        content.push(
          <p key="actions" className="text-muted-foreground text-sm">
            {actionPlan.newBehaviors}
          </p>
        );
      }
      const finalEmotions = renderEmotionBadges(actionPlan?.finalEmotions);
      if (finalEmotions) {
        content.push(
          <div key="action-emotions" className="text-muted-foreground text-sm">
            {finalEmotions}
          </div>
        );
      }
      break;
    }
    case 'final-emotions': {
      const final = renderEmotionBadges(sessionData?.actionData?.finalEmotions);
      if (final) {
        content.push(
          <div key="final-emotions" className="text-muted-foreground text-sm">
            {final}
          </div>
        );
      }
      break;
    }
    default:
      break;
  }

  return (
    <Card className="border-muted/50 bg-muted/30 border">
      <CardHeader className="flex flex-row items-center gap-2 py-3">
        <CheckCircle className="text-primary h-4 w-4" />
        <CardTitle className="text-foreground text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {content.length > 0 ? content : <p className="text-muted-foreground text-sm">Completed.</p>}
        {onNavigate && isFinalStep ? (
          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => onNavigate(step)}>
              Edit step
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export interface VirtualizedMessageListProps {
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

/**
 * Estimate the height of a message based on its content and type
 */
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

/**
 * Filter messages to remove dismissed items and prepare for rendering
 */
function filterVisibleMessages(messages: MessageData[]): MessageData[] {
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

/**
 * Memoized Message Item component for optimal rendering
 */
const MemoizedMessageItem = memo(
  function MessageItem({
    message,
    isLastMessage,
    isStreaming,
    renderCBTComponent,
  }: {
    message: MessageData;
    isLastMessage: boolean;
    isStreaming: boolean;
    renderCBTComponent: (message: MessageData) => React.ReactNode;
  }) {
    const metadata = message.metadata as Record<string, unknown> | undefined;
    const isAssistantMessage = message.role === 'assistant';
    const shouldShowTypingIndicator =
      isStreaming && isLastMessage && isAssistantMessage && message.content === '';

    // For CBT steps, wrap with article role since CBT components don't have one
    // For regular messages, Message component already provides article with aria-label
    const content = metadata?.step ? (
      <div role="article" aria-label={`CBT ${metadata.step} step`}>
        {renderCBTComponent(message)}
      </div>
    ) : message.content ? (
      <Message message={message} />
    ) : null;

    return (
      <>
        {shouldShowTypingIndicator && <TypingIndicator />}
        {content}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal re-rendering
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.role === nextProps.message.role &&
      prevProps.isLastMessage === nextProps.isLastMessage &&
      prevProps.isStreaming === nextProps.isStreaming &&
      prevProps.message.metadata?.step === nextProps.message.metadata?.step
    );
  }
);

/**
 * TanStack Virtual powered message list for large conversations
 */
function VirtualMessageListInner({
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
  renderCBTComponent: (message: MessageData) => React.ReactNode;
}) {
  const messageCountRef = useRef(messages.length);

  // Create virtualizer for efficient rendering
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => estimateMessageHeight(messages[index]),
    overscan: OVERSCAN_COUNT,
    getItemKey: (index) => messages[index].id,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const hasNewMessages = messages.length > messageCountRef.current;
    messageCountRef.current = messages.length;

    if (hasNewMessages && messages.length > 0) {
      // Scroll to bottom when new messages arrive
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(messages.length - 1, {
          align: 'end',
          behavior: 'smooth',
        });
      });
    }
  }, [messages.length, virtualizer]);

  // Auto-scroll during streaming updates
  useEffect(() => {
    if (isStreaming && messages.length > 0) {
      const scrollToEnd = () => {
        virtualizer.scrollToIndex(messages.length - 1, {
          align: 'end',
          behavior: 'auto',
        });
      };

      // Use RAF for smooth streaming updates
      const rafId = requestAnimationFrame(scrollToEnd);
      return () => cancelAnimationFrame(rafId);
    }
  }, [isStreaming, messages.length, virtualizer, messages[messages.length - 1]?.content]);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const containerClassName = `max-w-4xl mx-auto ${isMobile ? 'space-y-3 pb-6' : 'space-y-6 pb-12'}`;

  return (
    <div
      className={containerClassName}
      style={{
        height: `${totalSize}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const message = messages[virtualRow.index];
        const isLastMessage = virtualRow.index === messages.length - 1;

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <MemoizedMessageItem
              message={message}
              isLastMessage={isLastMessage}
              isStreaming={isStreaming}
              renderCBTComponent={renderCBTComponent}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Simple non-virtualized message list for smaller conversations
 */
function SimpleMessageList({
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
  renderCBTComponent: (message: MessageData) => React.ReactNode;
}) {
  // For conversations with many messages without virtualization, only render the most recent
  const visibleMessages = useMemo(() => {
    if (messages.length <= maxVisible) {
      return messages;
    }
    return messages.slice(-maxVisible);
  }, [messages, maxVisible]);

  const containerClassName = useMemo(
    () => `max-w-4xl mx-auto ${isMobile ? 'space-y-3 pb-6' : 'space-y-6 pb-12'}`,
    [isMobile]
  );

  return (
    <div className={containerClassName}>
      {visibleMessages.map((message, index) => {
        const isLastMessage = index === visibleMessages.length - 1;

        return (
          <div key={message.id}>
            <MemoizedMessageItem
              message={message}
              isLastMessage={isLastMessage}
              isStreaming={isStreaming}
              renderCBTComponent={renderCBTComponent}
            />
          </div>
        );
      })}
    </div>
  );
}

// Main component implementation
function VirtualizedMessageListComponent({
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
}: VirtualizedMessageListProps) {
  const { showToast } = useSafeToast();
  const t = useTranslations('toast');
  const internalScrollRef = useRef<HTMLDivElement>(null);

  // Use external scroll ref if provided, otherwise use internal
  const scrollContainerRef = externalScrollRef ?? internalScrollRef;

  // Filter out dismissed and irrelevant messages
  const filteredMessages = useMemo(() => filterVisibleMessages(messages), [messages]);

  // Determine whether to use virtualization
  const shouldVirtualize = useMemo(() => {
    if (enableVirtualization === false) return false;
    if (enableVirtualization === true) return true;
    // Auto-detect based on message count
    return filteredMessages.length > VIRTUAL_SCROLL_THRESHOLD;
  }, [enableVirtualization, filteredMessages.length]);

  // Track last component message IDs for CBT steps (exclude AI responses)
  const lastStepMessageId = useMemo(() => {
    const map = new Map<CBTStepType, string>();
    filteredMessages.forEach((message) => {
      const step = message.metadata?.step as CBTStepType | undefined;
      // Only track component messages, not AI responses
      // Component messages have IDs like "cbt:component:emotions"
      if (step && message.id.includes(':component:')) {
        map.set(step, message.id);
      }
    });
    return map;
  }, [filteredMessages]);

  const handleDismissObsessionsFlow = useCallback(
    async (messageId: string) => {
      if (!sessionId || !onUpdateMessageMetadata) {
        showToast({
          type: 'error',
          title: t('hideTrackerUnavailableTitle'),
          message: t('hideTrackerUnavailableBody'),
        });
        return;
      }

      const result = await onUpdateMessageMetadata(sessionId, messageId, {
        dismissed: true,
        dismissedReason: 'manual',
      });

      if (!result.success) {
        showToast({
          type: 'error',
          title: t('hideTrackerFailedTitle'),
          message: result.error ?? t('generalRetry'),
        });
        return;
      }
      showToast({
        type: 'info',
        title: t('hideTrackerSuccessTitle'),
        message: t('hideTrackerSuccessBody'),
      });
    },
    [sessionId, onUpdateMessageMetadata, showToast, t]
  );

  // Function to render CBT components based on step
  const renderCBTComponent = useCallback(
    (message: MessageData) => {
      const rawStep = message.metadata?.step;
      const stepNumber = message.metadata?.stepNumber;
      const totalSteps = message.metadata?.totalSteps;
      const sessionData = message.metadata?.sessionData as CBTChatFlowSessionData | undefined;

      if (!rawStep || typeof rawStep !== 'string') return null;

      if (rawStep === 'obsessions-compulsions') {
        // Require onUpdateMessageMetadata to persist changes
        if (!sessionId || !onUpdateMessageMetadata) {
          return null;
        }

        const metadata = (message.metadata as Record<string, unknown> | undefined) ?? undefined;
        const sessionFlowData = metadata?.sessionData as ObsessionsCompulsionsData | undefined;
        const storedData = metadata?.data as ObsessionsCompulsionsData | undefined;
        const initialData = storedData ?? sessionFlowData;

        return (
          <ObsessionsCompulsionsFlow
            onComplete={async (data) => {
              const result = await onUpdateMessageMetadata(
                sessionId,
                message.id,
                {
                  step: 'obsessions-compulsions',
                  data,
                  dismissed: false,
                  dismissedReason: null,
                },
                { mergeStrategy: 'merge' }
              );
              if (!result.success) {
                showToast({
                  type: 'error',
                  title: t('saveFailedTitle'),
                  message: result.error ?? t('generalRetry'),
                });
              }
            }}
            onDismiss={() => handleDismissObsessionsFlow(message.id)}
            initialData={initialData}
          />
        );
      }

      const step = rawStep as CBTStepType;
      const isFinalStep = step === 'final-emotions';
      const isActive = activeCBTStep && step === activeCBTStep;
      const allowCompletedSummary = !activeCBTStep;
      const isLatestForStep = message.id === lastStepMessageId.get(step);

      if (!isLatestForStep) {
        return null;
      }

      if (!isActive) {
        if (!allowCompletedSummary) {
          return null;
        }
        return renderCompletedStepSummary(step, sessionData, onCBTStepNavigate, isFinalStep);
      }

      switch (step) {
        case 'situation':
          return onCBTSituationComplete ? (
            <SituationPrompt
              onComplete={onCBTSituationComplete}
              onNavigateStep={onCBTStepNavigate}
            />
          ) : null;

        case 'emotions':
          return onCBTEmotionComplete ? (
            <EmotionScale onComplete={onCBTEmotionComplete} onNavigateStep={onCBTStepNavigate} />
          ) : null;

        case 'thoughts':
          return onCBTThoughtComplete ? (
            <ThoughtRecord
              onComplete={onCBTThoughtComplete}
              stepNumber={stepNumber}
              totalSteps={totalSteps}
              onNavigateStep={onCBTStepNavigate}
            />
          ) : null;

        case 'core-belief':
          return onCBTCoreBeliefComplete ? (
            <CoreBelief
              onComplete={onCBTCoreBeliefComplete}
              stepNumber={stepNumber}
              totalSteps={totalSteps}
              onNavigateStep={onCBTStepNavigate}
            />
          ) : null;

        case 'challenge-questions':
          return onCBTChallengeQuestionsComplete ? (
            <ChallengeQuestions
              onComplete={onCBTChallengeQuestionsComplete}
              stepNumber={stepNumber}
              totalSteps={totalSteps}
              onNavigateStep={onCBTStepNavigate}
            />
          ) : null;

        case 'rational-thoughts':
          return onCBTRationalThoughtsComplete ? (
            <RationalThoughts
              onComplete={onCBTRationalThoughtsComplete}
              stepNumber={stepNumber}
              totalSteps={totalSteps}
              onNavigateStep={onCBTStepNavigate}
            />
          ) : null;

        case 'schema-modes':
          return onCBTSchemaModesComplete ? (
            <SchemaModes
              onComplete={onCBTSchemaModesComplete}
              stepNumber={stepNumber}
              totalSteps={totalSteps}
              onNavigateStep={onCBTStepNavigate}
            />
          ) : null;

        case 'final-emotions':
          return (
            <FinalEmotionReflection
              onComplete={onCBTFinalEmotionsComplete}
              onSendToChat={onCBTSendToChat}
              onNavigateStep={onCBTStepNavigate}
            />
          );

        case 'actions':
          return onCBTActionComplete ? (
            <ActionPlan
              onComplete={onCBTActionComplete}
              stepNumber={stepNumber}
              totalSteps={totalSteps}
              onNavigateStep={onCBTStepNavigate}
            />
          ) : null;

        default:
          return renderCompletedStepSummary(step, sessionData, onCBTStepNavigate, isFinalStep);
      }
    },
    [
      activeCBTStep,
      lastStepMessageId,
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
      handleDismissObsessionsFlow,
    ]
  );

  // Render with optional profiling wrapper
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

  // Wrap with React Profiler if profiling is enabled
  if (ENABLE_PROFILING) {
    return (
      <Profiler id="VirtualizedMessageList" onRender={onRenderCallback}>
        {listContent}
      </Profiler>
    );
  }

  return listContent;
}

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="mx-auto mb-2 flex max-w-4xl items-center justify-start py-2" aria-live="polite">
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 shadow-lg">
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        </div>
        <div
          className="flex animate-pulse space-x-2 motion-reduce:animate-none"
          aria-label="Assistant is typing"
        >
          <div className="bg-primary h-2 w-2 animate-bounce rounded-full motion-reduce:animate-none"></div>
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full motion-reduce:animate-none"
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full motion-reduce:animate-none"
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </div>
  );
});

function getMessageDigest(message: MessageData): string {
  if (message.digest) return message.digest;
  const contentKey = `${message.content.length}:${message.content}`;
  const stepKey = message.metadata?.step ?? '';
  return `${message.id}:${contentKey}:${stepKey}`;
}

export const VirtualizedMessageList = memo(
  VirtualizedMessageListComponent,
  (prevProps, nextProps) => {
    if (prevProps.messages === nextProps.messages) {
      return (
        prevProps.isStreaming === nextProps.isStreaming &&
        prevProps.isMobile === nextProps.isMobile &&
        prevProps.maxVisible === nextProps.maxVisible &&
        prevProps.activeCBTStep === nextProps.activeCBTStep &&
        prevProps.onCBTStepNavigate === nextProps.onCBTStepNavigate &&
        prevProps.onUpdateMessageMetadata === nextProps.onUpdateMessageMetadata &&
        prevProps.sessionId === nextProps.sessionId &&
        prevProps.enableVirtualization === nextProps.enableVirtualization
      );
    }

    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    const equalWindow = (windowSize: number) => {
      if (windowSize <= 0) return true;
      const prevSliceStart = Math.max(prevProps.messages.length - windowSize, 0);
      const nextSliceStart = Math.max(nextProps.messages.length - windowSize, 0);
      if (
        prevProps.messages.length - prevSliceStart !==
        nextProps.messages.length - nextSliceStart
      ) {
        return false;
      }
      const prevDigests = new Array(windowSize);
      const nextDigests = new Array(windowSize);
      for (let i = 0; i < windowSize; i += 1) {
        const prevMessage = prevProps.messages[prevSliceStart + i];
        const nextMessage = nextProps.messages[nextSliceStart + i];
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
    };

    const prevVisible = prevProps.maxVisible ?? 50;
    const nextVisible = nextProps.maxVisible ?? 50;
    if (!equalWindow(prevVisible)) return false;
    if (prevVisible !== nextVisible && !equalWindow(nextVisible)) return false;

    return (
      prevProps.isStreaming === nextProps.isStreaming &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.maxVisible === nextProps.maxVisible &&
      prevProps.activeCBTStep === nextProps.activeCBTStep &&
      prevProps.onCBTStepNavigate === nextProps.onCBTStepNavigate &&
      prevProps.onUpdateMessageMetadata === nextProps.onUpdateMessageMetadata &&
      prevProps.sessionId === nextProps.sessionId &&
      prevProps.enableVirtualization === nextProps.enableVirtualization
    );
  }
);

// Export constants for testing
export { VIRTUAL_SCROLL_THRESHOLD, ESTIMATED_MESSAGE_HEIGHT, ESTIMATED_CBT_STEP_HEIGHT };
