import {
  selectIsStreaming,
  selectCurrentInput,
  selectChatSettings,
  selectChatError,
  selectCurrentSessionId,
  selectIsCreatingSession,
  selectDeletingSessionId,
  selectSessionsError,
} from '@/store/selectors';

describe('store selectors', () => {
  const baseState: any = {
    chat: {
      isStreaming: true,
      currentInput: 'hi',
      error: 'e',
      settings: { model: 'm', webSearchEnabled: true },
    },
    sessions: {
      currentSessionId: 's1',
      isCreatingSession: false,
      isDeletingSession: 's2',
      error: null,
    },
  };

  it('chat selectors should read values and defaults', () => {
    expect(selectIsStreaming(baseState)).toBe(true);
    expect(selectCurrentInput(baseState)).toBe('hi');
    expect(selectChatSettings(baseState)).toEqual({ model: 'm', webSearchEnabled: true });
    expect(selectChatError(baseState)).toBe('e');

    const empty: any = {};
    expect(selectIsStreaming(empty)).toBe(false);
    expect(selectCurrentInput(empty)).toBe('');
    expect(selectChatSettings(empty)).toEqual({
      model: expect.any(String),
      webSearchEnabled: false,
    });
    expect(selectChatError(empty)).toBeNull();
  });

  it('sessions selectors should read values and defaults', () => {
    expect(selectCurrentSessionId(baseState)).toBe('s1');
    expect(selectIsCreatingSession(baseState)).toBe(false);
    expect(selectDeletingSessionId(baseState)).toBe('s2');
    expect(selectSessionsError(baseState)).toBeNull();

    const empty: any = {};
    expect(selectCurrentSessionId(empty)).toBeNull();
    expect(selectIsCreatingSession(empty)).toBe(false);
    expect(selectDeletingSessionId(empty)).toBeNull();
    expect(selectSessionsError(empty)).toBeNull();
  });
});
