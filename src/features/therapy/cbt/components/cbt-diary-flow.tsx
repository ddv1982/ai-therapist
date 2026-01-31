'use client';

import { useCallback, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePersistedCBTFlow } from '@/features/therapy/cbt/hooks/use-persisted-cbt-flow';
import type { CBTSessionData } from '@/features/therapy/cbt/hooks/use-cbt-flow';
import type { CBTStepId } from '@/features/therapy/cbt/flow/types';
import type {
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData,
  ActionPlanData,
} from '@/types';

import { SituationPrompt } from '@/features/therapy/cbt/chat-components/situation-prompt';
import { EmotionScale } from '@/features/therapy/cbt/chat-components/emotion-scale';
import { ThoughtRecord } from '@/features/therapy/cbt/chat-components/thought-record';
import { CoreBelief } from '@/features/therapy/cbt/chat-components/core-belief';
import { ChallengeQuestions } from '@/features/therapy/cbt/chat-components/challenge-questions';
import { RationalThoughts } from '@/features/therapy/cbt/chat-components/rational-thoughts';
import { SchemaModes } from '@/features/therapy/cbt/chat-components/schema-modes';
import { ActionPlan } from '@/features/therapy/cbt/chat-components/action-plan';
import { FinalEmotionReflection } from '@/features/therapy/cbt/chat-components/final-emotion-reflection';

interface CBTDiaryFlowProps {
  /** Skip loading from localStorage (for "Start Fresh" scenario) */
  skipHydration?: boolean;
  onChange?: (data: CBTSessionData) => Promise<void> | void;
  onComplete?: (data: CBTSessionData) => Promise<void> | void;
  onSendToChat?: () => void;
  className?: string;
}

export function CBTDiaryFlow({
  skipHydration = false,
  onChange,
  onComplete,
  onSendToChat,
  className,
}: CBTDiaryFlowProps) {
  const t = useTranslations('cbt');
  const [isPending, startTransition] = useTransition();

  const {
    currentStep,
    sessionData,
    progress,
    isSaving,
    error,
    hydrationError,
    goPrevious,
    goToStep,
    canGoBack,
    updateStep,
    completeStep,
    clearError,
    reset,
  } = usePersistedCBTFlow({ skipHydration, onChange });

  const isDisabled = isSaving || isPending;

  const handleFinalComplete = useCallback(async () => {
    if (onComplete) {
      await onComplete(sessionData);
    }
    if (onSendToChat) {
      onSendToChat();
    }
  }, [onComplete, onSendToChat, sessionData]);

  const createStepHandlers = useCallback(
    <T,>(stepId: CBTStepId) => ({
      onChange: (data: T) => {
        startTransition(() => {
          void updateStep(stepId, data);
        });
      },
      onComplete: (data: T) => {
        startTransition(() => {
          void completeStep(stepId, data);
        });
      },
      onNavigateStep: goToStep,
    }),
    [updateStep, completeStep, goToStep]
  );

  const renderProgress = () => {
    const percentage = (progress.currentStepNumber / progress.totalSteps) * 100;
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('progress.status', {
              step: progress.currentStepNumber,
              total: progress.totalSteps,
            })}
          </span>
          {isSaving && (
            <span className="text-muted-foreground animate-pulse text-xs">
              {t('status.saving')}
            </span>
          )}
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="bg-destructive/10 border-destructive/20 mb-4 flex items-center gap-2 rounded-md border p-3">
        <AlertCircle className="text-destructive h-4 w-4 shrink-0" />
        <p className="text-destructive text-sm">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearError}
          className="text-destructive hover:bg-destructive/20 ml-auto h-6 px-2"
        >
          {t('actions.dismiss')}
        </Button>
      </div>
    );
  };

  const renderHydrationError = () => {
    if (!hydrationError) return null;
    return (
      <div className="border-destructive/20 bg-destructive/10 mb-4 flex items-center gap-2 rounded-md border p-3">
        <AlertCircle className="text-destructive h-4 w-4 shrink-0" />
        <div className="text-destructive text-sm">
          <p className="font-medium">Saved draft could not be decrypted.</p>
          <p className="text-destructive/80">You can clear the saved draft and start fresh.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="text-destructive hover:bg-destructive/20 ml-auto h-6 px-2"
        >
          Clear draft
        </Button>
      </div>
    );
  };

  const renderBackButton = () => {
    if (!canGoBack) return null;
    return (
      <Button variant="ghost" size="sm" onClick={goPrevious} disabled={isDisabled} className="mb-4">
        <ChevronLeft className="mr-1 h-4 w-4" />
        {t('nav.back')}
      </Button>
    );
  };

  const renderCurrentStep = () => {
    if (currentStep === 'complete') {
      return (
        <div className="py-8 text-center">
          <h2 className="text-2xl font-semibold">{t('complete.title')}</h2>
          <p className="text-muted-foreground mt-2">{t('complete.subtitle')}</p>
        </div>
      );
    }

    const baseProps = {
      stepNumber: progress.currentStepNumber,
      totalSteps: progress.totalSteps,
    };

    switch (currentStep) {
      case 'situation':
        return (
          <SituationPrompt
            value={sessionData.situation}
            {...createStepHandlers<SituationData>('situation')}
            {...baseProps}
          />
        );

      case 'emotions':
        return (
          <EmotionScale
            value={sessionData.emotions}
            {...createStepHandlers<EmotionData>('emotions')}
            {...baseProps}
          />
        );

      case 'thoughts':
        return (
          <ThoughtRecord
            value={sessionData.thoughts}
            {...createStepHandlers<ThoughtData[]>('thoughts')}
            {...baseProps}
          />
        );

      case 'core-belief':
        return (
          <CoreBelief
            value={sessionData.coreBelief}
            {...createStepHandlers<CoreBeliefData>('core-belief')}
            {...baseProps}
          />
        );

      case 'challenge-questions':
        return (
          <ChallengeQuestions
            value={sessionData.challengeQuestions}
            coreBeliefText={sessionData.coreBelief?.coreBeliefText}
            {...createStepHandlers<ChallengeQuestionsData>('challenge-questions')}
            {...baseProps}
          />
        );

      case 'rational-thoughts':
        return (
          <RationalThoughts
            value={sessionData.rationalThoughts}
            coreBeliefText={sessionData.coreBelief?.coreBeliefText}
            {...createStepHandlers<RationalThoughtsData>('rational-thoughts')}
            {...baseProps}
          />
        );

      case 'schema-modes':
        return (
          <SchemaModes
            value={sessionData.schemaModes}
            {...createStepHandlers<SchemaModesData>('schema-modes')}
            {...baseProps}
          />
        );

      case 'actions':
        return (
          <ActionPlan
            value={sessionData.actionPlan}
            initialEmotions={sessionData.emotions ?? undefined}
            {...createStepHandlers<ActionPlanData>('actions')}
            {...baseProps}
          />
        );

      case 'final-emotions':
        return (
          <FinalEmotionReflection
            value={sessionData.finalEmotions}
            {...createStepHandlers<EmotionData>('final-emotions')}
            onSendToChat={handleFinalComplete}
            {...baseProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {renderProgress()}
      {renderHydrationError()}
      {renderError()}
      {renderBackButton()}
      {renderCurrentStep()}
    </div>
  );
}
