'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle } from 'lucide-react';
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
  SchemaMode,
  ObsessionsCompulsionsData,
  CBTStepType,
  SchemaModeData,
} from '@/types';
import type { CBTChatFlowSessionData } from '@/features/therapy/cbt/hooks/use-cbt-chat-experience';
import { CBT_STEP_CONFIG } from '@/features/therapy/cbt/flow';
import { ObsessionsCompulsionsFlow } from '@/features/therapy/obsessions-compulsions/obsessions-compulsions-flow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';

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

type SchemaModeLike = SchemaModeData | SchemaMode;

function isSchemaModeSelected(mode: SchemaModeLike): boolean {
  if ('selected' in mode) return mode.selected;
  if ('intensity' in mode) return mode.intensity > 0;
  return false;
}

function schemaModeLabel(mode: SchemaModeLike, index: number): string {
  if ('label' in mode && typeof mode.label === 'string' && mode.label) return mode.label;
  if ('name' in mode && typeof mode.name === 'string' && mode.name) return mode.name;
  return `Mode ${index + 1}`;
}

function renderEmotionBadges(emotions?: EmotionData | null) {
  if (!emotions) return null;

  const entries = Object.entries(emotions).filter(([, value]) => typeof value === 'number');
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="secondary">
          {key} ({value}/10)
        </Badge>
      ))}
    </div>
  );
}

function renderBulletList<T>(
  items: T[],
  renderItem: (item: T, index: number) => ReactNode,
  className: string
) {
  if (items.length === 0) return null;
  return <ul className={className}>{items.map(renderItem)}</ul>;
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
  const content = getCompletedStepContent(step, sessionData);

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <CheckCircle className="text-primary h-4 w-4" />
              {title}
            </CardTitle>
            {isFinalStep && (
              <p className="text-muted-foreground mt-1 text-xs">Final step in this CBT flow</p>
            )}
          </div>
          {onNavigate && (
            <Button variant="outline" size="sm" onClick={() => onNavigate(step)}>
              View
            </Button>
          )}
        </div>
      </CardHeader>
      {content.length > 0 && <CardContent className="space-y-3">{content}</CardContent>}
    </Card>
  );
}

function getCompletedStepContent(
  step: CBTStepType,
  sessionData: CBTChatFlowSessionData | undefined
): React.ReactNode[] {
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
      const list = renderBulletList(
        thoughts,
        (thought, index) => (
          <li key={`${thought.thought}-${index}`}>
            {thought.thought} ({thought.credibility}/10)
          </li>
        ),
        'text-muted-foreground list-inside list-disc space-y-1 text-sm'
      );
      if (list) content.push(list);
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
      const list = renderBulletList(
        rational,
        (thought, index) => (
          <li key={`${thought.thought}-${index}`}>
            {thought.thought} ({thought.confidence}/10)
          </li>
        ),
        'text-muted-foreground list-inside list-disc space-y-1 text-sm'
      );
      if (list) content.push(list);
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

  return content;
}

function getLastStepMessageId(messages: MessageData[]) {
  const map = new Map<CBTStepType, string>();
  messages.forEach((message) => {
    const step = message.metadata?.step as CBTStepType | undefined;
    if (step && message.id.includes(':component:')) {
      map.set(step, message.id);
    }
  });
  return map;
}

function getObsessionsFlowInitialData(metadata?: Record<string, unknown>) {
  const sessionFlowData = metadata?.sessionData as ObsessionsCompulsionsData | undefined;
  const storedData = metadata?.data as ObsessionsCompulsionsData | undefined;
  return storedData ?? sessionFlowData;
}

function renderStepComponent(
  Component: React.ComponentType<any>,
  onComplete?: (data: any) => void,
  extraProps: Record<string, unknown> = {}
) {
  if (!onComplete) return null;
  return <Component onComplete={onComplete} {...extraProps} />;
}

function getStepContext(
  rawStep: string,
  activeCBTStep: CBTStepType | 'complete' | undefined,
  messageId: string,
  lastStepMessageId: Map<CBTStepType, string>
) {
  const step = rawStep as CBTStepType;
  const isFinalStep = step === 'final-emotions';
  const isActive = activeCBTStep && step === activeCBTStep;
  const allowCompletedSummary = !activeCBTStep;
  const isLatestForStep = messageId === lastStepMessageId.get(step);

  return {
    step,
    isFinalStep,
    isActive,
    allowCompletedSummary,
    isLatestForStep,
  };
}

function renderActiveStepComponent(
  step: CBTStepType,
  stepProps: {
    stepNumber?: number;
    totalSteps?: number;
    onNavigateStep?: (step: CBTStepType) => void;
  },
  navigateStepProps: { onNavigateStep?: (step: CBTStepType) => void },
  handlers: {
    onCBTSituationComplete?: (data: SituationData) => void;
    onCBTEmotionComplete?: (data: EmotionData) => void;
    onCBTThoughtComplete?: (data: ThoughtData[]) => void;
    onCBTCoreBeliefComplete?: (data: CoreBeliefData) => void;
    onCBTChallengeQuestionsComplete?: (data: ChallengeQuestionsData) => void;
    onCBTRationalThoughtsComplete?: (data: RationalThoughtsData) => void;
    onCBTSchemaModesComplete?: (data: SchemaModesData) => void;
    onCBTFinalEmotionsComplete?: (data: EmotionData) => void;
    onCBTActionComplete?: (data: ActionPlanData) => void;
    onCBTSendToChat?: () => void;
  }
) {
  switch (step) {
    case 'situation':
      return renderStepComponent(
        SituationPrompt,
        handlers.onCBTSituationComplete,
        navigateStepProps
      );
    case 'emotions':
      return renderStepComponent(EmotionScale, handlers.onCBTEmotionComplete, navigateStepProps);
    case 'thoughts':
      return renderStepComponent(ThoughtRecord, handlers.onCBTThoughtComplete, stepProps);
    case 'core-belief':
      return renderStepComponent(CoreBelief, handlers.onCBTCoreBeliefComplete, stepProps);
    case 'challenge-questions':
      return renderStepComponent(
        ChallengeQuestions,
        handlers.onCBTChallengeQuestionsComplete,
        stepProps
      );
    case 'rational-thoughts':
      return renderStepComponent(
        RationalThoughts,
        handlers.onCBTRationalThoughtsComplete,
        stepProps
      );
    case 'schema-modes':
      return renderStepComponent(SchemaModes, handlers.onCBTSchemaModesComplete, stepProps);
    case 'final-emotions':
      return renderStepComponent(FinalEmotionReflection, handlers.onCBTFinalEmotionsComplete, {
        onSendToChat: handlers.onCBTSendToChat,
        ...navigateStepProps,
      });
    case 'actions':
      return renderStepComponent(ActionPlan, handlers.onCBTActionComplete, stepProps);
    default:
      return null;
  }
}

function useSafeToast() {
  try {
    return useToast();
  } catch {
    return {
      showToast: () => undefined,
      toasts: [],
      removeToast: () => undefined,
    } as ReturnType<typeof useToast>;
  }
}

export interface CBTMessageRendererOptions {
  filteredMessages: MessageData[];
  activeCBTStep?: CBTStepType | 'complete';
  onCBTStepNavigate?: (step: CBTStepType) => void;
  onCBTSituationComplete?: (data: SituationData) => void;
  onCBTEmotionComplete?: (data: EmotionData) => void;
  onCBTThoughtComplete?: (data: ThoughtData[]) => void;
  onCBTCoreBeliefComplete?: (data: CoreBeliefData) => void;
  onCBTChallengeQuestionsComplete?: (data: ChallengeQuestionsData) => void;
  onCBTRationalThoughtsComplete?: (data: RationalThoughtsData) => void;
  onCBTSchemaModesComplete?: (data: SchemaModesData) => void;
  onCBTSendToChat?: () => void;
  onCBTFinalEmotionsComplete?: (data: EmotionData) => void;
  onCBTActionComplete?: (data: ActionPlanData) => void;
  onUpdateMessageMetadata?: (
    sessionId: string,
    messageId: string,
    metadata: Record<string, unknown>,
    options?: { mergeStrategy?: 'merge' | 'replace' }
  ) => Promise<{ success: boolean; error?: string }>;
  sessionId?: string;
}

export function useCBTMessageRenderer({
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
}: CBTMessageRendererOptions) {
  const { showToast } = useSafeToast();
  const t = useTranslations('toast');

  const lastStepMessageId = useMemo(
    () => getLastStepMessageId(filteredMessages),
    [filteredMessages]
  );

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

  const renderObsessionsFlow = useCallback(
    (message: MessageData) => {
      if (!sessionId || !onUpdateMessageMetadata) {
        return null;
      }

      const metadata = (message.metadata as Record<string, unknown> | undefined) ?? undefined;
      const initialData = getObsessionsFlowInitialData(metadata);

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
    },
    [handleDismissObsessionsFlow, onUpdateMessageMetadata, sessionId, showToast, t]
  );

  const renderCBTComponent = useCallback(
    (message: MessageData) => {
      const rawStep = message.metadata?.step;
      const stepNumber = message.metadata?.stepNumber;
      const totalSteps = message.metadata?.totalSteps;
      const sessionData = message.metadata?.sessionData as CBTChatFlowSessionData | undefined;

      if (!rawStep || typeof rawStep !== 'string') return null;

      const stepProps = {
        stepNumber,
        totalSteps,
        onNavigateStep: onCBTStepNavigate,
      };
      const navigateStepProps = { onNavigateStep: onCBTStepNavigate };

      if (rawStep === 'obsessions-compulsions') {
        return renderObsessionsFlow(message);
      }

      const { step, isFinalStep, isActive, allowCompletedSummary, isLatestForStep } =
        getStepContext(rawStep, activeCBTStep, message.id, lastStepMessageId);

      if (!isLatestForStep) {
        return null;
      }

      if (!isActive) {
        return allowCompletedSummary
          ? renderCompletedStepSummary(step, sessionData, onCBTStepNavigate, isFinalStep)
          : null;
      }

      const activeComponent = renderActiveStepComponent(step, stepProps, navigateStepProps, {
        onCBTSituationComplete,
        onCBTEmotionComplete,
        onCBTThoughtComplete,
        onCBTCoreBeliefComplete,
        onCBTChallengeQuestionsComplete,
        onCBTRationalThoughtsComplete,
        onCBTSchemaModesComplete,
        onCBTFinalEmotionsComplete,
        onCBTActionComplete,
        onCBTSendToChat,
      });

      return (
        activeComponent ??
        renderCompletedStepSummary(step, sessionData, onCBTStepNavigate, isFinalStep)
      );
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
      renderObsessionsFlow,
    ]
  );

  return { renderCBTComponent };
}
