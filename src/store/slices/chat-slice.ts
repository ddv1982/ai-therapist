import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_MODEL_ID } from '@/features/chat/config';

interface ChatState {
  isStreaming: boolean;
  currentInput: string;
  streamingMessageId: string | null;
  error: string | null;
  settings: {
    model: string;
    webSearchEnabled: boolean;
  };
}

const initialState: ChatState = {
  isStreaming: false,
  currentInput: '',
  streamingMessageId: null,
  error: null,
  settings: {
    model: DEFAULT_MODEL_ID,
    webSearchEnabled: false,
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setStreaming: (state, action: PayloadAction<{ isStreaming: boolean; messageId?: string }>) => {
      state.isStreaming = action.payload.isStreaming;
      state.streamingMessageId = action.payload.messageId || null;
    },
    setCurrentInput: (state, action: PayloadAction<string>) => {
      state.currentInput = action.payload;
    },
    clearMessages: (state) => {
      state.isStreaming = false;
      state.streamingMessageId = null;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isStreaming = false;
      state.streamingMessageId = null;
    },
    updateSettings: (state, action: PayloadAction<Partial<ChatState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

export const {
  setStreaming,
  setCurrentInput,
  clearMessages,
  setError,
  updateSettings,
} = chatSlice.actions;

export const selectIsStreaming = (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat.isStreaming;
export const selectCurrentInput = (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat.currentInput;
export const selectSettings = (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat.settings;
export const selectError = (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat.error;

export default chatSlice.reducer;
