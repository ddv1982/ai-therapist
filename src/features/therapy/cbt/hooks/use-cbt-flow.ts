import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
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
import { CBT_STEP_ORDER, type CBTStepId } from '@/features/therapy/cbt/flow/types';

export interface CBTSessionData {
  situation: SituationData | null;
  emotions: EmotionData | null;
  thoughts: ThoughtData[];
  coreBelief: CoreBeliefData | null;
  challengeQuestions: ChallengeQuestionsData | null;
  rationalThoughts: RationalThoughtsData | null;
  schemaModes: SchemaModesData | null;
  actionPlan: ActionPlanData | null;
  finalEmotions: EmotionData | null;
  lastModified: string;
}

export type SessionDataField = keyof Omit<CBTSessionData, 'lastModified'>;

export const STEP_TO_FIELD_MAP: Record<CBTStepId, SessionDataField> = {
  situation: 'situation',
  emotions: 'emotions',
  thoughts: 'thoughts',
  'core-belief': 'coreBelief',
  'challenge-questions': 'challengeQuestions',
  'rational-thoughts': 'rationalThoughts',
  'schema-modes': 'schemaModes',
  actions: 'actionPlan',
  'final-emotions': 'finalEmotions',
};

const EMPTY_SESSION_DATA: CBTSessionData = {
  situation: null,
  emotions: null,
  thoughts: [],
  coreBelief: null,
  challengeQuestions: null,
  rationalThoughts: null,
  schemaModes: null,
  actionPlan: null,
  finalEmotions: null,
  lastModified: new Date(0).toISOString(),
};

interface FlowState {
  currentStep: CBTStepId | 'complete';
  sessionData: CBTSessionData;
  completedSteps: Set<CBTStepId>;
  isSaving: boolean;
  error: string | null;
}

type FlowAction =
  | { type: 'GO_TO_STEP'; step: CBTStepId | 'complete' }
  | { type: 'GO_NEXT' }
  | { type: 'GO_PREVIOUS' }
  | { type: 'UPDATE_STEP'; stepId: CBTStepId; data: unknown }
  | { type: 'COMPLETE_STEP'; stepId: CBTStepId; data: unknown }
  | { type: 'SET_SAVING'; isSaving: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SYNC_DATA'; data: Partial<CBTSessionData> }
  | { type: 'RESET' };

function getNextStep(current: CBTStepId): CBTStepId | 'complete' {
  const index = CBT_STEP_ORDER.indexOf(current);
  if (index === -1 || index >= CBT_STEP_ORDER.length - 1) return 'complete';
  return CBT_STEP_ORDER[index + 1];
}

function getPreviousStep(current: CBTStepId | 'complete'): CBTStepId | null {
  if (current === 'complete') return CBT_STEP_ORDER[CBT_STEP_ORDER.length - 1];
  const index = CBT_STEP_ORDER.indexOf(current);
  if (index <= 0) return null;
  return CBT_STEP_ORDER[index - 1];
}

function getStepNumber(step: CBTStepId | 'complete'): number {
  if (step === 'complete') return CBT_STEP_ORDER.length + 1;
  const index = CBT_STEP_ORDER.indexOf(step);
  return index === -1 ? 1 : index + 1;
}

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.step };

    case 'GO_NEXT': {
      if (state.currentStep === 'complete') return state;
      const next = getNextStep(state.currentStep);
      return { ...state, currentStep: next };
    }

    case 'GO_PREVIOUS': {
      const prev = getPreviousStep(state.currentStep);
      if (!prev) return state;
      return { ...state, currentStep: prev };
    }

    case 'UPDATE_STEP': {
      const field = STEP_TO_FIELD_MAP[action.stepId];
      return {
        ...state,
        sessionData: {
          ...state.sessionData,
          [field]: action.data,
          lastModified: new Date().toISOString(),
        },
      };
    }

    case 'COMPLETE_STEP': {
      if (state.currentStep === 'complete') return state;
      const field = STEP_TO_FIELD_MAP[action.stepId];
      const next = getNextStep(state.currentStep);
      return {
        ...state,
        currentStep: next,
        sessionData: {
          ...state.sessionData,
          [field]: action.data,
          lastModified: new Date().toISOString(),
        },
        completedSteps: new Set([...state.completedSteps, action.stepId]),
      };
    }

    case 'SET_SAVING':
      return { ...state, isSaving: action.isSaving };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SYNC_DATA':
      return {
        ...state,
        sessionData: {
          ...state.sessionData,
          ...action.data,
          lastModified: action.data.lastModified ?? state.sessionData.lastModified,
        },
      };

    case 'RESET':
      return {
        currentStep: 'situation',
        sessionData: { ...EMPTY_SESSION_DATA, lastModified: new Date().toISOString() },
        completedSteps: new Set(),
        isSaving: false,
        error: null,
      };

    default:
      return state;
  }
}

/**
 * Check if step data exists and has meaningful content.
 * - Arrays: must have length > 0
 * - Objects: must have at least one non-empty value
 * - Primitives: must not be null/undefined
 * @internal Exported for testing
 */
export function hasStepData(data: Partial<CBTSessionData> | undefined, stepId: CBTStepId): boolean {
  if (!data) return false;
  const field = STEP_TO_FIELD_MAP[stepId];
  const value = data[field];
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    // Check if object has meaningful data (not just empty strings)
    return Object.values(value).some((v) => v !== '' && v !== null && v !== undefined);
  }
  return true;
}

/**
 * Compute the starting step and completed steps from initial session data.
 * Walks through steps in order and finds the first incomplete step.
 * @internal Exported for testing
 */
export function computeStartingStep(initialData?: Partial<CBTSessionData>): {
  startStep: CBTStepId;
  completedSteps: Set<CBTStepId>;
} {
  if (!initialData) {
    return { startStep: 'situation', completedSteps: new Set() };
  }

  const completedSteps = new Set<CBTStepId>();
  let startStep: CBTStepId = 'situation';

  // Walk through steps in order and find first incomplete step
  for (const stepId of CBT_STEP_ORDER) {
    if (hasStepData(initialData, stepId)) {
      completedSteps.add(stepId);
      // Move to next step
      const nextIndex = CBT_STEP_ORDER.indexOf(stepId) + 1;
      if (nextIndex < CBT_STEP_ORDER.length) {
        startStep = CBT_STEP_ORDER[nextIndex];
      }
    } else {
      // Found first incomplete step
      startStep = stepId;
      break;
    }
  }

  return { startStep, completedSteps };
}

function createInitialState(initialData?: Partial<CBTSessionData>): FlowState {
  const { startStep, completedSteps } = computeStartingStep(initialData);

  return {
    currentStep: startStep,
    sessionData: {
      ...EMPTY_SESSION_DATA,
      ...initialData,
      lastModified: initialData?.lastModified ?? new Date().toISOString(),
    },
    completedSteps,
    isSaving: false,
    error: null,
  };
}

interface UseCBTFlowOptions {
  initialData?: Partial<CBTSessionData>;
  onChange?: (data: CBTSessionData) => Promise<void> | void;
}

export function useCBTFlow({ initialData, onChange }: UseCBTFlowOptions = {}) {
  const [state, dispatch] = useReducer(flowReducer, initialData, createInitialState);
  const { currentStep, sessionData, completedSteps, isSaving, error } = state;

  const prevLastModifiedRef = useRef<string | undefined>(initialData?.lastModified);

  useEffect(() => {
    if (!initialData?.lastModified) return;
    const dataChanged = prevLastModifiedRef.current !== initialData.lastModified;
    prevLastModifiedRef.current = initialData.lastModified;
    if (!dataChanged) return;
    dispatch({ type: 'SYNC_DATA', data: initialData });
  }, [initialData]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const persistChange = useCallback(
    async (data: CBTSessionData) => {
      if (!onChange) return;
      dispatch({ type: 'SET_ERROR', error: null });
      dispatch({ type: 'SET_SAVING', isSaving: true });
      try {
        await onChange(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save changes';
        dispatch({ type: 'SET_ERROR', error: message });
        throw err;
      } finally {
        dispatch({ type: 'SET_SAVING', isSaving: false });
      }
    },
    [onChange]
  );

  const goNext = useCallback(() => dispatch({ type: 'GO_NEXT' }), []);
  const goPrevious = useCallback(() => dispatch({ type: 'GO_PREVIOUS' }), []);
  const goToStep = useCallback((step: CBTStepId | 'complete') => {
    dispatch({ type: 'GO_TO_STEP', step });
  }, []);

  const updateStep = useCallback(
    async (stepId: CBTStepId, data: unknown) => {
      dispatch({ type: 'UPDATE_STEP', stepId, data });
      const field = STEP_TO_FIELD_MAP[stepId];
      const updated: CBTSessionData = {
        ...sessionData,
        [field]: data,
        lastModified: new Date().toISOString(),
      };
      await persistChange(updated);
    },
    [sessionData, persistChange]
  );

  const completeStep = useCallback(
    async (stepId: CBTStepId, data: unknown) => {
      dispatch({ type: 'COMPLETE_STEP', stepId, data });
      const field = STEP_TO_FIELD_MAP[stepId];
      const updated: CBTSessionData = {
        ...sessionData,
        [field]: data,
        lastModified: new Date().toISOString(),
      };
      await persistChange(updated);
    },
    [sessionData, persistChange]
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const canGoBack = useMemo(() => {
    if (currentStep === 'complete') return true;
    return CBT_STEP_ORDER.indexOf(currentStep) > 0;
  }, [currentStep]);

  const canGoNext = useMemo(() => currentStep !== 'complete', [currentStep]);

  const progress = useMemo(
    () => ({
      currentStepNumber: getStepNumber(currentStep),
      totalSteps: CBT_STEP_ORDER.length,
      completedCount: completedSteps.size,
      isComplete: currentStep === 'complete',
    }),
    [currentStep, completedSteps.size]
  );

  const getStepData = useCallback(
    <T>(stepId: CBTStepId): T | null => {
      const field = STEP_TO_FIELD_MAP[stepId];
      return sessionData[field] as T | null;
    },
    [sessionData]
  );

  return {
    currentStep,
    sessionData,
    completedSteps,
    isSaving,
    error,
    progress,

    goNext,
    goPrevious,
    goToStep,
    canGoBack,
    canGoNext,

    updateStep,
    completeStep,
    getStepData,
    reset,
    clearError,
  };
}

export type UseCBTFlowReturn = ReturnType<typeof useCBTFlow>;
