import reducer, {
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
} from '@/store/slices/cbt-slice';

describe('cbtSlice reducer', () => {
  it('should return initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any);
    expect(state.currentDraft).toBeNull();
    expect(state.savedDrafts).toEqual([]);
    expect(state.completedEntries).toEqual([]);
    expect(state.currentStep).toBe(1);
  });

  it('createDraft should create a new draft and reset state', () => {
    const state = reducer(undefined, createDraft({ id: 'd1' }));
    expect(state.currentDraft?.id).toBe('d1');
    expect(state.currentStep).toBe(1);
    expect(state.validationErrors).toEqual({});
  });

  it('updateDraft should merge data and set timestamps', () => {
    const pre = reducer(undefined, createDraft({ id: 'd1' }));
    const state = reducer(
      pre,
      updateDraft({ situation: 'A detailed situation description' } as any)
    );
    expect(state.currentDraft?.data).toMatchObject({
      situation: 'A detailed situation description',
    });
    expect(state.currentDraft?.lastSaved).toEqual(expect.any(String));
    expect(state.lastAutoSave).toEqual(expect.any(String));
  });

  it('setCurrentStep should update both slice and draft', () => {
    const pre = reducer(undefined, createDraft({ id: 'd1' }));
    const state = reducer(pre, setCurrentStep(3));
    expect(state.currentStep).toBe(3);
    expect(state.currentDraft?.currentStep).toBe(3);
  });

  it('saveDraft should insert or update savedDrafts', () => {
    let state = reducer(undefined, createDraft({ id: 'd1' }));
    state = reducer(state, saveDraft());
    expect(state.savedDrafts.find((d) => d.id === 'd1')).toBeTruthy();

    state = reducer(state, updateDraft({ situation: 'Changed' } as any));
    state = reducer(state, saveDraft());
    expect(state.savedDrafts.find((d) => d.id === 'd1')?.data).toMatchObject({
      situation: 'Changed',
    });
  });

  it('loadDraft should set currentDraft and currentStep', () => {
    let state = reducer(undefined, createDraft({ id: 'd1' }));
    state = reducer(state, setCurrentStep(4));
    state = reducer(state, saveDraft());
    state = reducer(state, resetCurrentDraft());
    const after = reducer(state, loadDraft('d1'));
    expect(after.currentDraft?.id).toBe('d1');
    expect(after.currentStep).toBe(4);
  });

  it('deleteDraft should remove draft and reset current if needed', () => {
    let state = reducer(undefined, createDraft({ id: 'd1' }));
    state = reducer(state, saveDraft());
    const after = reducer(state, deleteDraft('d1'));
    expect(after.savedDrafts.find((d) => d.id === 'd1')).toBeUndefined();
    expect(after.currentDraft).toBeNull();
    expect(after.currentStep).toBe(1);
    expect(after.lastAutoSave).toBeNull();
  });

  it('completeCBTEntry should push entry and clear draft', () => {
    const state = reducer(undefined, createDraft({ id: 'd1' }));
    const entry = {
      situation: 'something',
      emotions: [{ emotion: 'fear', intensity: 5 }],
      thoughts: ['ok'],
    } as any;
    const after = reducer(state, completeCBTEntry(entry));
    expect(after.completedEntries[after.completedEntries.length - 1]).toBe(entry);
    expect(after.currentDraft).toBeNull();
    expect(after.currentStep).toBe(1);
    expect(after.validationErrors).toEqual({});
    expect(after.isSubmitting).toBe(false);
  });

  it('validation actions should set and clear errors', () => {
    const pre = reducer(undefined, setValidationErrors({ field: 'error' }));
    expect(pre.validationErrors).toEqual({ field: 'error' });
    const after = reducer(pre, clearValidationErrors());
    expect(after.validationErrors).toEqual({});
  });

  it('setSubmitting should toggle submitting state', () => {
    const state = reducer(undefined, setSubmitting(true));
    expect(state.isSubmitting).toBe(true);
  });

  it('session flow reducers should update flow and step', () => {
    const s1 = reducer(undefined, startCBTSession(undefined));
    expect(s1.currentStep).toEqual(expect.any(Number));

    const s2 = reducer(s1, applyCBTEvent({ type: 'NEXT' } as any));
    expect(s2.currentStep).toEqual(expect.any(Number));

    const s3 = reducer(s2, clearCBTSession());
    expect(s3.currentStep).toBe(1);
  });

  it('hydrateCBTSession should replace flow and derive step', () => {
    const flowState = { currentStepId: 'situation' } as any;
    const state = reducer(undefined, hydrateCBTSession(flowState));
    expect(state.flow).toBe(flowState);
    expect(state.currentStep).toEqual(expect.any(Number));
  });
});
