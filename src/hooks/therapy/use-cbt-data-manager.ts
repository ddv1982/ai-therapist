'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logger } from '@/lib/utils/logger';
import { 
  createSelector
} from '@reduxjs/toolkit';
import { type RootState } from '@/store';
import {
  createDraft,
  updateDraft,
  setCurrentStep,
  saveDraft,
  loadDraft,
  deleteDraft,
  completeCBTEntry,
  setSubmitting,
  clearValidationErrors,
  resetCurrentDraft,
  startCBTSession,
  applyCBTEvent,
  clearCBTSession,
  type CBTFormData,
  type CBTDraft,
  cbtFormSchema,
} from '@/store/slices/cbt-slice';
import { type CBTStepPayloadMap, type CBTFlowState, TOTAL_CBT_STEPS } from '@/features/therapy/cbt/flow';

import type {
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionData,
  ChallengeQuestionsData,
  RationalThoughtData,
  RationalThoughtsData,
  SchemaModeData,
  SchemaMode,
  ActionPlanData,
  CBTFormValidationError,
} from '@/types/therapy';
import type { CBTFormInput } from '@/features/therapy/cbt/cbt-form-schema';
import { useChatUI } from '@/contexts/chat-ui-context';
import { useCBTChatBridge, type SendStepOptions } from '@/lib/therapy/use-cbt-chat-bridge';
import { buildSessionSummaryCard } from '@/features/therapy/cbt/flow/cards';
import { buildMarkdownSummary } from '@/features/therapy/cbt/flow/summary';
import { generateUUID } from '@/lib/utils';
import { type CBTStepId } from '@/features/therapy/cbt/flow';

// Narrowing helpers to avoid any-casts during legacy migration/adapters
const asEmotionData = (e: unknown): EmotionData => {
  const src = (e ?? {}) as Partial<Record<string, unknown>>;
  return {
    fear: Number(src.fear ?? 0),
    anger: Number(src.anger ?? 0),
    sadness: Number(src.sadness ?? 0),
    joy: Number(src.joy ?? 0),
    anxiety: Number(src.anxiety ?? 0),
    shame: Number(src.shame ?? 0),
    guilt: Number(src.guilt ?? 0),
    other: typeof src.other === 'string' ? src.other : '',
    otherIntensity: Number(src.otherIntensity ?? 0),
  };
};

const asThoughtDataArray = (arr: unknown): ThoughtData[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((t) => {
    if (t && typeof t === 'object') {
      const o = t as Record<string, unknown>;
      const text = String((o.thought ?? o.text ?? o.content ?? ''));
      const credibility = Number(o.credibility ?? 5);
      return { thought: text, credibility };
    }
    return { thought: String(t ?? ''), credibility: 5 };
  }).filter((t) => t.thought.length > 0);
};

const asCoreBeliefData = (input: unknown): CoreBeliefData => {
  const src = (input ?? {}) as Partial<Record<string, unknown>>;
  return {
    coreBeliefText: String(src.coreBeliefText ?? ''),
    coreBeliefCredibility: Number(src.coreBeliefCredibility ?? 5),
  };
};

const asChallengeQuestionsArray = (arr: unknown): ChallengeQuestionData[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((q) => {
    if (q && typeof q === 'object') {
      const o = q as Record<string, unknown>;
      const question = String(o.question ?? o.q ?? o.prompt ?? '');
      const answer = String(o.answer ?? o.a ?? o.response ?? '');
      return { question, answer };
    }
    return { question: String(q ?? ''), answer: '' };
  }).filter((q) => q.question.length > 0);
};

const asRationalThoughtsArray = (arr: unknown): RationalThoughtData[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((t) => {
    if (t && typeof t === 'object') {
      const o = t as Record<string, unknown>;
      const thought = String(o.thought ?? o.text ?? o.content ?? '');
      const confidence = Number(o.confidence ?? 5);
      return { thought, confidence };
    }
    return { thought: String(t ?? ''), confidence: 5 };
  }).filter((t) => t.thought.length > 0);
};

const asActionPlanData = (input: unknown): ActionPlanData => {
  const src = (input ?? {}) as Partial<Record<string, unknown>>;
  return {
    finalEmotions: asEmotionData(src.finalEmotions ?? {}),
    originalThoughtCredibility: Number(src.originalThoughtCredibility ?? 5),
    newBehaviors: String(src.newBehaviors ?? ''),
  };
};

const selectCBTCurrentDraft = (state: RootState) => state.cbt?.currentDraft;
const selectCBTFlowState = (state: RootState) => state.cbt?.flow;

interface LegacySessionData {
  sessionId: string | null;
  situation: SituationData | null;
  emotions: EmotionData | null;
  thoughts: ThoughtData[];
  coreBeliefs: CoreBeliefData[];
  challengeQuestions: ChallengeQuestionData[];
  rationalThoughts: RationalThoughtData[];
  schemaModes: SchemaModeData[];
  actionPlan: ActionPlanData | null;
  startedAt: string | null;
  lastModified: string | null;
}

const EMPTY_SESSION: LegacySessionData = {
  sessionId: null,
  situation: null,
  emotions: null,
  thoughts: [],
  coreBeliefs: [],
  challengeQuestions: [],
  rationalThoughts: [],
  schemaModes: [],
  actionPlan: null,
  startedAt: null,
  lastModified: null,
};

const mapFlowToLegacySession = (flow?: CBTFlowState | null): LegacySessionData => {
  if (!flow) return EMPTY_SESSION;
  const context = flow.context;
  const legacySchemaModes = context.schemaModes?.selectedModes?.map((mode) => ({
    mode: mode.id,
    description: mode.description,
    intensity: typeof mode.intensity === 'number' ? mode.intensity : 0,
    isActive: Boolean(mode.selected),
  })) ?? [];
  return {
    sessionId: flow.sessionId ?? null,
    situation: context.situation ?? null,
    emotions: context.emotions ?? null,
    thoughts: context.thoughts ?? [],
    coreBeliefs: context.coreBelief ? [context.coreBelief] : [],
    challengeQuestions: context.challengeQuestions?.challengeQuestions ?? [],
    rationalThoughts: context.rationalThoughts?.rationalThoughts ?? [],
    schemaModes: legacySchemaModes,
    actionPlan: context.actionPlan ?? null,
    startedAt: flow.startedAt ?? null,
    lastModified: flow.updatedAt ?? null,
  };
};

const selectCBTSessionData = createSelector([selectCBTFlowState], mapFlowToLegacySession);

const selectCBTValidationState = createSelector(
  [
    (state: RootState) => state.cbt?.validationErrors,
    (state: RootState) => state.cbt?.isSubmitting,
    (state: RootState) => state.cbt?.currentStep,
  ],
  (validationErrors, isSubmitting, currentStep) => ({
    validationErrors,
    isSubmitting,
    currentStep,
  })
);

const selectCBTSavedDrafts = (state: RootState) => state.cbt?.savedDrafts;

interface UseCBTDataManagerOptions {
  sessionId?: string;
  autoSaveDelay?: number;
  enableValidation?: boolean;
  enableChatIntegration?: boolean;
}

interface UseCBTDataManagerReturn {
  currentDraft: CBTDraft | null;
  sessionData: ReturnType<typeof selectCBTSessionData>;
  validationState: ReturnType<typeof selectCBTValidationState>;
  savedDrafts: CBTDraft[];
  
  draftActions: {
    create: (id?: string) => void;
    update: (data: Partial<CBTFormData>) => void;
    save: () => void;
    load: (id: string) => void;
    delete: (id: string) => void;
    reset: () => void;
    complete: (data: CBTFormData) => void;
  };
  
  sessionActions: {
    start: (sessionId?: string) => void;
    clear: () => void;
    updateSituation: (data: SituationData) => void;
    updateEmotions: (data: EmotionData) => void;
    clearEmotions: () => void;
  };
  
  thoughtActions: {
    updateThoughts: (data: ThoughtData[]) => void;
    addThought: (data: ThoughtData) => void;
    removeThought: (index: number) => void;
  };
  
  beliefActions: {
    updateCoreBeliefs: (data: CoreBeliefData[]) => void;
    addCoreBelief: (data: CoreBeliefData) => void;
    removeCoreBelief: (index: number) => void;
  };
  
  challengeActions: {
    updateChallengeQuestions: (data: ChallengeQuestionData[]) => void;
    addChallengeQuestion: (data: ChallengeQuestionData) => void;
    removeChallengeQuestion: (index: number) => void;
  };
  
  rationalActions: {
    updateRationalThoughts: (data: RationalThoughtData[]) => void;
    addRationalThought: (data: RationalThoughtData) => void;
    removeRationalThought: (index: number) => void;
  };
  
  schemaActions: {
    updateSchemaModes: (data: SchemaModeData[]) => void;
    toggleSchemaMode: (index: number, isActive: boolean) => void;
  };
  
  actionActions: {
    updateActionPlan: (data: ActionPlanData) => void;
  };
  
  navigation: {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    canGoNext: boolean;
    canGoPrevious: boolean;
    goNext: () => boolean;
    goPrevious: () => boolean;
  };
  
  validation: {
    validateForm: () => CBTFormValidationError[];
    isFormValid: boolean;
    errors: Record<string, string>;
    clearErrors: () => void;
  };
  
  status: {
    isSubmitting: boolean;
    isDraftSaved: boolean;
    lastAutoSave: string | null;
    progress: {
      completedSteps: number;
      totalSteps: number;
      percentage: number;
    };
  };
  
  chatIntegration: {
    sendSessionSummary: () => Promise<boolean>;
    sendStepCard: (stepId: CBTStepId, options?: SendStepOptions) => Promise<boolean>;
    sendAllCompletedSteps: () => Promise<boolean>;
    sendEmotionComparison: (initial: EmotionData, final: EmotionData) => Promise<boolean>;
    isIntegrationAvailable: boolean;
  };
  
  utilities: {
    exportData: () => string;
    generateSummary: () => string;
    getFormattedOutput: () => string;
  };

  debouncedAutoSave: (data: Partial<CBTFormInput>) => void;
}

export function useCBTDataManager(options: UseCBTDataManagerOptions = {}): UseCBTDataManagerReturn {
  const {
    sessionId,
    autoSaveDelay = 1000,
    enableValidation = true,
    enableChatIntegration = true,
  } = options;
  
  const dispatch = useDispatch();
  const flowState = useSelector(selectCBTFlowState);
  const hasStartedSessionRef = useRef(false);
  const ensureActiveSession = useCallback(() => {
    if (flowState?.status && flowState.status !== 'idle') {
      hasStartedSessionRef.current = false;
      return;
    }
    if (hasStartedSessionRef.current) return;
    hasStartedSessionRef.current = true;
    const existingId = flowState?.sessionId;
    dispatch(startCBTSession({ sessionId: existingId ?? `cbt-${generateUUID()}` }));
  }, [dispatch, flowState?.status, flowState?.sessionId]);
  const flowUpdate = useCallback(
    <K extends CBTStepId>(stepId: K, payload: CBTStepPayloadMap[K]) => {
      ensureActiveSession();
      dispatch(applyCBTEvent({ type: 'UPDATE_STEP', stepId, payload }));
    },
    [dispatch, ensureActiveSession],
  );
  const flowClear = useCallback(
    (stepId: CBTStepId) => {
      ensureActiveSession();
      dispatch(applyCBTEvent({ type: 'CLEAR_STEP', stepId }));
    },
    [dispatch, ensureActiveSession],
  );


  const currentDraft = useSelector(selectCBTCurrentDraft);
  const sessionData = useSelector(selectCBTSessionData);
  const validationState = useSelector(selectCBTValidationState);
  const savedDrafts = useSelector(selectCBTSavedDrafts);
  const lastAutoSave = useSelector((state: RootState) => state.cbt?.lastAutoSave);
  

  const autoSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiSavingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSavingUI, setIsSavingUI] = useState<boolean>(false);
  
  const debouncedAutoSave = useCallback((data: Partial<CBTFormInput>) => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    const effectiveDelay = typeof autoSaveDelay === 'number' && autoSaveDelay > 0
      ? autoSaveDelay
      : 600;

    autoSaveTimeout.current = setTimeout(() => {
      if (data?.situation) {
        flowUpdate('situation', {
          situation: data.situation,
          date: data.date || new Date().toISOString().split('T')[0],
        });
      }


      if (data?.initialEmotions) {
        const emotions = asEmotionData(data.initialEmotions);
        flowUpdate('emotions', emotions);
      }
    }, effectiveDelay);

  }, [flowUpdate, autoSaveDelay]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
      if (uiSavingTimeout.current) {
        clearTimeout(uiSavingTimeout.current);
      }
    };
  }, []);

  
  const { currentSessionId } = useChatUI();
  const chatBridge = useCBTChatBridge();
  
  useEffect(() => {
    if (!currentDraft || autoSaveDelay <= 0) return;
    
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    autoSaveTimeout.current = setTimeout(() => {
      dispatch(saveDraft());
    }, autoSaveDelay);
    
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
        autoSaveTimeout.current = null;
      }
    };

  }, [currentDraft, autoSaveDelay, dispatch]);

  // UI-saving indicator: whenever a draft/save occurs, briefly show "saving" then "saved"
  useEffect(() => {
    if (!lastAutoSave) return;
    setIsSavingUI(true);
    if (uiSavingTimeout.current) {
      clearTimeout(uiSavingTimeout.current);
    }
    uiSavingTimeout.current = setTimeout(() => {
      setIsSavingUI(false);
    }, 700);
    return () => {
      if (uiSavingTimeout.current) {
        clearTimeout(uiSavingTimeout.current);
      }
    };
  }, [lastAutoSave]);
  
  useEffect(() => {
    if (sessionId && sessionId !== sessionData?.sessionId) {
      dispatch(startCBTSession({ sessionId }));
    }

  }, [sessionId, sessionData?.sessionId, dispatch]);

  useEffect(() => {
    const migrationKey = 'cbt-migration-completed';
    const hasMigrated = localStorage.getItem(migrationKey);

    if (hasMigrated) return;

    try {
      const rawDraft = localStorage.getItem('cbt-draft');
      if (!rawDraft) {
        localStorage.setItem(migrationKey, 'true');
        return;
      }


      const draft = JSON.parse(rawDraft) as CBTFormInput;

      const isEmpty = !sessionData?.situation && !sessionData?.emotions && sessionData?.thoughts.length === 0;
      if (!isEmpty) {
        localStorage.setItem(migrationKey, 'true');
        return;
      }


      const draftId = `cbt-draft-${generateUUID()}`;
      dispatch(createDraft({ id: draftId }));

      if (!sessionData?.sessionId) {
        dispatch(startCBTSession({ sessionId: `cbt-${generateUUID()}` }));
      }

      if (draft.situation) {
        const situationData = { situation: draft.situation, date: draft.date };
        flowUpdate('situation', situationData);

      }

      if (draft.initialEmotions) {
        flowUpdate('emotions', asEmotionData(draft.initialEmotions));

      }

      if (Array.isArray(draft.automaticThoughts) && draft.automaticThoughts.length > 0) {
        flowUpdate('thoughts', asThoughtDataArray(draft.automaticThoughts));

      }

      if (draft.coreBeliefText && draft.coreBeliefText.trim().length > 0) {
        flowUpdate('core-belief', asCoreBeliefData({
          coreBeliefText: draft.coreBeliefText,
          coreBeliefCredibility: draft.coreBeliefCredibility,
        }));

      }

      if (Array.isArray(draft.challengeQuestions)) {
        flowUpdate('challenge-questions', {
          challengeQuestions: asChallengeQuestionsArray(draft.challengeQuestions),
        } as ChallengeQuestionsData);

      }

      if (Array.isArray(draft.rationalThoughts)) {
        flowUpdate('rational-thoughts', {
          rationalThoughts: asRationalThoughtsArray(draft.rationalThoughts),
        } as RationalThoughtsData);

      }

      if (Array.isArray(draft.schemaModes)) {
    const mapped: SchemaMode[] = draft.schemaModes.map((mode, index) => ({
          id: mode.id ?? mode.name ?? `legacy-schema-mode-${index}`,
          name: mode.name ?? mode.id ?? '',
          description: mode.description ?? '',
          selected: Boolean(mode.selected),
          intensity: typeof mode.intensity === 'number' ? mode.intensity : 5,
        }));
        flowUpdate('schema-modes', {
          selectedModes: mapped,
        });

      }

      if (draft.newBehaviors) {
        const actionPlan = asActionPlanData({
          finalEmotions: draft.finalEmotions,
          originalThoughtCredibility: draft.originalThoughtCredibility,
          newBehaviors: draft.newBehaviors,
        });
        flowUpdate('actions', actionPlan);
      }

      // Clean up old localStorage data
      localStorage.removeItem('cbt-draft');

      localStorage.setItem(migrationKey, 'true');

      logger.info('Successfully migrated CBT draft from localStorage to Redux', {
        component: 'useCBTDataManager',
        operation: 'migration',
        draftId
      });
    } catch (error) {
      logger.error('Failed to migrate CBT draft from localStorage', {
        component: 'useCBTDataManager',
        operation: 'migration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      localStorage.setItem(migrationKey, 'true');
    }
  }, [dispatch, sessionData, flowUpdate]);

  const draftActions = useMemo(() => ({
    create: (id?: string) => {
      const draftId = id || `cbt-draft-${generateUUID()}`;
      dispatch(createDraft({ id: draftId }));
    },
    
    update: (data: Partial<CBTFormData>) => {
      dispatch(updateDraft(data));
    },
    
    save: () => {
      dispatch(saveDraft());
    },
    
    load: (id: string) => {
      dispatch(loadDraft(id));
    },
    
    delete: (id: string) => {
      dispatch(deleteDraft(id));
    },
    
    reset: () => {
      dispatch(resetCurrentDraft());
    },
    
    complete: (data: CBTFormData) => {
      dispatch(completeCBTEntry(data));
    },

  }), [dispatch]);
  
  const sessionActions = useMemo(() => ({
    start: (sessionId?: string) => {
      const id = sessionId || currentSessionId || `session-${generateUUID()}`;
      dispatch(startCBTSession({ sessionId: id }));
    },
    
    clear: () => {
      dispatch(clearCBTSession());
    },
    
    updateSituation: (data: SituationData) => {
      flowUpdate('situation', data);
    },
    
    updateEmotions: (data: EmotionData) => {
      flowUpdate('emotions', data);
    },
    
    clearEmotions: () => {
      flowClear('emotions');
    },

  }), [dispatch, currentSessionId, flowUpdate, flowClear]);
  
  const thoughtActions = useMemo(() => ({
    updateThoughts: (data: ThoughtData[]) => {
      flowUpdate('thoughts', data);
    },

    addThought: (data: ThoughtData) => {
      const next = [...(sessionData.thoughts ?? []), data];
      flowUpdate('thoughts', next);
    },

    removeThought: (index: number) => {
      const current = sessionData.thoughts ?? [];
      const next = current.filter((_, i) => i !== index);
      if (next.length === 0) {
        flowClear('thoughts');
      } else {
        flowUpdate('thoughts', next);
      }
    },

  }), [flowUpdate, flowClear, sessionData.thoughts]);
  
  const beliefActions = useMemo(() => ({
    updateCoreBeliefs: (data: CoreBeliefData[]) => {
      if (!data?.length) {
        flowClear('core-belief');
        return;
      }
      flowUpdate('core-belief', data[0]);
    },

    addCoreBelief: (data: CoreBeliefData) => {
      flowUpdate('core-belief', data);
    },

    removeCoreBelief: (index: number) => {
      if (index === 0) {
        flowClear('core-belief');
      }
    },

  }), [flowUpdate, flowClear]);
  
  const challengeActions = useMemo(() => ({
    updateChallengeQuestions: (data: ChallengeQuestionData[]) => {
      flowUpdate('challenge-questions', { challengeQuestions: data } as ChallengeQuestionsData);
    },

    addChallengeQuestion: (data: ChallengeQuestionData) => {
      const current = sessionData.challengeQuestions ?? [];
      flowUpdate('challenge-questions', { challengeQuestions: [...current, data] } as ChallengeQuestionsData);
    },

    removeChallengeQuestion: (index: number) => {
      const current = sessionData.challengeQuestions ?? [];
      const next = current.filter((_, i) => i !== index);
      if (next.length === 0) {
        flowClear('challenge-questions');
      } else {
        flowUpdate('challenge-questions', { challengeQuestions: next } as ChallengeQuestionsData);
      }
    },

  }), [flowUpdate, flowClear, sessionData.challengeQuestions]);
  
  const rationalActions = useMemo(() => ({
    updateRationalThoughts: (data: RationalThoughtData[]) => {
      flowUpdate('rational-thoughts', { rationalThoughts: data } as RationalThoughtsData);
    },

    addRationalThought: (data: RationalThoughtData) => {
      const current = sessionData.rationalThoughts ?? [];
      flowUpdate('rational-thoughts', { rationalThoughts: [...current, data] } as RationalThoughtsData);
    },

    removeRationalThought: (index: number) => {
      const current = sessionData.rationalThoughts ?? [];
      const next = current.filter((_, i) => i !== index);
      if (next.length === 0) {
        flowClear('rational-thoughts');
      } else {
        flowUpdate('rational-thoughts', { rationalThoughts: next } as RationalThoughtsData);
      }
    },

  }), [flowUpdate, flowClear, sessionData.rationalThoughts]);
  
  const schemaActions = useMemo(() => ({
    updateSchemaModes: (data: SchemaModeData[]) => {
      const mapped: SchemaMode[] = data.map((mode, index) => ({
        id: mode.mode ?? `schema-mode-${index}`,
        name: mode.mode ?? `Schema Mode ${index + 1}`,
        description: mode.description ?? '',
        selected: Boolean(mode.isActive),
        intensity: typeof mode.intensity === 'number' ? mode.intensity : 0,
      }));
      flowUpdate('schema-modes', { selectedModes: mapped });
    },

    toggleSchemaMode: (index: number, isActive: boolean) => {
      const current = sessionData.schemaModes ?? [];
      const mapped: SchemaMode[] = current.map((mode, idx) => ({
        id: mode.mode ?? `schema-mode-${idx}`,
        name: mode.mode ?? '',
        description: mode.description ?? '',
        selected: idx === index ? isActive : Boolean(mode.isActive),
        intensity: typeof mode.intensity === 'number' ? mode.intensity : 0,
      }));
      flowUpdate('schema-modes', { selectedModes: mapped });
    },

  }), [flowUpdate, sessionData.schemaModes]);
  
  const actionActions = useMemo(() => ({
    updateActionPlan: (data: ActionPlanData) => {
      flowUpdate('actions', data);
    },

  }), [flowUpdate]);
  
  const navigation = useMemo(() => {
    const currentStep = validationState?.currentStep || 1;
    const maxSteps = TOTAL_CBT_STEPS;
    
    return {
      currentStep,
      setCurrentStep: (step: number) => {
        dispatch(setCurrentStep(step));
      },
      canGoNext: currentStep < maxSteps,
      canGoPrevious: currentStep > 1,
      goNext: () => {
        if (currentStep < maxSteps) {
          dispatch(setCurrentStep(currentStep + 1));
          return true;
        }
        return false;
      },
      goPrevious: () => {
        if (currentStep > 1) {
          dispatch(setCurrentStep(currentStep - 1));
          return true;
        }
        return false;
      },
    };
  }, [validationState?.currentStep, dispatch]);
  
  const validation = useMemo(() => {
    const validateForm = (): CBTFormValidationError[] => {
      if (!enableValidation || !currentDraft) return [];
      
      try {
        cbtFormSchema.parse(currentDraft.data);
        return [];
      } catch (error) {
        if (error instanceof Error) {
          return [{ field: 'form', message: error.message }];
        }
        return [{ field: 'form', message: 'Validation failed' }];
      }
    };
    
    return {
      validateForm,
      isFormValid: Object.keys(validationState?.validationErrors || {}).length === 0,
      errors: validationState?.validationErrors || {},
      clearErrors: () => dispatch(clearValidationErrors()),
    };
  }, [currentDraft, validationState?.validationErrors, enableValidation, dispatch]);
  
  const status = useMemo(() => {
    const completedSteps = sessionData ? [
      sessionData?.situation,
      sessionData?.emotions, 
      sessionData?.thoughts.length > 0,
      sessionData?.coreBeliefs.length > 0,
      sessionData?.challengeQuestions.length > 0,
      sessionData?.rationalThoughts.length > 0,
      sessionData?.schemaModes.length > 0,
      sessionData?.actionPlan,
    ].filter(Boolean).length : 0;
    
    const totalSteps = TOTAL_CBT_STEPS;
    
    return {
      isSubmitting: validationState?.isSubmitting || false,
      // Consider draft saved when no UI-saving is pending.
      isDraftSaved: !isSavingUI,
      lastAutoSave: lastAutoSave || null,
      progress: {
        completedSteps,
        totalSteps,
        percentage: Math.round((completedSteps / totalSteps) * 100),
      },
    };
  }, [validationState?.isSubmitting, lastAutoSave, sessionData, isSavingUI]);
  
  const chatIntegration = useMemo(() => ({
    sendSessionSummary: async (): Promise<boolean> => {
      if (!enableChatIntegration || !currentSessionId || !flowState) return false;
      return chatBridge.sendSessionSummary(flowState, currentSessionId);
    },
    sendStepCard: async (stepId: CBTStepId, options?: SendStepOptions): Promise<boolean> => {
      if (!enableChatIntegration || !currentSessionId || !flowState) return false;
      return chatBridge.sendStepCard(stepId, flowState.context, currentSessionId, options);
    },
    sendAllCompletedSteps: async (): Promise<boolean> => {
      if (!enableChatIntegration || !currentSessionId || !flowState) return false;
      return chatBridge.sendAllCompletedSteps(flowState.context, currentSessionId);
    },
    sendEmotionComparison: async (initial: EmotionData, final: EmotionData): Promise<boolean> => {
      if (!enableChatIntegration || !currentSessionId) return false;
      return chatBridge.sendEmotionComparison(initial, final, currentSessionId);
    },
    isIntegrationAvailable: enableChatIntegration && !!currentSessionId,
  }), [enableChatIntegration, currentSessionId, chatBridge, flowState]);
  
  const utilities = useMemo(() => ({
    exportData: (): string => {
      if (!currentDraft) return '';
      return JSON.stringify(currentDraft.data, null, 2);
    },
    
    generateSummary: (): string => {
      if (!flowState) return '';
      return buildMarkdownSummary(flowState);
    },

    getFormattedOutput: (): string => {
      if (!flowState) return '';
      return buildSessionSummaryCard(flowState);
    },
  }), [currentDraft, flowState]);
  
  return {
    // Current State
    currentDraft: currentDraft || null,
    sessionData,
    validationState,
    savedDrafts: savedDrafts || [],
    
    // Actions
    draftActions,
    sessionActions,
    thoughtActions,
    beliefActions,
    challengeActions,
    rationalActions,
    schemaActions,
    actionActions,
    
    // Navigation & Validation
    navigation,
    validation,
    
    // Status & Progress
    status,
    
    // Chat Integration
    chatIntegration,
    
    // Export Utilities
    utilities,

    // Debounced auto-save function
    debouncedAutoSave,
  };
}

export function useUnifiedCBTSelector<T>(
  selector: (state: RootState) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  return useSelector(selector, equalityFn);
}

export function useUnifiedCBTActions() {
  const dispatch = useDispatch();
  const updateStep = useCallback(
    <K extends CBTStepId>(stepId: K, payload: CBTStepPayloadMap[K]) => {
      dispatch(applyCBTEvent({ type: 'UPDATE_STEP', stepId, payload }));
    },
    [dispatch],
  );
  
  return useMemo(() => ({
    createDraft: (id: string) => dispatch(createDraft({ id })),
    updateDraft: (data: Partial<CBTFormData>) => dispatch(updateDraft(data)),
    saveDraft: () => dispatch(saveDraft()),
    deleteDraft: (id: string) => dispatch(deleteDraft(id)),
    startSession: (sessionId: string) => dispatch(startCBTSession({ sessionId })),
    clearSession: () => dispatch(clearCBTSession()),
    updateSituation: (data: SituationData) => updateStep('situation', data),
    updateEmotions: (data: EmotionData) => updateStep('emotions', data),
    addThought: (data: ThoughtData) => updateStep('thoughts', [data]),
    addCoreBelief: (data: CoreBeliefData) => updateStep('core-belief', data),
    setCurrentStep: (step: number) => dispatch(setCurrentStep(step)),
    setSubmitting: (isSubmitting: boolean) => dispatch(setSubmitting(isSubmitting)),
  }), [dispatch, updateStep]);
}

export const useUnifiedCBT = useCBTDataManager;
export type UseUnifiedCBTOptions = UseCBTDataManagerOptions;
export type UseUnifiedCBTReturn = UseCBTDataManagerReturn;
