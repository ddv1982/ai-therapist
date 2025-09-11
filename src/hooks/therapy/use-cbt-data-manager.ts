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
  updateSituation,
  updateEmotions,
  clearEmotions,
  updateThoughts,
  addThought,
  removeThought,
  updateCoreBeliefs,
  addCoreBelief,
  removeCoreBelief,
  updateChallengeQuestions,
  addChallengeQuestion,
  removeChallengeQuestion,
  updateRationalThoughts,
  addRationalThought,
  removeRationalThought,
  updateSchemaModes,
  toggleSchemaMode,
  updateActionPlan,
  clearCBTSession,
  type CBTFormData,
  type CBTDraft,
  cbtFormSchema,
} from '@/store/slices/cbtSlice';

import type {
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionData,
  RationalThoughtData,
  SchemaModeData,
  ActionPlanData,
  CBTFormValidationError,
} from '@/types/therapy';
import type { CBTFormInput } from '@/features/therapy/cbt/cbt-form-schema';
import { useChatUI } from '@/contexts/chat-ui-context';
import { useCBTChatBridge } from '@/lib/therapy/use-cbt-chat-bridge';
import { generateUUID } from '@/lib/utils/utils';

const selectCBTCurrentDraft = (state: RootState) => state.cbt?.currentDraft;
const selectCBTSessionData = (state: RootState) => state.cbt?.sessionData;

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
    sendToChat: (message: string) => Promise<boolean>;
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
  

  const currentDraft = useSelector(selectCBTCurrentDraft);
  const sessionData = useSelector(selectCBTSessionData);
  const validationState = useSelector(selectCBTValidationState);
  const savedDrafts = useSelector(selectCBTSavedDrafts);
  const lastAutoSave = useSelector((state: RootState) => state.cbt?.lastAutoSave);
  

  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const uiSavingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isSavingUI, setIsSavingUI] = useState<boolean>(false);
  
  const debouncedAutoSave = useCallback((data: Partial<CBTFormInput>) => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    autoSaveTimeout.current = setTimeout(() => {
      if (data?.situation) {
        dispatch(updateSituation({
          situation: data.situation,
          date: data.date || new Date().toISOString().split('T')[0]
        }));
      }


      if (data?.initialEmotions) {
        const emotions = {
          fear: data.initialEmotions.fear || 0,
          anger: data.initialEmotions.anger || 0,
          sadness: data.initialEmotions.sadness || 0,
          joy: data.initialEmotions.joy || 0,
          anxiety: data.initialEmotions.anxiety || 0,
          shame: data.initialEmotions.shame || 0,
          guilt: data.initialEmotions.guilt || 0,
          other: data.initialEmotions.other || '',
          otherIntensity: data.initialEmotions.otherIntensity || 0,
        };
        dispatch(updateEmotions(emotions));
      }
    }, options.autoSaveDelay || 600);

  }, [dispatch, options.autoSaveDelay]);

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

  // UI-saving indicator: whenever session data changes, briefly show "saving" then "saved"
  useEffect(() => {
    if (!sessionData?.lastModified) return;
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
  }, [sessionData?.lastModified]);
  
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

      if (draft.situation) {
        const situationData = { situation: draft.situation, date: draft.date };
        dispatch(updateSituation(situationData));

      }

      if (draft.initialEmotions) {
        dispatch(updateEmotions(draft.initialEmotions as unknown as EmotionData));

      }

      if (Array.isArray(draft.automaticThoughts) && draft.automaticThoughts.length > 0) {
        dispatch(updateThoughts(draft.automaticThoughts as unknown as ThoughtData[]));

      }

      if (draft.coreBeliefText && draft.coreBeliefText.trim().length > 0) {
        dispatch(updateCoreBeliefs([
          { coreBeliefText: draft.coreBeliefText, coreBeliefCredibility: draft.coreBeliefCredibility }
        ] as unknown as CoreBeliefData[]));

      }

      if (Array.isArray(draft.challengeQuestions)) {
        dispatch(updateChallengeQuestions(draft.challengeQuestions as unknown as ChallengeQuestionData[]));

      }

      if (Array.isArray(draft.rationalThoughts)) {
        dispatch(updateRationalThoughts(draft.rationalThoughts as unknown as RationalThoughtData[]));

      }

      if (Array.isArray(draft.schemaModes)) {
        const mapped = draft.schemaModes.map((m) => ({
          mode: m.name,
          description: m.description,
          intensity: typeof m.intensity === 'number' ? m.intensity : 5,
          isActive: !!m.selected,
        }));
        dispatch(updateSchemaModes(mapped as unknown as SchemaModeData[]));

      }

      if (draft.newBehaviors) {
        const actionPlan = {
          finalEmotions: draft.finalEmotions,
          originalThoughtCredibility: draft.originalThoughtCredibility,
          newBehaviors: draft.newBehaviors,
        } as unknown as ActionPlanData;
        dispatch(updateActionPlan(actionPlan));
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
  }, [dispatch, sessionData]);

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
      dispatch(updateSituation(data));
    },
    
    updateEmotions: (data: EmotionData) => {
      dispatch(updateEmotions(data));
    },
    
    clearEmotions: () => {
      dispatch(clearEmotions());
    },

  }), [dispatch, currentSessionId]);
  
  const thoughtActions = useMemo(() => ({
    updateThoughts: (data: ThoughtData[]) => {
      dispatch(updateThoughts(data));
    },
    
    addThought: (data: ThoughtData) => {
      dispatch(addThought(data));
    },
    
    removeThought: (index: number) => {
      dispatch(removeThought(index));
    },

  }), [dispatch]);
  
  const beliefActions = useMemo(() => ({
    updateCoreBeliefs: (data: CoreBeliefData[]) => {
      dispatch(updateCoreBeliefs(data));
    },
    
    addCoreBelief: (data: CoreBeliefData) => {
      dispatch(addCoreBelief(data));
    },
    
    removeCoreBelief: (index: number) => {
      dispatch(removeCoreBelief(index));
    },

  }), [dispatch]);
  
  const challengeActions = useMemo(() => ({
    updateChallengeQuestions: (data: ChallengeQuestionData[]) => {
      dispatch(updateChallengeQuestions(data));
    },
    
    addChallengeQuestion: (data: ChallengeQuestionData) => {
      dispatch(addChallengeQuestion(data));
    },
    
    removeChallengeQuestion: (index: number) => {
      dispatch(removeChallengeQuestion(index));
    },

  }), [dispatch]);
  
  const rationalActions = useMemo(() => ({
    updateRationalThoughts: (data: RationalThoughtData[]) => {
      dispatch(updateRationalThoughts(data));
    },
    
    addRationalThought: (data: RationalThoughtData) => {
      dispatch(addRationalThought(data));
    },
    
    removeRationalThought: (index: number) => {
      dispatch(removeRationalThought(index));
    },

  }), [dispatch]);
  
  const schemaActions = useMemo(() => ({
    updateSchemaModes: (data: SchemaModeData[]) => {
      dispatch(updateSchemaModes(data));
    },
    
    toggleSchemaMode: (index: number, isActive: boolean) => {
      dispatch(toggleSchemaMode({ index, isActive }));
    },

  }), [dispatch]);
  
  const actionActions = useMemo(() => ({
    updateActionPlan: (data: ActionPlanData) => {
      dispatch(updateActionPlan(data));
    },

  }), [dispatch]);
  
  const navigation = useMemo(() => {
    const currentStep = validationState?.currentStep || 1;
    const maxSteps = 8;
    
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
    
    const totalSteps = 8;
    
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
    sendToChat: async (message: string): Promise<boolean> => {
      if (!enableChatIntegration || !currentSessionId) return false;
      
      try {
        const result = await chatBridge.sendChatMessage(message, currentSessionId);
        return result;
      } catch (error) {
        logger.therapeuticOperation('Failed to send CBT data to chat', {
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'sendCBTDataToChat'
        });
        return false;
      }
    },
    
    isIntegrationAvailable: enableChatIntegration && !!currentSessionId,
  }), [enableChatIntegration, currentSessionId, chatBridge]);
  
  const utilities = useMemo(() => ({
    exportData: (): string => {
      if (!currentDraft) return '';
      return JSON.stringify(currentDraft.data, null, 2);
    },
    
    generateSummary: (): string => {
      if (!sessionData) return '';
      
      const sections = [];
      
      if (sessionData?.situation) {
        sections.push(`**Situation:** ${sessionData?.situation.situation}`);
      }
      
      if (sessionData?.emotions) {
        const emotions = Object.entries(sessionData?.emotions)
          .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
          .map(([emotion, intensity]) => `${emotion}: ${intensity}/10`);
        if (emotions.length > 0) {
          sections.push(`**Emotions:** ${emotions.join(', ')}`);
        }
      }
      
      if (sessionData?.thoughts.length > 0) {
        sections.push(`**Thoughts:** ${sessionData?.thoughts.map(t => t.thought).join('; ')}`);
      }
      
      return sections.join('\n\n');
    },
    
    getFormattedOutput: (): string => {
      if (!currentDraft) return '';
      
      return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(currentDraft.data)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
    },
  }), [currentDraft, sessionData]);
  
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
  
  return useMemo(() => ({
    createDraft: (id: string) => dispatch(createDraft({ id })),
    updateDraft: (data: Partial<CBTFormData>) => dispatch(updateDraft(data)),
    saveDraft: () => dispatch(saveDraft()),
    deleteDraft: (id: string) => dispatch(deleteDraft(id)),
    startSession: (sessionId: string) => dispatch(startCBTSession({ sessionId })),
    clearSession: () => dispatch(clearCBTSession()),
    updateSituation: (data: SituationData) => dispatch(updateSituation(data)),
    updateEmotions: (data: EmotionData) => dispatch(updateEmotions(data)),
    addThought: (data: ThoughtData) => dispatch(addThought(data)),
    addCoreBelief: (data: CoreBeliefData) => dispatch(addCoreBelief(data)),
    setCurrentStep: (step: number) => dispatch(setCurrentStep(step)),
    setSubmitting: (isSubmitting: boolean) => dispatch(setSubmitting(isSubmitting)),
  }), [dispatch]);
}

export const useUnifiedCBT = useCBTDataManager;
export type UseUnifiedCBTOptions = UseCBTDataManagerOptions;
export type UseUnifiedCBTReturn = UseCBTDataManagerReturn;
