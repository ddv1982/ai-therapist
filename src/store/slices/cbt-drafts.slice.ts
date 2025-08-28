import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CBTFormData, CBTDraft } from './cbtSlice';

interface CBTDraftsState {
  currentDraft: CBTDraft | null;
  savedDrafts: CBTDraft[];
  completedEntries: CBTFormData[];
  lastAutoSave: string | null;
  isCompleted: boolean;
  completionTimestamp: string | null;
  completedSessionId: string | null;
}

const initialState: CBTDraftsState = {
  currentDraft: null,
  savedDrafts: [],
  completedEntries: [],
  lastAutoSave: null,
  isCompleted: false,
  completionTimestamp: null,
  completedSessionId: null,
};

const cbtDraftsSlice = createSlice({
  name: 'cbtDrafts',
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
    },

    updateDraft: (state, action: PayloadAction<Partial<CBTFormData>>) => {
      if (state.currentDraft) {
        state.currentDraft.data = { ...state.currentDraft.data, ...action.payload };
        state.currentDraft.lastSaved = new Date().toISOString();
        state.lastAutoSave = new Date().toISOString();
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
      }
    },

    deleteDraft: (state, action: PayloadAction<string>) => {
      state.savedDrafts = state.savedDrafts.filter(d => d.id !== action.payload);
      if (state.currentDraft?.id === action.payload) {
        state.currentDraft = null;
        state.lastAutoSave = null;
      }
    },

    completeEntry: (state, action: PayloadAction<CBTFormData>) => {
      state.completedEntries.push(action.payload);
      if (state.currentDraft) {
        state.currentDraft.isComplete = true;
        state.currentDraft = null;
      }
      state.lastAutoSave = null;
    },

    resetCurrentDraft: (state) => {
      state.currentDraft = null;
      state.lastAutoSave = null;
      state.isCompleted = false;
      state.completionTimestamp = null;
      state.completedSessionId = null;
    },

    markAsCompleted: (state, action: PayloadAction<{ sessionId: string }>) => {
      state.isCompleted = true;
      state.completionTimestamp = new Date().toISOString();
      state.completedSessionId = action.payload.sessionId;
      // Clear the current draft since it's been sent to chat
      state.currentDraft = null;
      state.lastAutoSave = null;
    },

    resetCompletionStatus: (state) => {
      state.isCompleted = false;
      state.completionTimestamp = null;
      state.completedSessionId = null;
    },
  },
});

export const {
  createDraft,
  updateDraft,
  saveDraft,
  loadDraft,
  deleteDraft,
  completeEntry,
  resetCurrentDraft,
  markAsCompleted,
  resetCompletionStatus,
} = cbtDraftsSlice.actions;

export default cbtDraftsSlice.reducer;
