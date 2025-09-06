import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import type { MessageData } from '@/features/chat/messages';

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

const messagesAdapter = createEntityAdapter<MessageData>({
  sortComparer: (a, b) => {
    const aTime = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
    const bTime = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
    return aTime - bTime;
  },
});

const initialState = messagesAdapter.getInitialState<ChatState>({
  isStreaming: false,
  currentInput: '',
  streamingMessageId: null,
  error: null,
  settings: {
    model: 'openai/gpt-oss-20b',
    webSearchEnabled: false,
  },
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<MessageData>) => {
      messagesAdapter.addOne(state, action.payload);
    },
    updateMessage: (state, action: PayloadAction<{ id: string; content: string }>) => {
      messagesAdapter.updateOne(state, { id: action.payload.id, changes: { content: action.payload.content } });
    },
    setStreaming: (state, action: PayloadAction<{ isStreaming: boolean; messageId?: string }>) => {
      state.isStreaming = action.payload.isStreaming;
      state.streamingMessageId = action.payload.messageId || null;
    },
    setCurrentInput: (state, action: PayloadAction<string>) => {
      state.currentInput = action.payload;
    },
    clearMessages: (state) => {
      messagesAdapter.removeAll(state);
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
  addMessage,
  updateMessage,
  setStreaming,
  setCurrentInput,
  clearMessages,
  setError,
  updateSettings,
} = chatSlice.actions;

export const chatSelectors = messagesAdapter.getSelectors(
  (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat
);

// Fine-grained selectors for performance
export const selectIsStreaming = (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat.isStreaming;
export const selectCurrentInput = (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat.currentInput;
export const selectSettings = (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat.settings;
export const selectError = (state: { chat: ReturnType<typeof chatSlice.reducer> }) => state.chat.error;

export default chatSlice.reducer;
