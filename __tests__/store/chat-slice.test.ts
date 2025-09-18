import reducer, { setStreaming, setCurrentInput, clearMessages, setError, updateSettings } from '@/store/slices/chatSlice';

describe('chatSlice reducer', () => {
  it('should return the initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any);
    expect(state).toMatchObject({
      isStreaming: false,
      currentInput: '',
      streamingMessageId: null,
      error: null,
      settings: expect.objectContaining({ model: expect.any(String), webSearchEnabled: false }),
    });
  });

  it('setStreaming should toggle streaming and set message id', () => {
    let state = reducer(undefined, setStreaming({ isStreaming: true, messageId: 'm1' }));
    expect(state.isStreaming).toBe(true);
    expect(state.streamingMessageId).toBe('m1');

    state = reducer(state, setStreaming({ isStreaming: false }));
    expect(state.isStreaming).toBe(false);
    expect(state.streamingMessageId).toBeNull();
  });

  it('setCurrentInput should update input', () => {
    const state = reducer(undefined, setCurrentInput('hello'));
    expect(state.currentInput).toBe('hello');
  });

  it('clearMessages should reset streaming and error state', () => {
    const pre = reducer(undefined, setError('oops'));
    const state = reducer(pre, clearMessages());
    expect(state.isStreaming).toBe(false);
    expect(state.streamingMessageId).toBeNull();
    expect(state.error).toBeNull();
  });

  it('setError should set error and stop streaming', () => {
    const pre = reducer(undefined, setStreaming({ isStreaming: true, messageId: 'm2' }));
    const state = reducer(pre, setError('bad'));
    expect(state.error).toBe('bad');
    expect(state.isStreaming).toBe(false);
    expect(state.streamingMessageId).toBeNull();
  });

  it('updateSettings should merge settings', () => {
    const state = reducer(undefined, updateSettings({ webSearchEnabled: true }));
    expect(state.settings.webSearchEnabled).toBe(true);
    const next = reducer(state, updateSettings({ model: 'test-model' }));
    expect(next.settings).toEqual({ model: 'test-model', webSearchEnabled: true });
  });
});


