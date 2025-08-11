import {
  sessionReducer,
  initialSessionState,
  sessionActions,
  type SessionState,
  type Session,
  type SessionAction
} from '@/lib/chat/session-reducer';
import type { Message } from '@/types';

// Test data helpers
const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  title: 'Test Session',
  lastMessage: 'Hello world',
  startedAt: new Date('2024-01-01T00:00:00Z'),
  _count: { messages: 5 },
  ...overrides
});

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  role: 'user',
  content: 'Test message',
  timestamp: new Date('2024-01-01T00:00:00Z'),
  ...overrides
});

describe('Session Reducer', () => {
  let mockState: SessionState;

  beforeEach(() => {
    mockState = {
      sessions: [
        createMockSession({ id: 'session-1', title: 'First Session' }),
        createMockSession({ id: 'session-2', title: 'Second Session' })
      ],
      currentSession: 'session-1',
      messages: [
        createMockMessage({ id: 'msg-1', content: 'Hello' }),
        createMockMessage({ id: 'msg-2', content: 'World' })
      ],
      isLoading: false,
      error: null
    };
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(initialSessionState).toEqual({
        sessions: [],
        currentSession: null,
        messages: [],
        isLoading: false,
        error: null
      });
    });
  });

  describe('SET_SESSIONS Action', () => {
    it('should set sessions and clear error', () => {
      const sessions = [
        createMockSession({ id: 'new-1', title: 'New Session 1' }),
        createMockSession({ id: 'new-2', title: 'New Session 2' })
      ];
      
      const action: SessionAction = { type: 'SET_SESSIONS', payload: sessions };
      const result = sessionReducer(mockState, action);

      expect(result.sessions).toEqual(sessions);
      expect(result.error).toBeNull();
      expect(result.currentSession).toBe('session-1'); // Should preserve current session
      expect(result.messages).toEqual(mockState.messages); // Should preserve messages
    });

    it('should set empty sessions array', () => {
      const action: SessionAction = { type: 'SET_SESSIONS', payload: [] };
      const result = sessionReducer(mockState, action);

      expect(result.sessions).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should clear existing error when setting sessions', () => {
      const stateWithError = { ...mockState, error: 'Previous error' };
      const action: SessionAction = { type: 'SET_SESSIONS', payload: [] };
      const result = sessionReducer(stateWithError, action);

      expect(result.error).toBeNull();
    });
  });

  describe('ADD_SESSION Action', () => {
    it('should add session to beginning of array', () => {
      const newSession = createMockSession({ id: 'new-session', title: 'New Session' });
      const action: SessionAction = { type: 'ADD_SESSION', payload: newSession };
      const result = sessionReducer(mockState, action);

      expect(result.sessions).toHaveLength(3);
      expect(result.sessions[0]).toEqual(newSession);
      expect(result.sessions[1].id).toBe('session-1');
      expect(result.sessions[2].id).toBe('session-2');
      expect(result.error).toBeNull();
    });

    it('should add session to empty array', () => {
      const emptyState = { ...initialSessionState };
      const newSession = createMockSession();
      const action: SessionAction = { type: 'ADD_SESSION', payload: newSession };
      const result = sessionReducer(emptyState, action);

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0]).toEqual(newSession);
    });
  });

  describe('DELETE_SESSION Action', () => {
    it('should delete session by id', () => {
      const action: SessionAction = { type: 'DELETE_SESSION', payload: 'session-2' };
      const result = sessionReducer(mockState, action);

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe('session-1');
      expect(result.currentSession).toBe('session-1'); // Should not change current session
      expect(result.messages).toEqual(mockState.messages); // Should not clear messages
    });

    it('should clear current session and messages when deleting current session', () => {
      const action: SessionAction = { type: 'DELETE_SESSION', payload: 'session-1' };
      const result = sessionReducer(mockState, action);

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe('session-2');
      expect(result.currentSession).toBeNull();
      expect(result.messages).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should handle deleting non-existent session', () => {
      const action: SessionAction = { type: 'DELETE_SESSION', payload: 'non-existent' };
      const result = sessionReducer(mockState, action);

      expect(result.sessions).toEqual(mockState.sessions);
      expect(result.currentSession).toBe(mockState.currentSession);
      expect(result.messages).toEqual(mockState.messages);
    });

    it('should delete all sessions', () => {
      let state = mockState;
      
      // Delete first session (current)
      state = sessionReducer(state, { type: 'DELETE_SESSION', payload: 'session-1' });
      expect(state.sessions).toHaveLength(1);
      expect(state.currentSession).toBeNull();
      expect(state.messages).toEqual([]);

      // Delete remaining session
      state = sessionReducer(state, { type: 'DELETE_SESSION', payload: 'session-2' });
      expect(state.sessions).toHaveLength(0);
    });
  });

  describe('SET_CURRENT_SESSION Action', () => {
    it('should set current session and clear messages when switching', () => {
      const action: SessionAction = { type: 'SET_CURRENT_SESSION', payload: 'session-2' };
      const result = sessionReducer(mockState, action);

      expect(result.currentSession).toBe('session-2');
      expect(result.messages).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should preserve messages when setting same session', () => {
      const action: SessionAction = { type: 'SET_CURRENT_SESSION', payload: 'session-1' };
      const result = sessionReducer(mockState, action);

      expect(result.currentSession).toBe('session-1');
      expect(result.messages).toEqual(mockState.messages); // Should preserve existing messages
    });

    it('should handle setting current session to null', () => {
      const action: SessionAction = { type: 'SET_CURRENT_SESSION', payload: null };
      const result = sessionReducer(mockState, action);

      expect(result.currentSession).toBeNull();
      expect(result.messages).toEqual([]);
    });

    it('should clear messages when switching from null to session', () => {
      const stateWithNullSession = { ...mockState, currentSession: null };
      const action: SessionAction = { type: 'SET_CURRENT_SESSION', payload: 'session-1' };
      const result = sessionReducer(stateWithNullSession, action);

      expect(result.currentSession).toBe('session-1');
      expect(result.messages).toEqual([]);
    });
  });

  describe('SET_MESSAGES Action', () => {
    it('should set messages and clear error', () => {
      const newMessages = [
        createMockMessage({ id: 'new-1', content: 'New message 1' }),
        createMockMessage({ id: 'new-2', content: 'New message 2' })
      ];
      
      const action: SessionAction = { type: 'SET_MESSAGES', payload: newMessages };
      const result = sessionReducer(mockState, action);

      expect(result.messages).toEqual(newMessages);
      expect(result.error).toBeNull();
      expect(result.sessions).toEqual(mockState.sessions); // Should preserve sessions
    });

    it('should set empty messages array', () => {
      const action: SessionAction = { type: 'SET_MESSAGES', payload: [] };
      const result = sessionReducer(mockState, action);

      expect(result.messages).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('ADD_MESSAGE Action', () => {
    it('should add message to end of array', () => {
      const newMessage = createMockMessage({ id: 'new-msg', content: 'New message' });
      const action: SessionAction = { type: 'ADD_MESSAGE', payload: newMessage };
      const result = sessionReducer(mockState, action);

      expect(result.messages).toHaveLength(3);
      expect(result.messages[2]).toEqual(newMessage);
      expect(result.messages[0].id).toBe('msg-1');
      expect(result.messages[1].id).toBe('msg-2');
      expect(result.error).toBeNull();
    });

    it('should add message to empty array', () => {
      const emptyState = { ...mockState, messages: [] };
      const newMessage = createMockMessage();
      const action: SessionAction = { type: 'ADD_MESSAGE', payload: newMessage };
      const result = sessionReducer(emptyState, action);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual(newMessage);
    });
  });

  describe('UPDATE_MESSAGE Action', () => {
    it('should update message content by id', () => {
      const action: SessionAction = { 
        type: 'UPDATE_MESSAGE', 
        payload: { id: 'msg-1', content: 'Updated content' }
      };
      const result = sessionReducer(mockState, action);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].content).toBe('Updated content');
      expect(result.messages[0].id).toBe('msg-1');
      expect(result.messages[1].content).toBe('World'); // Should not change
      expect(result.error).toBeNull();
    });

    it('should handle updating non-existent message', () => {
      const action: SessionAction = { 
        type: 'UPDATE_MESSAGE', 
        payload: { id: 'non-existent', content: 'New content' }
      };
      const result = sessionReducer(mockState, action);

      expect(result.messages).toEqual(mockState.messages);
      expect(result.error).toBeNull();
    });

    it('should update multiple occurrences if same id exists', () => {
      const stateWithDuplicateIds = {
        ...mockState,
        messages: [
          createMockMessage({ id: 'duplicate', content: 'Original 1' }),
          createMockMessage({ id: 'duplicate', content: 'Original 2' }),
          createMockMessage({ id: 'unique', content: 'Unique message' })
        ]
      };

      const action: SessionAction = { 
        type: 'UPDATE_MESSAGE', 
        payload: { id: 'duplicate', content: 'Updated' }
      };
      const result = sessionReducer(stateWithDuplicateIds, action);

      expect(result.messages[0].content).toBe('Updated');
      expect(result.messages[1].content).toBe('Updated');
      expect(result.messages[2].content).toBe('Unique message');
    });
  });

  describe('SET_LOADING Action', () => {
    it('should set loading to true', () => {
      const action: SessionAction = { type: 'SET_LOADING', payload: true };
      const result = sessionReducer(mockState, action);

      expect(result.isLoading).toBe(true);
      expect(result.sessions).toEqual(mockState.sessions);
      expect(result.messages).toEqual(mockState.messages);
    });

    it('should set loading to false', () => {
      const loadingState = { ...mockState, isLoading: true };
      const action: SessionAction = { type: 'SET_LOADING', payload: false };
      const result = sessionReducer(loadingState, action);

      expect(result.isLoading).toBe(false);
    });
  });

  describe('SET_ERROR Action', () => {
    it('should set error message and stop loading', () => {
      const loadingState = { ...mockState, isLoading: true };
      const action: SessionAction = { type: 'SET_ERROR', payload: 'Something went wrong' };
      const result = sessionReducer(loadingState, action);

      expect(result.error).toBe('Something went wrong');
      expect(result.isLoading).toBe(false);
    });

    it('should clear error with null', () => {
      const errorState = { ...mockState, error: 'Previous error' };
      const action: SessionAction = { type: 'SET_ERROR', payload: null };
      const result = sessionReducer(errorState, action);

      expect(result.error).toBeNull();
      expect(result.isLoading).toBe(false);
    });

    it('should handle empty string error', () => {
      const action: SessionAction = { type: 'SET_ERROR', payload: '' };
      const result = sessionReducer(mockState, action);

      expect(result.error).toBe('');
      expect(result.isLoading).toBe(false);
    });
  });

  describe('CLEAR_MESSAGES Action', () => {
    it('should clear all messages and error', () => {
      const action: SessionAction = { type: 'CLEAR_MESSAGES' };
      const result = sessionReducer(mockState, action);

      expect(result.messages).toEqual([]);
      expect(result.error).toBeNull();
      expect(result.sessions).toEqual(mockState.sessions); // Should preserve sessions
      expect(result.currentSession).toBe(mockState.currentSession);
    });

    it('should clear messages when array is already empty', () => {
      const emptyMessagesState = { ...mockState, messages: [] };
      const action: SessionAction = { type: 'CLEAR_MESSAGES' };
      const result = sessionReducer(emptyMessagesState, action);

      expect(result.messages).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('RESET_STATE Action', () => {
    it('should reset to initial state', () => {
      const action: SessionAction = { type: 'RESET_STATE' };
      const result = sessionReducer(mockState, action);

      expect(result).toEqual(initialSessionState);
    });

    it('should reset from various states', () => {
      const complexState = {
        ...mockState,
        isLoading: true,
        error: 'Some error',
        sessions: [createMockSession(), createMockSession({ id: 'session-2' })],
        messages: [createMockMessage(), createMockMessage({ id: 'msg-2' })]
      };

      const action: SessionAction = { type: 'RESET_STATE' };
      const result = sessionReducer(complexState, action);

      expect(result).toEqual(initialSessionState);
    });
  });

  describe('Default Case', () => {
    it('should return unchanged state for unknown action', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' } as any;
      const result = sessionReducer(mockState, unknownAction);

      expect(result).toEqual(mockState);
    });

    it('should handle undefined action type', () => {
      const undefinedAction = { type: undefined } as any;
      const result = sessionReducer(mockState, undefinedAction);

      expect(result).toEqual(mockState);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate original state', () => {
      // Deep clone with proper Date handling
      const originalState = JSON.parse(JSON.stringify(mockState, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }), (key, value) => {
        if (key === 'timestamp' || key === 'startedAt') {
          return new Date(value);
        }
        return value;
      });
      
      const action: SessionAction = { type: 'SET_LOADING', payload: true };
      
      sessionReducer(mockState, action);

      expect(mockState).toEqual(originalState);
    });

    it('should create new state object', () => {
      const action: SessionAction = { type: 'SET_LOADING', payload: true };
      const result = sessionReducer(mockState, action);

      expect(result).not.toBe(mockState);
      expect(result.sessions).toBe(mockState.sessions); // Shallow reference for unchanged arrays
    });

    it('should create new arrays when modified', () => {
      const newSession = createMockSession({ id: 'new' });
      const action: SessionAction = { type: 'ADD_SESSION', payload: newSession };
      const result = sessionReducer(mockState, action);

      expect(result.sessions).not.toBe(mockState.sessions);
    });
  });
});

describe('Session Action Creators', () => {
  describe('setSessions', () => {
    it('should create SET_SESSIONS action', () => {
      const sessions = [createMockSession()];
      const action = sessionActions.setSessions(sessions);

      expect(action).toEqual({
        type: 'SET_SESSIONS',
        payload: sessions
      });
    });
  });

  describe('addSession', () => {
    it('should create ADD_SESSION action', () => {
      const session = createMockSession();
      const action = sessionActions.addSession(session);

      expect(action).toEqual({
        type: 'ADD_SESSION',
        payload: session
      });
    });
  });

  describe('deleteSession', () => {
    it('should create DELETE_SESSION action', () => {
      const sessionId = 'session-123';
      const action = sessionActions.deleteSession(sessionId);

      expect(action).toEqual({
        type: 'DELETE_SESSION',
        payload: sessionId
      });
    });
  });

  describe('setCurrentSession', () => {
    it('should create SET_CURRENT_SESSION action with string id', () => {
      const sessionId = 'session-123';
      const action = sessionActions.setCurrentSession(sessionId);

      expect(action).toEqual({
        type: 'SET_CURRENT_SESSION',
        payload: sessionId
      });
    });

    it('should create SET_CURRENT_SESSION action with null', () => {
      const action = sessionActions.setCurrentSession(null);

      expect(action).toEqual({
        type: 'SET_CURRENT_SESSION',
        payload: null
      });
    });
  });

  describe('setMessages', () => {
    it('should create SET_MESSAGES action', () => {
      const messages = [createMockMessage()];
      const action = sessionActions.setMessages(messages);

      expect(action).toEqual({
        type: 'SET_MESSAGES',
        payload: messages
      });
    });
  });

  describe('addMessage', () => {
    it('should create ADD_MESSAGE action', () => {
      const message = createMockMessage();
      const action = sessionActions.addMessage(message);

      expect(action).toEqual({
        type: 'ADD_MESSAGE',
        payload: message
      });
    });
  });

  describe('updateMessage', () => {
    it('should create UPDATE_MESSAGE action', () => {
      const id = 'msg-123';
      const content = 'Updated content';
      const action = sessionActions.updateMessage(id, content);

      expect(action).toEqual({
        type: 'UPDATE_MESSAGE',
        payload: { id, content }
      });
    });
  });

  describe('setLoading', () => {
    it('should create SET_LOADING action with true', () => {
      const action = sessionActions.setLoading(true);

      expect(action).toEqual({
        type: 'SET_LOADING',
        payload: true
      });
    });

    it('should create SET_LOADING action with false', () => {
      const action = sessionActions.setLoading(false);

      expect(action).toEqual({
        type: 'SET_LOADING',
        payload: false
      });
    });
  });

  describe('setError', () => {
    it('should create SET_ERROR action with string', () => {
      const error = 'Something went wrong';
      const action = sessionActions.setError(error);

      expect(action).toEqual({
        type: 'SET_ERROR',
        payload: error
      });
    });

    it('should create SET_ERROR action with null', () => {
      const action = sessionActions.setError(null);

      expect(action).toEqual({
        type: 'SET_ERROR',
        payload: null
      });
    });
  });

  describe('clearMessages', () => {
    it('should create CLEAR_MESSAGES action', () => {
      const action = sessionActions.clearMessages();

      expect(action).toEqual({
        type: 'CLEAR_MESSAGES'
      });
    });
  });

  describe('resetState', () => {
    it('should create RESET_STATE action', () => {
      const action = sessionActions.resetState();

      expect(action).toEqual({
        type: 'RESET_STATE'
      });
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete session lifecycle', () => {
    let state = initialSessionState;

    // Add first session
    const session1 = createMockSession({ id: 'session-1', title: 'First Session' });
    state = sessionReducer(state, sessionActions.addSession(session1));
    expect(state.sessions).toHaveLength(1);

    // Set as current session
    state = sessionReducer(state, sessionActions.setCurrentSession('session-1'));
    expect(state.currentSession).toBe('session-1');

    // Add some messages
    const message1 = createMockMessage({ id: 'msg-1', content: 'Hello' });
    const message2 = createMockMessage({ id: 'msg-2', content: 'World' });
    state = sessionReducer(state, sessionActions.addMessage(message1));
    state = sessionReducer(state, sessionActions.addMessage(message2));
    expect(state.messages).toHaveLength(2);

    // Add second session
    const session2 = createMockSession({ id: 'session-2', title: 'Second Session' });
    state = sessionReducer(state, sessionActions.addSession(session2));
    expect(state.sessions).toHaveLength(2);

    // Switch to second session (should clear messages)
    state = sessionReducer(state, sessionActions.setCurrentSession('session-2'));
    expect(state.currentSession).toBe('session-2');
    expect(state.messages).toHaveLength(0);

    // Delete first session
    state = sessionReducer(state, sessionActions.deleteSession('session-1'));
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].id).toBe('session-2');
    expect(state.currentSession).toBe('session-2'); // Should remain current

    // Delete current session
    state = sessionReducer(state, sessionActions.deleteSession('session-2'));
    expect(state.sessions).toHaveLength(0);
    expect(state.currentSession).toBeNull();
    expect(state.messages).toHaveLength(0);
  });

  it('should handle error scenarios gracefully', () => {
    let state = initialSessionState;

    // Set error
    state = sessionReducer(state, sessionActions.setError('Network error'));
    expect(state.error).toBe('Network error');
    expect(state.isLoading).toBe(false);

    // Actions should clear error
    state = sessionReducer(state, sessionActions.setSessions([]));
    expect(state.error).toBeNull();

    // Set error again
    state = sessionReducer(state, sessionActions.setError('Another error'));
    state = sessionReducer(state, sessionActions.addMessage(createMockMessage()));
    expect(state.error).toBeNull();
  });
});