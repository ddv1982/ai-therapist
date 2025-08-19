import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MessageData } from '@/features/chat/messages';

interface ChatState {
  messages: MessageData[];
  isStreaming: boolean;
  currentInput: string;
  streamingMessageId: string | null;
  error: string | null;
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  currentInput: '',
  streamingMessageId: null,
  error: null,
  settings: {
    model: 'openai/gpt-oss-20b',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9,
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<MessageData>) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const message = state.messages.find(m => m.id === action.payload.id);
      if (message) {
        message.content = action.payload.content;
      }
    },
    setStreaming: (state, action: PayloadAction<{ isStreaming: boolean; messageId?: string }>) => {
      state.isStreaming = action.payload.isStreaming;
      state.streamingMessageId = action.payload.messageId || null;
    },
    setCurrentInput: (state, action: PayloadAction<string>) => {
      state.currentInput = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
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

export default chatSlice.reducer;