/**
 * Simplified CBT Data Management Hook
 *
 * Replaces the complex 693-line CBT data manager with focused, simple hooks.
 */

'use client';

import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import {
  updateSituation,
  updateEmotions,
  updateThoughts,
  updateCoreBeliefs,
  updateChallengeQuestions,
  updateRationalThoughts,
  updateSchemaModes,
  updateActionPlan,
  clearSession,
  startSession
} from '@/store/slices/cbt-session.slice';
import type {
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionData,
  RationalThoughtData,
  SchemaModeData,
  ActionPlanData
} from '@/types/therapy';

export function useCBTData() {
  const sessionData = useSelector((state: RootState) => state.cbtSession);
  const dispatch = useDispatch();

  return useMemo(() => ({
    // Current session data
    sessionData,

    // Computed properties
    hasData: !!(
      sessionData.situation ||
      (sessionData.emotions && Object.values(sessionData.emotions).some(value => value !== undefined && typeof value === 'number' && value > 0)) ||
      sessionData.thoughts.length > 0 ||
      sessionData.coreBeliefs.length > 0
    ),

    isComplete: !!(
      sessionData.situation &&
      sessionData.emotions &&
      sessionData.thoughts.length > 0
    ),

    // Actions
    updateSituation: (data: SituationData) => dispatch(updateSituation(data)),
    updateEmotions: (data: EmotionData) => dispatch(updateEmotions(data)),
    updateThoughts: (data: ThoughtData[]) => dispatch(updateThoughts(data)),
    updateCoreBeliefs: (data: CoreBeliefData[]) => dispatch(updateCoreBeliefs(data)),
    updateChallengeQuestions: (data: ChallengeQuestionData[]) => dispatch(updateChallengeQuestions(data)),
    updateRationalThoughts: (data: RationalThoughtData[]) => dispatch(updateRationalThoughts(data)),
    updateSchemaModes: (data: SchemaModeData[]) => dispatch(updateSchemaModes(data)),
    updateActionPlan: (data: ActionPlanData) => dispatch(updateActionPlan(data)),

    // Session management
    startSession: (sessionId: string) => dispatch(startSession({ sessionId })),
    clearSession: () => dispatch(clearSession()),
  }), [sessionData, dispatch]);
}

/**
 * Hook for just CBT emotions
 */
export function useCBTEmotions() {
  const emotions = useSelector((state: RootState) => state.cbtSession.emotions);
  const dispatch = useDispatch();

  return useMemo(() => ({
    emotions,
    updateEmotions: (data: EmotionData) => dispatch(updateEmotions(data)),
    hasEmotions: !!emotions && Object.values(emotions).some(value => value !== undefined && typeof value === 'number' && value > 0),
  }), [emotions, dispatch]);
}

/**
 * Hook for just CBT thoughts
 */
export function useCBTThoughts() {
  const thoughts = useSelector((state: RootState) => state.cbtSession.thoughts);
  const dispatch = useDispatch();

  return useMemo(() => ({
    thoughts,
    updateThoughts: (data: ThoughtData[]) => dispatch(updateThoughts(data)),
    hasThoughts: thoughts.length > 0,
  }), [thoughts, dispatch]);
}

/**
 * Hook for CBT session metadata
 */
export function useCBTSession() {
  const sessionData = useSelector((state: RootState) => ({
    sessionId: state.cbtSession.sessionId,
    currentStep: state.cbtSession.currentStep,
    isSubmitting: state.cbtSession.isSubmitting,
    startedAt: state.cbtSession.startedAt,
    lastModified: state.cbtSession.lastModified,
  }));

  return sessionData;
}
