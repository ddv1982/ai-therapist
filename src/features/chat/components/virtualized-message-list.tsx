'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { CheckCircle, Heart } from 'lucide-react';
import { Message, type MessageData } from '@/features/chat/messages';
import {
  SituationPrompt,
  EmotionScale,
  ThoughtRecord,
  CoreBelief,
  ChallengeQuestions,
  RationalThoughts,
  SchemaModes,
  FinalEmotionReflection,
  ActionPlan
} from '@/features/therapy/cbt/chat-components';
import { ObsessionsCompulsionsFlow } from '@/features/therapy/obsessions-compulsions/obsessions-compulsions-flow';
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
} from '@/types/therapy';
import type { CBTChatFlowSessionData } from '@/features/therapy/cbt/hooks/use-cbt-chat-experience';
import { CBT_STEP_CONFIG } from '@/features/therapy/cbt/flow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';

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
        content.push(<p key="situation" className="text-sm text-foreground">{situation.situation}</p>);
      }
      if (situation?.date) {
        const formatted = new Date(situation.date).toLocaleDateString();
        content.push(
          <p key="date" className="text-xs text-muted-foreground">
            Date: {formatted}
          </p>,
        );
      }
      break;
    }
    case 'emotions':
      content.push(
        <div key="emotions" className="text-sm text-muted-foreground">
          {renderEmotionBadges(sessionData?.emotionData)}
        </div>,
      );
      break;
    case 'thoughts': {
      const thoughts = sessionData?.thoughtData ?? [];
      if (thoughts.length > 0) {
        content.push(
          <ul key="thoughts" className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {thoughts.map((thought, index) => (
              <li key={`${thought.thought}-${index}`}>
                {thought.thought} ({thought.credibility}/10)
              </li>
            ))}
          </ul>,
        );
      }
      break;
    }
    case 'core-belief': {
      const coreBelief = sessionData?.coreBeliefData;
      if (coreBelief) {
        content.push(
          <p key="core-belief" className="text-sm text-muted-foreground">
            “{coreBelief.coreBeliefText}” ({coreBelief.coreBeliefCredibility}/10)
          </p>,
        );
      }
      break;
    }
    case 'challenge-questions': {
      const questions = sessionData?.challengeQuestionsData?.challengeQuestions ?? [];
      if (questions.length > 0) {
        content.push(
          <ul key="challenge" className="space-y-2 text-sm text-muted-foreground">
            {questions.map((item, index) => (
              <li key={`${item.question}-${index}`}>
                <span className="font-medium">{item.question}</span>
                <br />
                <span>{item.answer}</span>
              </li>
            ))}
          </ul>,
        );
      }
      break;
    }
    case 'rational-thoughts': {
      const rational = sessionData?.rationalThoughtsData?.rationalThoughts ?? [];
      if (rational.length > 0) {
        content.push(
          <ul key="rational" className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {rational.map((thought, index) => (
              <li key={`${thought.thought}-${index}`}>
                {thought.thought} ({thought.confidence}/10)
              </li>
            ))}
          </ul>,
        );
      }
      break;
    }
    case 'schema-modes': {
      const modes = sessionData?.schemaModesData?.selectedModes?.filter((mode) =>
        isSchemaModeSelected(mode),
      ) ?? [];
      if (modes.length > 0) {
        content.push(
          <div key="schema" className="flex flex-wrap gap-2">
            {modes.map((mode, index) => (
              <Badge key={`${schemaModeLabel(mode, index)}-${index}`} variant="secondary">
                {schemaModeLabel(mode, index)}
                {typeof mode.intensity === 'number' ? ` (${mode.intensity}/10)` : ''}
              </Badge>
            ))}
          </div>,
        );
      }
      break;
    }
    case 'actions': {
      const actionPlan = sessionData?.actionData;
      if (actionPlan?.newBehaviors) {
        content.push(
          <p key="actions" className="text-sm text-muted-foreground">
            {actionPlan.newBehaviors}
          </p>,
        );
      }
      const finalEmotions = renderEmotionBadges(actionPlan?.finalEmotions);
      if (finalEmotions) {
        content.push(
          <div key="action-emotions" className="text-sm text-muted-foreground">
            {finalEmotions}
          </div>,
        );
      }
      break;
    }
    case 'final-emotions': {
      const final = renderEmotionBadges(sessionData?.actionData?.finalEmotions);
      if (final) {
        content.push(
          <div key="final-emotions" className="text-sm text-muted-foreground">
            {final}
          </div>,
        );
      }
      break;
    }
    default:
      break;
  }

  return (
    <Card className="border border-muted/50 bg-muted/30">
      <CardHeader className="py-3 flex flex-row items-center gap-2">
        <CheckCircle className="w-4 h-4 text-primary" />
        <CardTitle className="text-sm font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {content.length > 0 ? content : (
          <p className="text-sm text-muted-foreground">Completed.</p>
        )}
        {onNavigate ? (
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

interface VirtualizedMessageListProps {
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
  onObsessionsCompulsionsComplete?: (data: ObsessionsCompulsionsData) => void;
  onUpdateMessageMetadata?: (
    sessionId: string,
    messageId: string,
    metadata: Record<string, unknown>,
    options?: { mergeStrategy?: 'merge' | 'replace' }
  ) => Promise<{ success: boolean; error?: string }>;
  sessionId?: string;
}

// Simple virtualization - only render visible and near-visible messages
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
  onObsessionsCompulsionsComplete,
  onUpdateMessageMetadata,
  sessionId,
}: VirtualizedMessageListProps) {
  const { showToast } = useSafeToast();
  const t = useTranslations('toast');
  // For conversations with many messages, only render the most recent ones to improve performance
  const visibleMessages = useMemo(() => {
    if (messages.length <= maxVisible) {
      // For shorter conversations, render all messages
      return messages;
    }

    // For longer conversations, show only the most recent window of messages
    // This prevents the DOM from getting too heavy
    return messages.slice(-maxVisible);
  }, [messages, maxVisible]);

  const lastStepMessageId = useMemo(() => {
    const map = new Map<CBTStepType, string>();
    visibleMessages.forEach((message) => {
      const step = message.metadata?.step as CBTStepType | undefined;
      if (step) {
        map.set(step, message.id);
      }
    });
    return map;
  }, [visibleMessages]);

  const containerClassName = useMemo(() => 
    `max-w-4xl mx-auto ${isMobile ? 'space-y-3 pb-6' : 'space-y-6 pb-12'}`,
    [isMobile]
  );

  const handleDismissObsessionsFlow = useCallback(async (messageId: string) => {
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
  }, [sessionId, onUpdateMessageMetadata, showToast, t]);

  // Function to render CBT components based on step
  const renderCBTComponent = (message: MessageData) => {
    const rawStep = message.metadata?.step;
    const stepNumber = message.metadata?.stepNumber;
    const totalSteps = message.metadata?.totalSteps;
    const sessionData = message.metadata?.sessionData as CBTChatFlowSessionData | undefined;

    if (!rawStep || typeof rawStep !== 'string') return null;

    if (rawStep === 'obsessions-compulsions') {
      if (!onObsessionsCompulsionsComplete) {
        return null;
      }

      const metadata = (message.metadata as Record<string, unknown> | undefined) ?? undefined;
      const sessionFlowData = metadata?.sessionData as ObsessionsCompulsionsData | undefined;
      const storedData = metadata?.data as ObsessionsCompulsionsData | undefined;
      const initialData = storedData ?? sessionFlowData;

      return (
        <ObsessionsCompulsionsFlow
          onComplete={async (data) => {
            if (sessionId && onUpdateMessageMetadata) {
              await onUpdateMessageMetadata(sessionId, message.id, {
                step: 'obsessions-compulsions',
                data,
                dismissed: false,
                dismissedReason: null,
              }, { mergeStrategy: 'merge' });
            }
            await onObsessionsCompulsionsComplete(data);
          }}
          onDismiss={() => handleDismissObsessionsFlow(message.id)}
          initialData={initialData}
        />
      );
    }

    const step = rawStep as CBTStepType;
    const isActive = activeCBTStep && step === activeCBTStep;
    const isLatestForStep = message.id === lastStepMessageId.get(step);

    if (!isLatestForStep) {
      return null;
    }

    if (!isActive) {
      return renderCompletedStepSummary(step, sessionData, onCBTStepNavigate);
    }

    switch (step) {
      case 'situation':
        return onCBTSituationComplete ? (
          <SituationPrompt
            onComplete={onCBTSituationComplete}
          />
        ) : null;

      case 'emotions':
        return onCBTEmotionComplete ? (
          <EmotionScale
            onComplete={onCBTEmotionComplete}
          />
        ) : null;

      case 'thoughts':
        return onCBTThoughtComplete ? (
          <ThoughtRecord
            onComplete={onCBTThoughtComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'core-belief':
        return onCBTCoreBeliefComplete ? (
          <CoreBelief
            onComplete={onCBTCoreBeliefComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'challenge-questions':
        return onCBTChallengeQuestionsComplete ? (
          <ChallengeQuestions
            onComplete={onCBTChallengeQuestionsComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'rational-thoughts':
        return onCBTRationalThoughtsComplete ? (
          <RationalThoughts
            onComplete={onCBTRationalThoughtsComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'schema-modes':
        return onCBTSchemaModesComplete ? (
          <SchemaModes
            onComplete={onCBTSchemaModesComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'final-emotions':
        return (
          <FinalEmotionReflection 
            onComplete={onCBTFinalEmotionsComplete}
            onSendToChat={onCBTSendToChat}
          />
        );

      case 'actions':
        return onCBTActionComplete ? (
          <ActionPlan
            onComplete={onCBTActionComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      default:
        return renderCompletedStepSummary(step, sessionData, onCBTStepNavigate);
    }
  };

  return (
    <div
      className={containerClassName}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {visibleMessages.map((message, index) => {
        const metadata = (message.metadata as Record<string, unknown> | undefined) ?? undefined;
        const isDismissed = Boolean(metadata?.dismissed);

        if (isDismissed) {
          return null;
        }

        if (!metadata?.step && metadata?.type === 'obsessions-compulsions-table') {
          return null;
        }

        const isLastMessage = index === visibleMessages.length - 1;
        const isAssistantMessage = message.role === 'assistant';
        const shouldShowTypingIndicator = isStreaming && isLastMessage && isAssistantMessage && message.content === '';

        return (
          <div key={message.id}>
            {shouldShowTypingIndicator && <TypingIndicator />}

            {metadata?.step ? (
              <div
                role="article"
                aria-label={`CBT ${metadata.step} step`}
              >
                {renderCBTComponent(message)}
              </div>
            ) : message.content && (
              <div
                role="article"
                aria-label={`Message from ${message.role}`}
              >
                <Message message={message} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex justify-start items-center py-2 mb-2 max-w-4xl mx-auto" aria-live="polite">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 shadow-lg flex items-center justify-center">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
        </div>
        <div className="flex space-x-2 animate-pulse" aria-label="Assistant is typing">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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

export const VirtualizedMessageList = memo(VirtualizedMessageListComponent, (prevProps, nextProps) => {
  if (prevProps.messages === nextProps.messages) {
    return (
      prevProps.isStreaming === nextProps.isStreaming &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.maxVisible === nextProps.maxVisible &&
      prevProps.activeCBTStep === nextProps.activeCBTStep &&
      prevProps.onCBTStepNavigate === nextProps.onCBTStepNavigate &&
      prevProps.onObsessionsCompulsionsComplete === nextProps.onObsessionsCompulsionsComplete &&
      prevProps.onUpdateMessageMetadata === nextProps.onUpdateMessageMetadata &&
      prevProps.sessionId === nextProps.sessionId
    );
  }

  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }

  const equalWindow = (windowSize: number) => {
    if (windowSize <= 0) return true;
    const prevSliceStart = Math.max(prevProps.messages.length - windowSize, 0);
    const nextSliceStart = Math.max(nextProps.messages.length - windowSize, 0);
    if (prevProps.messages.length - prevSliceStart !== nextProps.messages.length - nextSliceStart) {
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
    prevProps.onObsessionsCompulsionsComplete === nextProps.onObsessionsCompulsionsComplete &&
    prevProps.onUpdateMessageMetadata === nextProps.onUpdateMessageMetadata &&
    prevProps.sessionId === nextProps.sessionId
  );
});
