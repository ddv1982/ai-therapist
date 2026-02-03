'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  createInitialState as createFlowState,
  getStepNumber,
  transition as flowTransition,
  type CBTFlowEvent,
  type CBTFlowState,
  type CBTStepId,
  TOTAL_CBT_STEPS,
} from '@/features/therapy/cbt/flow';
import type { CBTFormData } from '@/features/therapy/cbt/form-schema';

export interface CBTDraft {
  id: string;
  data: Partial<CBTFormData>;
  currentStep: number;
  lastSaved: string;
  isComplete: boolean;
}

interface CBTState {
  currentDraft: CBTDraft | null;
  savedDrafts: CBTDraft[];
  completedEntries: CBTFormData[];
  currentStep: number;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
  lastAutoSave: string | null;
  flow: CBTFlowState;
}

interface CBTContextValue extends CBTState {
  createDraft: (payload: { id: string }) => void;
  updateDraft: (data: Partial<CBTFormData>) => void;
  setCurrentStep: (step: number) => void;
  saveDraft: () => void;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => void;
  completeCBTEntry: (data: CBTFormData) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setValidationErrors: (errors: Record<string, string>) => void;
  clearValidationErrors: () => void;
  resetCurrentDraft: () => void;
  startCBTSession: (payload?: { sessionId?: string }) => void;
  applyCBTEvent: (event: CBTFlowEvent) => void;
  hydrateCBTSession: (flowState: CBTFlowState) => void;
  clearCBTSession: () => void;
}

const CBTContext = createContext<CBTContextValue | undefined>(undefined);

function deriveCurrentStepNumber(flow: CBTFlowState): number {
  if (flow.currentStepId === 'complete') return TOTAL_CBT_STEPS;
  return getStepNumber(flow.currentStepId as CBTStepId);
}

const initialFlowState = createFlowState();

const initialState: CBTState = {
  currentDraft: null,
  savedDrafts: [],
  completedEntries: [],
  currentStep: 1,
  isSubmitting: false,
  validationErrors: {},
  lastAutoSave: null,
  flow: initialFlowState,
};

export function CBTProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CBTState>(initialState);

  const createDraft = useCallback((payload: { id: string }) => {
    setState((prev) => ({
      ...prev,
      currentDraft: {
        id: payload.id,
        data: {},
        currentStep: 1,
        lastSaved: new Date().toISOString(),
        isComplete: false,
      },
      currentStep: 1,
      validationErrors: {},
    }));
  }, []);

  const updateDraft = useCallback((data: Partial<CBTFormData>) => {
    setState((prev) => {
      if (!prev.currentDraft) return prev;
      return {
        ...prev,
        currentDraft: {
          ...prev.currentDraft,
          data: { ...prev.currentDraft.data, ...data },
          lastSaved: new Date().toISOString(),
        },
        lastAutoSave: new Date().toISOString(),
      };
    });
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
      currentDraft: prev.currentDraft
        ? { ...prev.currentDraft, currentStep: step }
        : prev.currentDraft,
    }));
  }, []);

  const saveDraft = useCallback(() => {
    setState((prev) => {
      if (!prev.currentDraft) return prev;
      const existingDraftIndex = prev.savedDrafts.findIndex(
        (draft) => draft.id === prev.currentDraft!.id
      );
      const updatedSavedDrafts = [...prev.savedDrafts];
      if (existingDraftIndex >= 0) {
        updatedSavedDrafts[existingDraftIndex] = { ...prev.currentDraft };
      } else {
        updatedSavedDrafts.push({ ...prev.currentDraft });
      }
      return {
        ...prev,
        savedDrafts: updatedSavedDrafts,
        currentDraft: {
          ...prev.currentDraft,
          lastSaved: new Date().toISOString(),
        },
      };
    });
  }, []);

  const loadDraft = useCallback((id: string) => {
    setState((prev) => {
      const draft = prev.savedDrafts.find((item) => item.id === id);
      if (!draft) return prev;
      return {
        ...prev,
        currentDraft: { ...draft },
        currentStep: draft.currentStep,
      };
    });
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      savedDrafts: prev.savedDrafts.filter((draft) => draft.id !== id),
      currentDraft: prev.currentDraft?.id === id ? null : prev.currentDraft,
      currentStep: prev.currentDraft?.id === id ? 1 : prev.currentStep,
      lastAutoSave: null,
    }));
  }, []);

  const completeCBTEntry = useCallback((data: CBTFormData) => {
    setState((prev) => ({
      ...prev,
      completedEntries: [...prev.completedEntries, data],
      currentDraft: prev.currentDraft ? { ...prev.currentDraft, isComplete: true } : null,
      currentStep: 1,
      validationErrors: {},
      isSubmitting: false,
    }));
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting }));
  }, []);

  const setValidationErrors = useCallback((errors: Record<string, string>) => {
    setState((prev) => ({ ...prev, validationErrors: errors }));
  }, []);

  const clearValidationErrors = useCallback(() => {
    setState((prev) => ({ ...prev, validationErrors: {} }));
  }, []);

  const resetCurrentDraft = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentDraft: null,
      currentStep: 1,
      validationErrors: {},
      isSubmitting: false,
      lastAutoSave: null,
    }));
  }, []);

  const startCBTSession = useCallback((payload?: { sessionId?: string }) => {
    setState((prev) => {
      const newFlow = flowTransition(prev.flow, {
        type: 'SESSION_START',
        sessionId: payload?.sessionId ?? null,
      });
      return {
        ...prev,
        flow: newFlow,
        currentStep: deriveCurrentStepNumber(newFlow),
        validationErrors: {},
      };
    });
  }, []);

  const applyCBTEvent = useCallback((event: CBTFlowEvent) => {
    setState((prev) => {
      const newFlow = flowTransition(prev.flow, event);
      return {
        ...prev,
        flow: newFlow,
        currentStep: deriveCurrentStepNumber(newFlow),
        lastAutoSave: new Date().toISOString(),
      };
    });
  }, []);

  const hydrateCBTSession = useCallback((flowState: CBTFlowState) => {
    setState((prev) => ({
      ...prev,
      flow: flowState,
      currentStep: deriveCurrentStepNumber(flowState),
    }));
  }, []);

  const clearCBTSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      flow: createFlowState(),
      currentStep: 1,
      validationErrors: {},
      isSubmitting: false,
      lastAutoSave: null,
    }));
  }, []);

  const value: CBTContextValue = {
    ...state,
    createDraft,
    updateDraft,
    setCurrentStep,
    saveDraft,
    loadDraft,
    deleteDraft,
    completeCBTEntry,
    setSubmitting,
    setValidationErrors,
    clearValidationErrors,
    resetCurrentDraft,
    startCBTSession,
    applyCBTEvent,
    hydrateCBTSession,
    clearCBTSession,
  };

  return <CBTContext value={value}>{children}</CBTContext>;
}

export function useCBT() {
  const context = useContext(CBTContext);
  if (!context) {
    throw new Error('useCBT must be used within a CBTProvider');
  }
  return context;
}
