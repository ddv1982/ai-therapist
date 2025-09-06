import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Typed hooks for TypeScript
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Convenience selectors
export const selectCurrentSession = (state: RootState) => {
  const entities = state.sessions?.entities || {};
  const currentId = state.sessions?.currentSessionId;
  return currentId ? entities[currentId] : null;
};

export const selectChatMessages = (state: RootState) => {
  const entities = state.chat?.entities || {};
  return Object.values(entities);
};

export const selectCurrentCBTDraft = (state: RootState) => state.cbt?.currentDraft;

export const selectCBTValidationErrors = (state: RootState) => state.cbt?.validationErrors || {};

export const selectIsStreaming = (state: RootState) => state.chat?.isStreaming || false;

export const selectChatSettings = (state: RootState) => state.chat?.settings || { webSearchEnabled: false, model: 'openai/gpt-oss-20b' };
