import { configureStore } from '@reduxjs/toolkit';
import { handleThunkError } from '@/store/middleware/async-error-handler';
import sessionsReducer from '@/store/slices/sessions-slice';
import chatReducer from '@/store/slices/chat-slice';

describe('async-error-handler', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        sessions: sessionsReducer,
        chat: chatReducer,
      },
    });
  });

  describe('handleThunkError', () => {
    it('sets sessions error when scope is sessions', () => {
      const error = new Error('Session fetch failed');
      
      handleThunkError(store.dispatch, error, 'sessions');
      
      const state = store.getState();
      expect(state.sessions.error).toBe('Session fetch failed');
    });

    it('sets chat error when scope is chat', () => {
      const error = new Error('Chat request failed');
      
      handleThunkError(store.dispatch, error, 'chat');
      
      const state = store.getState();
      expect(state.chat.error).toBe('Chat request failed');
    });

    it('handles string errors', () => {
      handleThunkError(store.dispatch, 'String error message', 'sessions');
      
      const state = store.getState();
      expect(state.sessions.error).toBe('String error message');
    });

    it('handles unknown error types', () => {
      handleThunkError(store.dispatch, { unknown: true }, 'chat');
      
      const state = store.getState();
      expect(state.chat.error).toBe('Unknown error');
    });

    it('handles null error', () => {
      handleThunkError(store.dispatch, null, 'sessions');
      
      const state = store.getState();
      expect(state.sessions.error).toBe('Unknown error');
    });

    it('handles undefined error', () => {
      handleThunkError(store.dispatch, undefined, 'chat');
      
      const state = store.getState();
      expect(state.chat.error).toBe('Unknown error');
    });

    it('handles Error with empty message', () => {
      const error = new Error('');
      
      handleThunkError(store.dispatch, error, 'sessions');
      
      const state = store.getState();
      expect(state.sessions.error).toBe('');
    });

    it('preserves detailed error messages', () => {
      const detailedError = new Error('Network timeout after 30 seconds');
      
      handleThunkError(store.dispatch, detailedError, 'chat');
      
      const state = store.getState();
      expect(state.chat.error).toBe('Network timeout after 30 seconds');
    });

    it('does not cross-contaminate error states', () => {
      const sessionError = new Error('Session error');
      const chatError = new Error('Chat error');
      
      handleThunkError(store.dispatch, sessionError, 'sessions');
      handleThunkError(store.dispatch, chatError, 'chat');
      
      const state = store.getState();
      expect(state.sessions.error).toBe('Session error');
      expect(state.chat.error).toBe('Chat error');
    });
  });
});
