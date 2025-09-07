import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Typed hooks for TypeScript
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Convenience selectors
export const selectCurrentSession = (state: RootState) => {
  const currentId = state.sessions?.currentSessionId;
  return currentId ? { id: currentId } : null;
};

export const selectChatMessages = (state: RootState): unknown[] => {
  const chatState = state.chat as { messages?: Record<string, unknown> } | undefined;
  return chatState?.messages ? Object.values(chatState.messages) : [];
};

export const selectCurrentCBTDraft = (state: RootState) => state.cbt?.currentDraft;

export const selectCBTValidationErrors = (state: RootState) => state.cbt?.validationErrors || {};

export const selectIsStreaming = (state: RootState) => state.chat?.isStreaming || false;

export const selectChatSettings = (state: RootState) => state.chat?.settings || { webSearchEnabled: false, model: 'openai/gpt-oss-20b' };
