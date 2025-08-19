import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SessionData {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

interface SessionsState {
  sessions: SessionData[];
  currentSessionId: string | null;
  isCreatingSession: boolean;
  isDeletingSession: string | null;
  error: string | null;
}

const initialState: SessionsState = {
  sessions: [],
  currentSessionId: null,
  isCreatingSession: false,
  isDeletingSession: null,
  error: null,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<SessionData[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<SessionData>) => {
      state.sessions.unshift(action.payload);
    },
    updateSession: (state, action: PayloadAction<{ id: string; updates: Partial<SessionData> }>) => {
      const session = state.sessions.find(s => s.id === action.payload.id);
      if (session) {
        Object.assign(session, action.payload.updates);
      }
    },
    deleteSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
      if (state.currentSessionId === action.payload) {
        state.currentSessionId = null;
      }
    },
    setCurrentSession: (state, action: PayloadAction<string | null>) => {
      state.currentSessionId = action.payload;
    },
    setCreatingSession: (state, action: PayloadAction<boolean>) => {
      state.isCreatingSession = action.payload;
    },
    setDeletingSession: (state, action: PayloadAction<string | null>) => {
      state.isDeletingSession = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSessions,
  addSession,
  updateSession,
  deleteSession,
  setCurrentSession,
  setCreatingSession,
  setDeletingSession,
  setError,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;