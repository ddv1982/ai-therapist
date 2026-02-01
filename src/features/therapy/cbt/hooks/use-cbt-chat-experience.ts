'use client';

import { useCallback, useMemo, useReducer } from 'react';
import { useLocale } from 'next-intl';
import type { CBTSessionSummaryData } from '@/features/therapy/components/cbt-session-summary-card';
import { generateUUID } from '@/lib/utils/helpers';
import {
  createInitialState,
  selectCurrentStep,
  selectTimelineMessages,
  toSessionSnapshot,
  transition,
  type CBTFlowEvent,
  type CBTFlowMessageDescriptor,
  type CBTFlowState,
  type CBTStepId,
  type CBTSessionSnapshot,
} from '@/features/therapy/cbt/flow';
import {
  buildMarkdownSummary,
  buildSummaryCardFromState,
} from '@/features/therapy/cbt/flow/summary';
import type { Locale } from '@/i18n/routing';
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

export type CBTChatMessage = CBTFlowMessageDescriptor;

export type CBTChatFlowSessionData = CBTSessionSnapshot;

interface StepCompleteHandlers {
  completeSituationStep: (data: SituationData) => void;
  completeEmotionStep: (data: EmotionData) => void;
  completeThoughtStep: (data: ThoughtData[]) => void;
  completeCoreBeliefStep: (data: CoreBeliefData) => void;
  completeChallengeQuestionsStep: (data: ChallengeQuestionsData) => void;
  completeRationalThoughtsStep: (data: RationalThoughtsData) => void;
  completeSchemaModesStep: (data: SchemaModesData) => void;
  completeActionStep: (data: ActionPlanData) => void;
  completeFinalEmotionsStep: (data: EmotionData) => void;
}

export interface UseCBTChatExperienceReturn extends StepCompleteHandlers {
  isActive: boolean;
  currentStep: CBTStepId | 'complete';
  flowState: CBTFlowState;
  sessionData: CBTChatFlowSessionData;
  cbtMessages: CBTChatMessage[];
  startCBTSession: () => void;
  goToStep: (step: CBTStepId | 'complete') => void;
  generateFinalSummary: () => string;
  generateTherapeuticSummaryCard: () => CBTSessionSummaryData;
  resetSession: () => void;
}

type StepMap = {
  situation: SituationData;
  emotions: EmotionData;
  thoughts: ThoughtData[];
  'core-belief': CoreBeliefData;
  'challenge-questions': ChallengeQuestionsData;
  'rational-thoughts': RationalThoughtsData;
  'schema-modes': SchemaModesData;
  actions: ActionPlanData;
  'final-emotions': EmotionData;
};

export function useCBTChatExperience(): UseCBTChatExperienceReturn {
  const locale = useLocale() as Locale;
  const [flowState, dispatch] = useReducer(transition, undefined, createInitialState);

  const isActive = flowState.status !== 'idle';
  const currentStep = selectCurrentStep(flowState);
  const sessionData = useMemo(() => toSessionSnapshot(flowState), [flowState]);
  const cbtMessages = useMemo(() => selectTimelineMessages(flowState), [flowState]);

  const startCBTSession = useCallback(() => {
    dispatch({ type: 'SESSION_START', sessionId: `cbt-${generateUUID()}` });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const completeStep = useCallback(<K extends keyof StepMap>(stepId: K, payload: StepMap[K]) => {
    dispatch({ type: 'COMPLETE_STEP', stepId, payload } as CBTFlowEvent);
  }, []);

  const goToStep = useCallback((stepId: CBTStepId | 'complete') => {
    dispatch({ type: 'GO_TO_STEP', stepId } as CBTFlowEvent);
  }, []);

  const handlers: StepCompleteHandlers = useMemo(
    () => ({
      completeSituationStep: (data) => completeStep('situation', data),
      completeEmotionStep: (data) => completeStep('emotions', data),
      completeThoughtStep: (data) => completeStep('thoughts', data),
      completeCoreBeliefStep: (data) => completeStep('core-belief', data),
      completeChallengeQuestionsStep: (data) => completeStep('challenge-questions', data),
      completeRationalThoughtsStep: (data) => completeStep('rational-thoughts', data),
      completeSchemaModesStep: (data) => completeStep('schema-modes', data),
      completeActionStep: (data) => completeStep('actions', data),
      completeFinalEmotionsStep: (data) => completeStep('final-emotions', data),
    }),
    [completeStep]
  );

  const generateFinalSummary = useCallback(
    () => buildMarkdownSummary(flowState, locale),
    [flowState, locale]
  );
  const generateTherapeuticSummaryCard = useCallback(
    () => buildSummaryCardFromState(flowState, locale),
    [flowState, locale]
  );

  return {
    isActive,
    currentStep,
    flowState,
    sessionData,
    cbtMessages,
    startCBTSession,
    goToStep,
    generateFinalSummary,
    generateTherapeuticSummaryCard,
    resetSession,
    ...handlers,
  };
}

// Backward compatibility export
