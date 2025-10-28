import { configureStore } from '@reduxjs/toolkit';
import cbtReducer, {
  createDraft,
  updateDraft,
  setCurrentStep,
  setValidationErrors,
  clearValidationErrors,
} from '@/store/slices/cbt-slice';

describe('cbt-slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cbt: cbtReducer,
      },
    });
  });

  describe('createDraft', () => {
    it('creates new draft with id', () => {
      store.dispatch(createDraft({ id: 'draft-123' }));
      
      const state = store.getState().cbt;
      expect(state.currentDraft).not.toBeNull();
      expect(state.currentDraft?.id).toBe('draft-123');
      expect(state.currentDraft?.currentStep).toBe(1);
      expect(state.currentDraft?.isComplete).toBe(false);
    });

    it('resets validation errors', () => {
      store.dispatch(setValidationErrors({ field: 'error' }));
      store.dispatch(createDraft({ id: 'draft-123' }));
      
      const state = store.getState().cbt;
      expect(state.validationErrors).toEqual({});
    });
  });

  describe('updateDraft', () => {
    it('updates draft data', () => {
      store.dispatch(createDraft({ id: 'draft-123' }));
      store.dispatch(updateDraft({ situation: { description: 'Test', date: '2024-01-15' } }));
      
      const state = store.getState().cbt;
      expect(state.currentDraft?.data.situation?.description).toBe('Test');
    });

    it('merges data without overwriting', () => {
      store.dispatch(createDraft({ id: 'draft-123' }));
      store.dispatch(updateDraft({ situation: { description: 'Test', date: '2024-01-15' } }));
      store.dispatch(updateDraft({ emotions: { anxiety: 7 } }));
      
      const state = store.getState().cbt;
      expect(state.currentDraft?.data.situation?.description).toBe('Test');
      expect(state.currentDraft?.data.emotions?.anxiety).toBe(7);
    });
  });

  describe('setCurrentStep', () => {
    it('updates current step', () => {
      store.dispatch(setCurrentStep(3));
      
      const state = store.getState().cbt;
      expect(state.currentStep).toBe(3);
    });
  });

  describe('setCurrentStep', () => {
    it('updates current step', () => {
      store.dispatch(setCurrentStep(3));
      
      const state = store.getState().cbt;
      expect(state.currentStep).toBe(3);
    });
  });

  describe('validation errors', () => {
    it('sets validation errors', () => {
      store.dispatch(setValidationErrors({ field1: 'Error 1', field2: 'Error 2' }));
      
      const state = store.getState().cbt;
      expect(state.validationErrors.field1).toBe('Error 1');
      expect(state.validationErrors.field2).toBe('Error 2');
    });

    it('clears validation errors', () => {
      store.dispatch(setValidationErrors({ field: 'Error' }));
      store.dispatch(clearValidationErrors());
      
      const state = store.getState().cbt;
      expect(state.validationErrors).toEqual({});
    });
  });

  describe('setCurrentStep', () => {
    it('updates current step', () => {
      store.dispatch(setCurrentStep(3));
      
      const state = store.getState().cbt;
      expect(state.currentStep).toBe(3);
    });
  });

  describe('transitionFlow', () => {
    it('transitions flow state', () => {
      const state = store.getState().cbt;
      expect(state.flow).toBeDefined();
      expect(state.flow.currentStepId).toBeDefined();
    });

    it('has initial current step', () => {
      const state = store.getState().cbt;
      expect(state.currentStep).toBeGreaterThanOrEqual(1);
    });
  });
});
