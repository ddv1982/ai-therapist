import type { Message } from '@/types/index';

export interface Session {
  id: string;
  userId?: string;
  title: string;
  startedAt: Date;
  endedAt?: Date | null;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastMessage?: string;
  _count?: {
    messages: number;
  };
}

export interface SessionState {
  sessions: Session[];
  currentSession: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export type SessionAction =
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'SET_CURRENT_SESSION'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'RESET_STATE' };

export const initialSessionState: SessionState = {
  sessions: [],
  currentSession: null,
  messages: [],
  isLoading: false,
  error: null,
};

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_SESSIONS':
      return {
        ...state,
        sessions: action.payload,
        error: null,
      };

    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
        error: null,
      };

    case 'DELETE_SESSION':
      const updatedSessions = state.sessions.filter(s => s.id !== action.payload);
      return {
        ...state,
        sessions: updatedSessions,
        // Clear current session if it was deleted
        currentSession: state.currentSession === action.payload ? null : state.currentSession,
        // Clear messages if current session was deleted
        messages: state.currentSession === action.payload ? [] : state.messages,
        error: null,
      };

    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentSession: action.payload,
        // Clear messages when switching sessions
        messages: action.payload !== state.currentSession ? [] : state.messages,
        error: null,
      };

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        error: null,
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null,
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content }
            : msg
        ),
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        error: null,
      };

    case 'RESET_STATE':
      return initialSessionState;

    default:
      return state;
  }
}

// Action creators for better type safety and reusability
export const sessionActions = {
  setSessions: (sessions: Session[]): SessionAction => ({
    type: 'SET_SESSIONS',
    payload: sessions,
  }),

  addSession: (session: Session): SessionAction => ({
    type: 'ADD_SESSION',
    payload: session,
  }),

  deleteSession: (sessionId: string): SessionAction => ({
    type: 'DELETE_SESSION',
    payload: sessionId,
  }),

  setCurrentSession: (sessionId: string | null): SessionAction => ({
    type: 'SET_CURRENT_SESSION',
    payload: sessionId,
  }),

  setMessages: (messages: Message[]): SessionAction => ({
    type: 'SET_MESSAGES',
    payload: messages,
  }),

  addMessage: (message: Message): SessionAction => ({
    type: 'ADD_MESSAGE',
    payload: message,
  }),

  updateMessage: (id: string, content: string): SessionAction => ({
    type: 'UPDATE_MESSAGE',
    payload: { id, content },
  }),

  setLoading: (isLoading: boolean): SessionAction => ({
    type: 'SET_LOADING',
    payload: isLoading,
  }),

  setError: (error: string | null): SessionAction => ({
    type: 'SET_ERROR',
    payload: error,
  }),

  clearMessages: (): SessionAction => ({
    type: 'CLEAR_MESSAGES',
  }),

  resetState: (): SessionAction => ({
    type: 'RESET_STATE',
  }),
};