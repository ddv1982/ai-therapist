import { createSlice, PayloadAction } from '@reduxjs/toolkit';
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

export type CBTStep =
  | 'situation'
  | 'emotions'
  | 'thoughts'
  | 'core-beliefs'
  | 'challenge-questions'
  | 'rational-thoughts'
  | 'schema-modes'
  | 'action-plan'
  | 'reflection';

interface CBTSessionState {
  sessionId: string | null;
  currentStep: CBTStep;
  isSubmitting: boolean;

  // CBT form data
  situation: SituationData | null;
  emotions: EmotionData | null;
  thoughts: ThoughtData[];
  coreBeliefs: CoreBeliefData[];
  challengeQuestions: ChallengeQuestionData[];
  rationalThoughts: RationalThoughtData[];
  schemaModes: SchemaModeData[];
  actionPlan: ActionPlanData | null;

  // Metadata
  startedAt: string | null;
  lastModified: string | null;
}

const initialState: CBTSessionState = {
  sessionId: null,
  currentStep: 'situation',
  isSubmitting: false,
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

const cbtSessionSlice = createSlice({
  name: 'cbtSession',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<{ sessionId: string }>) => {
      state.sessionId = action.payload.sessionId;
      state.currentStep = 'situation';
      state.isSubmitting = false;
      state.startedAt = new Date().toISOString();
      state.lastModified = new Date().toISOString();
    },

    setCurrentStep: (state, action: PayloadAction<CBTStep>) => {
      state.currentStep = action.payload;
      state.lastModified = new Date().toISOString();
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },

    // Situation actions
    updateSituation: (state, action: PayloadAction<SituationData>) => {
      state.situation = action.payload;
      state.lastModified = new Date().toISOString();
    },

    // Emotion actions
    updateEmotions: (state, action: PayloadAction<EmotionData>) => {
      state.emotions = action.payload;
      state.lastModified = new Date().toISOString();
    },

    clearEmotions: (state) => {
      state.emotions = null;
      state.lastModified = new Date().toISOString();
    },

    // Thought actions
    updateThoughts: (state, action: PayloadAction<ThoughtData[]>) => {
      state.thoughts = action.payload;
      state.lastModified = new Date().toISOString();
    },

    addThought: (state, action: PayloadAction<ThoughtData>) => {
      state.thoughts.push(action.payload);
      state.lastModified = new Date().toISOString();
    },

    removeThought: (state, action: PayloadAction<number>) => {
      state.thoughts.splice(action.payload, 1);
      state.lastModified = new Date().toISOString();
    },

    // Core belief actions
    updateCoreBeliefs: (state, action: PayloadAction<CoreBeliefData[]>) => {
      state.coreBeliefs = action.payload;
      state.lastModified = new Date().toISOString();
    },

    addCoreBelief: (state, action: PayloadAction<CoreBeliefData>) => {
      state.coreBeliefs.push(action.payload);
      state.lastModified = new Date().toISOString();
    },

    removeCoreBelief: (state, action: PayloadAction<number>) => {
      state.coreBeliefs.splice(action.payload, 1);
      state.lastModified = new Date().toISOString();
    },

    // Challenge question actions
    updateChallengeQuestions: (state, action: PayloadAction<ChallengeQuestionData[]>) => {
      state.challengeQuestions = action.payload;
      state.lastModified = new Date().toISOString();
    },

    addChallengeQuestion: (state, action: PayloadAction<ChallengeQuestionData>) => {
      state.challengeQuestions.push(action.payload);
      state.lastModified = new Date().toISOString();
    },

    removeChallengeQuestion: (state, action: PayloadAction<number>) => {
      state.challengeQuestions.splice(action.payload, 1);
      state.lastModified = new Date().toISOString();
    },

    // Rational thought actions
    updateRationalThoughts: (state, action: PayloadAction<RationalThoughtData[]>) => {
      state.rationalThoughts = action.payload;
      state.lastModified = new Date().toISOString();
    },

    addRationalThought: (state, action: PayloadAction<RationalThoughtData>) => {
      state.rationalThoughts.push(action.payload);
      state.lastModified = new Date().toISOString();
    },

    removeRationalThought: (state, action: PayloadAction<number>) => {
      state.rationalThoughts.splice(action.payload, 1);
      state.lastModified = new Date().toISOString();
    },

    // Schema mode actions
    updateSchemaModes: (state, action: PayloadAction<SchemaModeData[]>) => {
      state.schemaModes = action.payload;
      state.lastModified = new Date().toISOString();
    },

    toggleSchemaMode: (state, action: PayloadAction<{ index: number; isActive: boolean }>) => {
      const mode = state.schemaModes[action.payload.index];
      if (mode) {
        mode.isActive = action.payload.isActive;
        state.lastModified = new Date().toISOString();
      }
    },

    // Action plan actions
    updateActionPlan: (state, action: PayloadAction<ActionPlanData>) => {
      state.actionPlan = action.payload;
      state.lastModified = new Date().toISOString();
    },

    // Session management
    clearSession: (state) => {
      state.sessionId = null;
      state.currentStep = 'situation';
      state.isSubmitting = false;
      state.situation = null;
      state.emotions = null;
      state.thoughts = [];
      state.coreBeliefs = [];
      state.challengeQuestions = [];
      state.rationalThoughts = [];
      state.schemaModes = [];
      state.actionPlan = null;
      state.startedAt = null;
      state.lastModified = null;
    },
  },
});

export const {
  startSession,
  setCurrentStep,
  setSubmitting,
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
  clearSession,
} = cbtSessionSlice.actions;

export default cbtSessionSlice.reducer;
