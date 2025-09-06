import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
// import { prisma } from '@/lib/database/db'; // reserved for future API integration

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
  recoveryData: Record<string, unknown> | null;
  recoveryAttempted: boolean;
}

const sessionsAdapter = createEntityAdapter<SessionData>({
  sortComparer: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
});

const initialState = sessionsAdapter.getInitialState<SessionsState>({
  currentSessionId: null,
  isCreatingSession: false,
  isDeletingSession: null,
  error: null,
  recoveryData: null,
  recoveryAttempted: false,
});

export const createSession = createAsyncThunk(
  'sessions/createSession',
  async (title: string, { rejectWithValue }) => {
    try {
      // TODO: Replace with API call to backend
      const newSession: SessionData = {
        id: crypto.randomUUID(),
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
      };
      return newSession;
    } catch {
      return rejectWithValue('Failed to create session');
    }
  }
);

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    updateSession: (state, action: PayloadAction<{ id: string; updates: Partial<SessionData> }>) => {
      sessionsAdapter.updateOne(state, { id: action.payload.id, changes: action.payload.updates });
    },
    deleteSession: (state, action: PayloadAction<string>) => {
      sessionsAdapter.removeOne(state, action.payload);
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
  extraReducers: (builder) => {
    builder.addCase(createSession.pending, (state) => {
      state.isCreatingSession = true;
      state.error = null;
    });
    builder.addCase(createSession.fulfilled, (state, action) => {
      state.isCreatingSession = false;
      sessionsAdapter.addOne(state, action.payload);
      state.currentSessionId = action.payload.id;
    });
    builder.addCase(createSession.rejected, (state, action) => {
      state.isCreatingSession = false;
      state.error = (action.payload as string) || 'Failed to create session';
    });
  }
});

export const {
  updateSession,
  deleteSession,
  setCurrentSession,
  setCreatingSession,
  setDeletingSession,
  setError,
} = sessionsSlice.actions;

export const sessionsSelectors = sessionsAdapter.getSelectors(
  (state: { sessions: ReturnType<typeof sessionsSlice.reducer> }) => state.sessions
);

// Async thunks
export const performSessionHeartbeat = createAsyncThunk(
  'sessions/performHeartbeat',
  async () => {
    // Simulate heartbeat API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { timestamp: Date.now() };
  }
);

export const recoverSession = createAsyncThunk(
  'sessions/recoverSession',
  async () => {
    // Simulate session recovery
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true };
  }
);

export default sessionsSlice.reducer;
