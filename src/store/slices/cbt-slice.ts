import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  createInitialState as createFlowState,
  getStepNumber,
  transition as flowTransition,
  type CBTFlowEvent,
  type CBTFlowState,
  type CBTStepId,
  TOTAL_CBT_STEPS,
} from '@/features/therapy/cbt/flow';
// Move schema to features to keep store focused on state/actions
export { cbtFormSchema } from '@/features/therapy/cbt/form-schema';
import type { CBTFormData } from '@/features/therapy/cbt/form-schema';
export type { CBTFormData } from '@/features/therapy/cbt/form-schema';

export interface CBTDraft {
  id: string;
  data: Partial<CBTFormData>;
  currentStep: number;
  lastSaved: string;
  isComplete: boolean;
}

// Re-export CBT types from unified therapy types for backward compatibility
export type {
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionData,
  RationalThoughtData,
  SchemaModeData,
  ActionPlanData,
} from '@/types/therapy';

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

function deriveCurrentStepNumber(flow: CBTFlowState): number {
  if (flow.currentStepId === 'complete') return TOTAL_CBT_STEPS;
  return getStepNumber(flow.currentStepId as CBTStepId);
}

const cbtSlice = createSlice({
  name: 'cbt',
  initialState,
  reducers: {
    createDraft: (state, action: PayloadAction<{ id: string }>) => {
      state.currentDraft = {
        id: action.payload.id,
        data: {},
        currentStep: 1,
        lastSaved: new Date().toISOString(),
        isComplete: false,
      };
      state.currentStep = 1;
      state.validationErrors = {};
    },
    updateDraft: (state, action: PayloadAction<Partial<CBTFormData>>) => {
      if (state.currentDraft) {
        state.currentDraft.data = { ...state.currentDraft.data, ...action.payload };
        state.currentDraft.lastSaved = new Date().toISOString();
        state.lastAutoSave = new Date().toISOString();
      }
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
      if (state.currentDraft) {
        state.currentDraft.currentStep = action.payload;
      }
    },
    saveDraft: (state) => {
      if (!state.currentDraft) return;
      const existingDraftIndex = state.savedDrafts.findIndex(
        (draft) => draft.id === state.currentDraft!.id
      );
      if (existingDraftIndex >= 0) {
        state.savedDrafts[existingDraftIndex] = { ...state.currentDraft };
      } else {
        state.savedDrafts.push({ ...state.currentDraft });
      }
      state.currentDraft.lastSaved = new Date().toISOString();
    },
    loadDraft: (state, action: PayloadAction<string>) => {
      const draft = state.savedDrafts.find((item) => item.id === action.payload);
      if (!draft) return;
      state.currentDraft = { ...draft };
      state.currentStep = draft.currentStep;
    },
    deleteDraft: (state, action: PayloadAction<string>) => {
      state.savedDrafts = state.savedDrafts.filter((draft) => draft.id !== action.payload);
      if (state.currentDraft?.id === action.payload) {
        state.currentDraft = null;
        state.currentStep = 1;
      }
      state.lastAutoSave = null;
    },
    completeCBTEntry: (state, action: PayloadAction<CBTFormData>) => {
      state.completedEntries.push(action.payload);
      if (state.currentDraft) {
        state.currentDraft.isComplete = true;
        state.currentDraft = null;
      }
      state.currentStep = 1;
      state.validationErrors = {};
      state.isSubmitting = false;
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.validationErrors = action.payload;
    },
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },
    resetCurrentDraft: (state) => {
      state.currentDraft = null;
      state.currentStep = 1;
      state.validationErrors = {};
      state.isSubmitting = false;
      state.lastAutoSave = null;
    },
    startCBTSession: (state, action: PayloadAction<{ sessionId?: string } | undefined>) => {
      state.flow = flowTransition(state.flow, {
        type: 'SESSION_START',
        sessionId: action.payload?.sessionId ?? null,
      });
      state.currentStep = deriveCurrentStepNumber(state.flow);
      state.validationErrors = {};
    },
    applyCBTEvent: (state, action: PayloadAction<CBTFlowEvent>) => {
      state.flow = flowTransition(state.flow, action.payload);
      state.currentStep = deriveCurrentStepNumber(state.flow);
      state.lastAutoSave = new Date().toISOString();
    },
    hydrateCBTSession: (state, action: PayloadAction<CBTFlowState>) => {
      state.flow = action.payload;
      state.currentStep = deriveCurrentStepNumber(state.flow);
    },
    clearCBTSession: (state) => {
      state.flow = createFlowState();
      state.currentStep = 1;
      state.validationErrors = {};
      state.isSubmitting = false;
      state.lastAutoSave = null;
    },
  },
});

export const {
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
} = cbtSlice.actions;

export default cbtSlice.reducer;
