import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  setStreaming,
  setCurrentInput,
  clearMessages,
  setError,
  updateSettings,
  selectIsStreaming,
  selectCurrentInput,
  selectSettings,
  selectError,
} from '@/store/slices/chat-slice';

describe('chat-slice', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        chat: chatReducer,
      },
    });

  type TestStore = ReturnType<typeof createTestStore>;
  type TestState = ReturnType<TestStore['getState']>;

  let store: TestStore;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('setStreaming', () => {
    it('starts streaming with message ID', () => {
      store.dispatch(setStreaming({ isStreaming: true, messageId: 'msg-123' }));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.isStreaming).toBe(true);
      expect(state.streamingMessageId).toBe('msg-123');
    });

    it('stops streaming', () => {
      store.dispatch(setStreaming({ isStreaming: true, messageId: 'msg-123' }));
      store.dispatch(setStreaming({ isStreaming: false }));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
    });

    it('handles streaming without message ID', () => {
      store.dispatch(setStreaming({ isStreaming: true }));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.isStreaming).toBe(true);
      expect(state.streamingMessageId).toBeNull();
    });
  });

  describe('setCurrentInput', () => {
    it('updates current input', () => {
      store.dispatch(setCurrentInput('Hello, how are you?'));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.currentInput).toBe('Hello, how are you?');
    });

    it('clears input', () => {
      store.dispatch(setCurrentInput('Test'));
      store.dispatch(setCurrentInput(''));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.currentInput).toBe('');
    });
  });

  describe('clearMessages', () => {
    it('resets streaming state', () => {
      store.dispatch(setStreaming({ isStreaming: true, messageId: 'msg-123' }));
      store.dispatch(setError('Test error'));
      store.dispatch(clearMessages());

      const state: TestState['chat'] = store.getState().chat;
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      store.dispatch(setError('Network error'));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.error).toBe('Network error');
    });

    it('stops streaming on error', () => {
      store.dispatch(setStreaming({ isStreaming: true, messageId: 'msg-123' }));
      store.dispatch(setError('Error occurred'));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
    });

    it('clears error', () => {
      store.dispatch(setError('Error'));
      store.dispatch(setError(null));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.error).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('updates model setting', () => {
      store.dispatch(updateSettings({ model: 'gpt-4' }));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.settings.model).toBe('gpt-4');
    });

    it('updates webSearchEnabled', () => {
      store.dispatch(updateSettings({ webSearchEnabled: true }));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.settings.webSearchEnabled).toBe(true);
    });

    it('updates multiple settings', () => {
      store.dispatch(
        updateSettings({
          model: 'gpt-4-turbo',
          webSearchEnabled: true,
        })
      );

      const state: TestState['chat'] = store.getState().chat;
      expect(state.settings.model).toBe('gpt-4-turbo');
      expect(state.settings.webSearchEnabled).toBe(true);
    });

    it('preserves unmodified settings', () => {
      store.dispatch(updateSettings({ model: 'gpt-4' }));

      const state: TestState['chat'] = store.getState().chat;
      expect(state.settings.webSearchEnabled).toBe(false);
    });
  });

  describe('selectors', () => {
    it('selectIsStreaming returns streaming state', () => {
      store.dispatch(setStreaming({ isStreaming: true }));

      expect(selectIsStreaming(store.getState())).toBe(true);
    });

    it('selectCurrentInput returns input', () => {
      store.dispatch(setCurrentInput('Test input'));

      expect(selectCurrentInput(store.getState())).toBe('Test input');
    });

    it('selectSettings returns settings', () => {
      store.dispatch(updateSettings({ model: 'gpt-4', webSearchEnabled: true }));

      const settings = selectSettings(store.getState());
      expect(settings.model).toBe('gpt-4');
      expect(settings.webSearchEnabled).toBe(true);
    });

    it('selectError returns error', () => {
      store.dispatch(setError('Test error'));

      expect(selectError(store.getState())).toBe('Test error');
    });
  });
});
