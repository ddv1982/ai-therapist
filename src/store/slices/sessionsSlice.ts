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
  currentSessionId: string | null;
  isCreatingSession: boolean;
  isDeletingSession: string | null;
  error: string | null;
}

const initialState: SessionsState = {
  currentSessionId: null,
  isCreatingSession: false,
  isDeletingSession: null,
  error: null,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    deleteSession: (state, action: PayloadAction<string>) => {
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
  }
});

export const {
  deleteSession,
  setCurrentSession,
  setCreatingSession,
  setDeletingSession,
  setError,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;
