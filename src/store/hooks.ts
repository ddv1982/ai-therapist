import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Typed hooks for TypeScript
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Convenience selectors
export const selectCurrentSession = (state: RootState) => 
  state.sessions.sessions.find(s => s.id === state.sessions.currentSessionId);

export const selectChatMessages = (state: RootState) => state.chat.messages;

export const selectCurrentCBTDraft = (state: RootState) => state.cbt.currentDraft;

export const selectCBTValidationErrors = (state: RootState) => state.cbt.validationErrors;

export const selectIsStreaming = (state: RootState) => state.chat.isStreaming;

export const selectChatSettings = (state: RootState) => state.chat.settings;