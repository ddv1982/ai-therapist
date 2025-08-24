/**
 * UNIFIED CBT STATE MANAGEMENT HOOK
 * 
 * This hook consolidates all CBT state management into a single, unified interface
 * that eliminates the triple implementation chaos across the application.
 * 
 * Key Features:
 * - Single source of truth via Redux store
 * - Unified interface for all CBT operations  
 * - Performance optimized with selective subscriptions
 * - Proper cleanup and memory management
 * - Auto-save with debouncing
 * - Comprehensive validation
 * - Session management integration
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logger } from '@/lib/utils/logger';
import { 
  createSelector
} from '@reduxjs/toolkit';
import { type RootState } from '@/store';
import { 
  // CBT Redux Actions
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
  // Session-scoped actions
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
  // Types
  type CBTFormData,
  type CBTDraft,
  cbtFormSchema,
} from '@/store/slices/cbtSlice';
import { loadCBTDraft } from '@/features/therapy/cbt/hooks/use-cbt-draft-persistence';
import type { CBTFormInput } from '@/features/therapy/cbt/cbt-form-schema';
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
import { useChatUI } from '@/contexts/chat-ui-context';
import { useCBTChatBridge } from '@/lib/therapy/use-cbt-chat-bridge';
import { generateUUID } from '@/lib/utils/utils';

// Performance optimized selectors using createSelector for memoization
const selectCBTCurrentDraft = createSelector(
  [(state: RootState) => state.cbt.currentDraft],
  (currentDraft) => currentDraft
);

const selectCBTSessionData = createSelector(
  [(state: RootState) => state.cbt.sessionData],
  (sessionData) => sessionData
);

const selectCBTValidationState = createSelector(
  [
    (state: RootState) => state.cbt.validationErrors,
    (state: RootState) => state.cbt.isSubmitting,
    (state: RootState) => state.cbt.currentStep,
  ],
  (validationErrors, isSubmitting, currentStep) => ({
    validationErrors,
    isSubmitting,
    currentStep,
  })
);

const selectCBTSavedDrafts = createSelector(
  [(state: RootState) => state.cbt.savedDrafts],
  (savedDrafts) => savedDrafts
);

interface UseCBTDataManagerOptions {
  sessionId?: string;
  autoSaveDelay?: number;
  enableValidation?: boolean;
  enableChatIntegration?: boolean;
}

interface UseCBTDataManagerReturn {
  // Current State
  currentDraft: CBTDraft | null;
  sessionData: ReturnType<typeof selectCBTSessionData>;
  validationState: ReturnType<typeof selectCBTValidationState>;
  savedDrafts: CBTDraft[];
  
  // Draft Management
  draftActions: {
    create: (id?: string) => void;
    update: (data: Partial<CBTFormData>) => void;
    save: () => void;
    load: (id: string) => void;
    delete: (id: string) => void;
    reset: () => void;
    complete: (data: CBTFormData) => void;
  };
  
  // Session Management
  sessionActions: {
    start: (sessionId?: string) => void;
    clear: () => void;
    updateSituation: (data: SituationData) => void;
    updateEmotions: (data: EmotionData) => void;
    clearEmotions: () => void;
  };
  
  // Thought Management
  thoughtActions: {
    updateThoughts: (data: ThoughtData[]) => void;
    addThought: (data: ThoughtData) => void;
    removeThought: (index: number) => void;
  };
  
  // Core Belief Management
  beliefActions: {
    updateCoreBeliefs: (data: CoreBeliefData[]) => void;
    addCoreBelief: (data: CoreBeliefData) => void;
    removeCoreBelief: (index: number) => void;
  };
  
  // Challenge Questions Management
  challengeActions: {
    updateChallengeQuestions: (data: ChallengeQuestionData[]) => void;
    addChallengeQuestion: (data: ChallengeQuestionData) => void;
    removeChallengeQuestion: (index: number) => void;
  };
  
  // Rational Thoughts Management
  rationalActions: {
    updateRationalThoughts: (data: RationalThoughtData[]) => void;
    addRationalThought: (data: RationalThoughtData) => void;
    removeRationalThought: (index: number) => void;
  };
  
  // Schema Modes Management
  schemaActions: {
    updateSchemaModes: (data: SchemaModeData[]) => void;
    toggleSchemaMode: (index: number, isActive: boolean) => void;
  };
  
  // Action Plan Management
  actionActions: {
    updateActionPlan: (data: ActionPlanData) => void;
  };
  
  // Navigation & Validation
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
  
  // Status & Progress
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
  
  // Chat Integration
  chatIntegration: {
    sendToChat: (message: string) => Promise<boolean>;
    isIntegrationAvailable: boolean;
  };
  
  // Export Utilities
  utilities: {
    exportData: () => string;
    generateSummary: () => string;
    getFormattedOutput: () => string;
  };
}

export function useCBTDataManager(options: UseCBTDataManagerOptions = {}): UseCBTDataManagerReturn {
  const {
    sessionId,
    autoSaveDelay = 1000,
    enableValidation = true,
    enableChatIntegration = true,
  } = options;
  
  const dispatch = useDispatch();
  
  // Optimized selectors for performance
  const currentDraft = useSelector(selectCBTCurrentDraft);
  const sessionData = useSelector(selectCBTSessionData);
  const validationState = useSelector(selectCBTValidationState);
  const savedDrafts = useSelector(selectCBTSavedDrafts);
  const lastAutoSave = useSelector((state: RootState) => state.cbt.lastAutoSave);
  const hasHydratedFromRHF = useRef<boolean>(false);
  
  // Auto-save management
  const autoSaveTimeout = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  
  // Chat integration
  const { currentSessionId } = useChatUI();
  const chatBridge = useCBTChatBridge();
  
  // Auto-save with debouncing
  useEffect(() => {
    if (!currentDraft || autoSaveDelay <= 0) return;
    
    const currentDataString = JSON.stringify(currentDraft.data);
    
    // Only auto-save if data has actually changed
    if (currentDataString === lastDataRef.current) return;
    
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    autoSaveTimeout.current = setTimeout(() => {
      dispatch(saveDraft());
      lastDataRef.current = currentDataString;
    }, autoSaveDelay);
    
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [currentDraft, autoSaveDelay, dispatch]);
  
  // Initialize session if sessionId provided
  useEffect(() => {
    if (sessionId && sessionId !== sessionData.sessionId) {
      dispatch(startCBTSession({ sessionId }));
    }
  }, [sessionId, sessionData.sessionId, dispatch]);

  // Bridge: hydrate Redux session data from RHF localStorage draft (one-time)
  useEffect(() => {
    if (hasHydratedFromRHF.current) return;
    try {
      const draft = loadCBTDraft() as CBTFormInput | null;
      if (!draft) return;

      // Minimal guard to avoid clobbering existing populated state
      const isEmpty = !sessionData.situation && !sessionData.emotions && sessionData.thoughts.length === 0;
      if (!isEmpty) return;

      // Situation
      const situationData = { situation: draft.situation, date: draft.date };
      dispatch(updateSituation(situationData));

      // Emotions (use initial emotions for in-session work)
      dispatch(updateEmotions(draft.initialEmotions as unknown as EmotionData));

      // Thoughts
      if (Array.isArray(draft.automaticThoughts) && draft.automaticThoughts.length > 0) {
        dispatch(updateThoughts(draft.automaticThoughts as unknown as ThoughtData[]));
      }

      // Core beliefs (convert single text/credibility to array entry if available)
      if (draft.coreBeliefText && draft.coreBeliefText.trim().length > 0) {
        dispatch(updateCoreBeliefs([
          { coreBeliefText: draft.coreBeliefText, coreBeliefCredibility: draft.coreBeliefCredibility }
        ] as unknown as CoreBeliefData[]));
      }

      // Challenge questions
      if (Array.isArray(draft.challengeQuestions)) {
        dispatch(updateChallengeQuestions(draft.challengeQuestions as unknown as ChallengeQuestionData[]));
      }

      // Rational thoughts
      if (Array.isArray(draft.rationalThoughts)) {
        dispatch(updateRationalThoughts(draft.rationalThoughts as unknown as RationalThoughtData[]));
      }

      // Schema modes: map from consolidated SchemaMode[] -> SchemaModeData[]
      if (Array.isArray(draft.schemaModes)) {
        const mapped = draft.schemaModes.map((m) => ({
          mode: m.name,
          description: m.description,
          intensity: typeof m.intensity === 'number' ? m.intensity : 5,
          isActive: !!m.selected,
        }));
        dispatch(updateSchemaModes(mapped as unknown as SchemaModeData[]));
      }

      // Action plan (optional)
      if (draft.newBehaviors || (draft.alternativeResponses && draft.alternativeResponses.length > 0)) {
        const actionPlan = {
          finalEmotions: draft.finalEmotions,
          originalThoughtCredibility: draft.originalThoughtCredibility,
          newBehaviors: draft.newBehaviors,
          alternativeResponses: draft.alternativeResponses,
        } as unknown as ActionPlanData;
        dispatch(updateActionPlan(actionPlan));
      }

      hasHydratedFromRHF.current = true;
    } catch {
      // ignore hydration errors
    }
  }, [dispatch, sessionData]);
  
  // Draft Management Actions
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
  
  // Session Management Actions
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
  
  // Thought Management Actions
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
  
  // Core Belief Management Actions
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
  
  // Challenge Questions Management Actions
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
  
  // Rational Thoughts Management Actions  
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
  
  // Schema Modes Management Actions
  const schemaActions = useMemo(() => ({
    updateSchemaModes: (data: SchemaModeData[]) => {
      dispatch(updateSchemaModes(data));
    },
    
    toggleSchemaMode: (index: number, isActive: boolean) => {
      dispatch(toggleSchemaMode({ index, isActive }));
    },
  }), [dispatch]);
  
  // Action Plan Management Actions
  const actionActions = useMemo(() => ({
    updateActionPlan: (data: ActionPlanData) => {
      dispatch(updateActionPlan(data));
    },
  }), [dispatch]);
  
  // Navigation Logic
  const navigation = useMemo(() => {
    const currentStep = validationState.currentStep;
    const maxSteps = 8; // Total CBT steps
    
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
  }, [validationState.currentStep, dispatch]);
  
  // Validation Logic
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
      isFormValid: Object.keys(validationState.validationErrors).length === 0,
      errors: validationState.validationErrors,
      clearErrors: () => dispatch(clearValidationErrors()),
    };
  }, [currentDraft, validationState.validationErrors, enableValidation, dispatch]);
  
  // Status & Progress
  const status = useMemo(() => {
    const completedSteps = sessionData ? [
      sessionData.situation,
      sessionData.emotions, 
      sessionData.thoughts.length > 0,
      sessionData.coreBeliefs.length > 0,
      sessionData.challengeQuestions.length > 0,
      sessionData.rationalThoughts.length > 0,
      sessionData.schemaModes.length > 0,
      sessionData.actionPlan,
    ].filter(Boolean).length : 0;
    
    const totalSteps = 8;
    
    return {
      isSubmitting: validationState.isSubmitting,
      isDraftSaved: !!lastAutoSave && (new Date().getTime() - new Date(lastAutoSave).getTime()) < 5000,
      lastAutoSave,
      progress: {
        completedSteps,
        totalSteps,
        percentage: Math.round((completedSteps / totalSteps) * 100),
      },
    };
  }, [validationState.isSubmitting, lastAutoSave, sessionData]);
  
  // Chat Integration
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
  
  // Export Utilities
  const utilities = useMemo(() => ({
    exportData: (): string => {
      if (!currentDraft) return '';
      return JSON.stringify(currentDraft.data, null, 2);
    },
    
    generateSummary: (): string => {
      if (!sessionData) return '';
      
      const sections = [];
      
      if (sessionData.situation) {
        sections.push(`**Situation:** ${sessionData.situation.situation}`);
      }
      
      if (sessionData.emotions) {
        const emotions = Object.entries(sessionData.emotions)
          .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
          .map(([emotion, intensity]) => `${emotion}: ${intensity}/10`);
        if (emotions.length > 0) {
          sections.push(`**Emotions:** ${emotions.join(', ')}`);
        }
      }
      
      if (sessionData.thoughts.length > 0) {
        sections.push(`**Thoughts:** ${sessionData.thoughts.map(t => t.thought).join('; ')}`);
      }
      
      return sections.join('\n\n');
    },
    
    getFormattedOutput: (): string => {
      if (!currentDraft) return '';
      
      // Generate CBT summary card format
      return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(currentDraft.data)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
    },
  }), [currentDraft, sessionData]);
  
  return {
    // Current State
    currentDraft,
    sessionData,
    validationState,
    savedDrafts,
    
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
  };
}

/**
 * Lightweight hook for components that only need specific CBT data
 * This reduces unnecessary re-renders by subscribing only to relevant state slices
 */
export function useUnifiedCBTSelector<T>(
  selector: (state: RootState) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  return useSelector(selector, equalityFn);
}

/**
 * Hook for components that only need CBT actions without state subscriptions
 * This is useful for components that trigger actions but don't display state
 */
export function useUnifiedCBTActions() {
  const dispatch = useDispatch();
  
  return useMemo(() => ({
    // Draft actions
    createDraft: (id: string) => dispatch(createDraft({ id })),
    updateDraft: (data: Partial<CBTFormData>) => dispatch(updateDraft(data)),
    saveDraft: () => dispatch(saveDraft()),
    deleteDraft: (id: string) => dispatch(deleteDraft(id)),
    
    // Session actions
    startSession: (sessionId: string) => dispatch(startCBTSession({ sessionId })),
    clearSession: () => dispatch(clearCBTSession()),
    
    // Content actions
    updateSituation: (data: SituationData) => dispatch(updateSituation(data)),
    updateEmotions: (data: EmotionData) => dispatch(updateEmotions(data)),
    addThought: (data: ThoughtData) => dispatch(addThought(data)),
    addCoreBelief: (data: CoreBeliefData) => dispatch(addCoreBelief(data)),
    
    // Navigation actions
    setCurrentStep: (step: number) => dispatch(setCurrentStep(step)),
    setSubmitting: (isSubmitting: boolean) => dispatch(setSubmitting(isSubmitting)),
  }), [dispatch]);
}

// Backward compatibility exports
export const useUnifiedCBT = useCBTDataManager;
export type UseUnifiedCBTOptions = UseCBTDataManagerOptions;
export type UseUnifiedCBTReturn = UseCBTDataManagerReturn;