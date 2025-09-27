import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { DEFAULT_MODEL_ID } from '@/features/chat/config';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

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

export const selectChatSettings = (state: RootState) => state.chat?.settings || { webSearchEnabled: false, model: DEFAULT_MODEL_ID };
// Prefer selectors in src/store/selectors.ts; retained for backward compatibility
export const selectChatSettingsSafe = (state: RootState) => state.chat?.settings || { webSearchEnabled: false, model: DEFAULT_MODEL_ID };
