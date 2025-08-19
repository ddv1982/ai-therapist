import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { z } from 'zod';
import type {
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionData,
  RationalThoughtData,
  SchemaModeData,
  ActionPlanData,
  SituationData
} from '@/types/therapy';

// CBT Form Schema with Zod validation
export const cbtFormSchema = z.object({
  situation: z.string().min(10, 'Please describe the situation in at least 10 characters'),
  emotions: z.array(z.object({
    emotion: z.string().min(1, 'Emotion name is required'),
    intensity: z.number().min(0, 'Intensity must be 0-10').max(10, 'Intensity must be 0-10')
  })).min(1, 'Please rate at least one emotion'),
  thoughts: z.array(z.string().min(5, 'Each thought must be at least 5 characters')).min(1, 'Please record at least one thought'),
  coreBeliefs: z.array(z.string().min(5, 'Core belief must be at least 5 characters')).optional(),
  challengeQuestions: z.array(z.object({
    question: z.string(),
    answer: z.string().min(10, 'Please provide a thoughtful answer')
  })).optional(),
  rationalThoughts: z.array(z.string().min(10, 'Rational thoughts must be at least 10 characters')).optional(),
  schemaModes: z.array(z.object({
    mode: z.string(),
    description: z.string(),
    intensity: z.number().min(0).max(10)
  })).optional(),
  actionPlan: z.object({
    actions: z.array(z.string().min(5, 'Action must be at least 5 characters')),
    timeframe: z.string().optional(),
    resources: z.array(z.string()).optional()
  }).optional(),
});

export type CBTFormData = z.infer<typeof cbtFormSchema>;

export interface CBTDraft {
  id: string;
  data: Partial<CBTFormData>;
  currentStep: number;
  lastSaved: string; // Changed from Date to string (ISO format)
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
  ActionPlanData
} from '@/types/therapy';

interface CBTState {
  currentDraft: CBTDraft | null;
  savedDrafts: CBTDraft[];
  completedEntries: CBTFormData[];
  currentStep: number;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
  lastAutoSave: string | null; // Changed from Date to string (ISO format)
  // Session-scoped data for current CBT session
  sessionData: {
    sessionId: string | null;
    situation: SituationData | null;
    emotions: EmotionData | null;
    thoughts: ThoughtData[];
    coreBeliefs: CoreBeliefData[];
    challengeQuestions: ChallengeQuestionData[];
    rationalThoughts: RationalThoughtData[];
    schemaModes: SchemaModeData[];
    actionPlan: ActionPlanData | null;
    startedAt: string | null; // Changed from Date to string (ISO format)
    lastModified: string | null; // Changed from Date to string (ISO format)
  };
}

const initialState: CBTState = {
  currentDraft: null,
  savedDrafts: [],
  completedEntries: [],
  currentStep: 1,
  isSubmitting: false,
  validationErrors: {},
  lastAutoSave: null,
  sessionData: {
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
  },
};

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
      if (state.currentDraft) {
        const existingDraftIndex = state.savedDrafts.findIndex(d => d.id === state.currentDraft!.id);
        if (existingDraftIndex >= 0) {
          state.savedDrafts[existingDraftIndex] = { ...state.currentDraft };
        } else {
          state.savedDrafts.push({ ...state.currentDraft });
        }
        state.currentDraft.lastSaved = new Date().toISOString();
      }
    },
    loadDraft: (state, action: PayloadAction<string>) => {
      const draft = state.savedDrafts.find(d => d.id === action.payload);
      if (draft) {
        state.currentDraft = { ...draft };
        state.currentStep = draft.currentStep;
      }
    },
    deleteDraft: (state, action: PayloadAction<string>) => {
      state.savedDrafts = state.savedDrafts.filter(d => d.id !== action.payload);
      if (state.currentDraft?.id === action.payload) {
        state.currentDraft = null;
        state.currentStep = 1;
      }
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
    },
    // Session-scoped actions for Redux-only draft management
    startCBTSession: (state, action: PayloadAction<{ sessionId: string }>) => {
      state.sessionData = {
        sessionId: action.payload.sessionId,
        situation: null,
        emotions: null,
        thoughts: [],
        coreBeliefs: [],
        challengeQuestions: [],
        rationalThoughts: [],
        schemaModes: [],
        actionPlan: null,
        startedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      state.currentStep = 1;
      state.validationErrors = {};
    },
    updateSituation: (state, action: PayloadAction<SituationData>) => {
      state.sessionData.situation = action.payload;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    updateEmotions: (state, action: PayloadAction<EmotionData>) => {
      state.sessionData.emotions = action.payload;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    clearEmotions: (state) => {
      state.sessionData.emotions = null;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    updateThoughts: (state, action: PayloadAction<ThoughtData[]>) => {
      state.sessionData.thoughts = action.payload;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    addThought: (state, action: PayloadAction<ThoughtData>) => {
      state.sessionData.thoughts.push(action.payload);
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    removeThought: (state, action: PayloadAction<number>) => {
      state.sessionData.thoughts.splice(action.payload, 1);
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    updateCoreBeliefs: (state, action: PayloadAction<CoreBeliefData[]>) => {
      state.sessionData.coreBeliefs = action.payload;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    addCoreBelief: (state, action: PayloadAction<CoreBeliefData>) => {
      state.sessionData.coreBeliefs.push(action.payload);
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    removeCoreBelief: (state, action: PayloadAction<number>) => {
      state.sessionData.coreBeliefs.splice(action.payload, 1);
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    updateChallengeQuestions: (state, action: PayloadAction<ChallengeQuestionData[]>) => {
      state.sessionData.challengeQuestions = action.payload;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    addChallengeQuestion: (state, action: PayloadAction<ChallengeQuestionData>) => {
      state.sessionData.challengeQuestions.push(action.payload);
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    removeChallengeQuestion: (state, action: PayloadAction<number>) => {
      state.sessionData.challengeQuestions.splice(action.payload, 1);
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    updateRationalThoughts: (state, action: PayloadAction<RationalThoughtData[]>) => {
      state.sessionData.rationalThoughts = action.payload;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    addRationalThought: (state, action: PayloadAction<RationalThoughtData>) => {
      state.sessionData.rationalThoughts.push(action.payload);
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    removeRationalThought: (state, action: PayloadAction<number>) => {
      state.sessionData.rationalThoughts.splice(action.payload, 1);
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    updateSchemaModes: (state, action: PayloadAction<SchemaModeData[]>) => {
      state.sessionData.schemaModes = action.payload;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    toggleSchemaMode: (state, action: PayloadAction<{ index: number; isActive: boolean }>) => {
      const mode = state.sessionData.schemaModes[action.payload.index];
      if (mode) {
        mode.isActive = action.payload.isActive;
        state.sessionData.lastModified = new Date().toISOString();
        state.lastAutoSave = new Date().toISOString();
      }
    },
    updateActionPlan: (state, action: PayloadAction<ActionPlanData>) => {
      state.sessionData.actionPlan = action.payload;
      state.sessionData.lastModified = new Date().toISOString();
      state.lastAutoSave = new Date().toISOString();
    },
    clearCBTSession: (state) => {
      state.sessionData = {
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
      state.currentStep = 1;
      state.validationErrors = {};
      state.isSubmitting = false;
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
} = cbtSlice.actions;

export default cbtSlice.reducer;