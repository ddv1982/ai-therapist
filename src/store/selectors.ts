import type { RootState } from './index';
import { DEFAULT_MODEL_ID } from '@/features/chat/config';

// Chat selectors
export const selectIsStreaming = (state: RootState): boolean => state.chat?.isStreaming || false;
export const selectCurrentInput = (state: RootState): string => state.chat?.currentInput || '';
export const selectChatSettings = (state: RootState): { model: string; webSearchEnabled: boolean } =>
  state.chat?.settings || { model: DEFAULT_MODEL_ID, webSearchEnabled: false };
export const selectChatError = (state: RootState): string | null => state.chat?.error || null;

// Sessions selectors
export const selectCurrentSessionId = (state: RootState): string | null => state.sessions?.currentSessionId || null;
export const selectIsCreatingSession = (state: RootState): boolean => state.sessions?.isCreatingSession || false;
export const selectDeletingSessionId = (state: RootState): string | null => state.sessions?.isDeletingSession || null;
export const selectSessionsError = (state: RootState): string | null => state.sessions?.error || null;


