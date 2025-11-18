import { configureStore } from '@reduxjs/toolkit';
import cbtReducer, {
  createDraft,
  updateDraft,
  setCurrentStep,
  setValidationErrors,
  clearValidationErrors,
} from '@/store/slices/cbt-slice';

describe('cbt-slice', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        cbt: cbtReducer,
      },
    });

  type TestStore = ReturnType<typeof createTestStore>;
  type TestState = ReturnType<TestStore['getState']>;

  let store: TestStore;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('createDraft', () => {
    it('creates new draft with id', () => {
      store.dispatch(createDraft({ id: 'draft-123' }));

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.currentDraft).not.toBeNull();
      expect(state.currentDraft?.id).toBe('draft-123');
      expect(state.currentDraft?.currentStep).toBe(1);
      expect(state.currentDraft?.isComplete).toBe(false);
    });

    it('resets validation errors', () => {
      store.dispatch(setValidationErrors({ field: 'error' }));
      store.dispatch(createDraft({ id: 'draft-123' }));

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.validationErrors).toEqual({});
    });
  });

  describe('updateDraft', () => {
    it('updates draft data', () => {
      store.dispatch(createDraft({ id: 'draft-123' }));
      store.dispatch(updateDraft({ situation: 'Test situation' }));

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.currentDraft?.data.situation).toBe('Test situation');
    });

    it('merges data without overwriting', () => {
      store.dispatch(createDraft({ id: 'draft-123' }));
      store.dispatch(updateDraft({ situation: 'Test situation' }));
      store.dispatch(updateDraft({ emotions: [{ emotion: 'anxiety', intensity: 7 }] }));

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.currentDraft?.data.situation).toBe('Test situation');
      expect(state.currentDraft?.data.emotions?.[0]).toEqual({ emotion: 'anxiety', intensity: 7 });
    });
  });

  describe('setCurrentStep', () => {
    it('updates current step', () => {
      store.dispatch(setCurrentStep(3));

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.currentStep).toBe(3);
    });
  });

  describe('setCurrentStep', () => {
    it('updates current step', () => {
      store.dispatch(setCurrentStep(3));

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.currentStep).toBe(3);
    });
  });

  describe('validation errors', () => {
    it('sets validation errors', () => {
      store.dispatch(setValidationErrors({ field1: 'Error 1', field2: 'Error 2' }));

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.validationErrors.field1).toBe('Error 1');
      expect(state.validationErrors.field2).toBe('Error 2');
    });

    it('clears validation errors', () => {
      store.dispatch(setValidationErrors({ field: 'Error' }));
      store.dispatch(clearValidationErrors());

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.validationErrors).toEqual({});
    });
  });

  describe('setCurrentStep', () => {
    it('updates current step', () => {
      store.dispatch(setCurrentStep(3));

      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.currentStep).toBe(3);
    });
  });

  describe('transitionFlow', () => {
    it('transitions flow state', () => {
      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.flow).toBeDefined();
      expect(state.flow.currentStepId).toBeDefined();
    });

    it('has initial current step', () => {
      const state: TestState['cbt'] = store.getState().cbt;
      expect(state.currentStep).toBeGreaterThanOrEqual(1);
    });
  });
});
