import reducer, {
  deleteSession,
  setCurrentSession,
  setCreatingSession,
  setDeletingSession,
  setError,
} from '@/store/slices/sessions-slice';

describe('sessionsSlice reducer', () => {
  it('should return initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any);
    expect(state).toEqual({
      currentSessionId: null,
      isCreatingSession: false,
      isDeletingSession: null,
      error: null,
    });
  });

  it('setCurrentSession should set id', () => {
    const state = reducer(undefined, setCurrentSession('s1'));
    expect(state.currentSessionId).toBe('s1');
  });

  it('deleteSession should clear current if it matches', () => {
    const pre = reducer(undefined, setCurrentSession('s2'));
    const state = reducer(pre, deleteSession('s2'));
    expect(state.currentSessionId).toBeNull();
  });

  it('deleteSession should not clear current if different id', () => {
    const pre = reducer(undefined, setCurrentSession('s3'));
    const state = reducer(pre, deleteSession('another'));
    expect(state.currentSessionId).toBe('s3');
  });

  it('setCreatingSession toggles flag', () => {
    const state = reducer(undefined, setCreatingSession(true));
    expect(state.isCreatingSession).toBe(true);
  });

  it('setDeletingSession sets id being deleted', () => {
    const state = reducer(undefined, setDeletingSession('s4'));
    expect(state.isDeletingSession).toBe('s4');
  });

  it('setError sets error message', () => {
    const state = reducer(undefined, setError('boom'));
    expect(state.error).toBe('boom');
  });
});
