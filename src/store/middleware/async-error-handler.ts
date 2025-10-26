import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import { setError as setSessionError } from '../slices/sessions-slice';
import { setError as setChatError } from '../slices/chat-slice';
import { logger } from '@/lib/utils/logger';
import { isProduction } from '@/config/env.public';

/**
 * Centralized async error handler for Redux thunks.
 * Dispatch this in catch blocks to ensure consistent error reporting.
 */
export function handleThunkError(
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>,
  error: unknown,
  scope: 'sessions' | 'chat'
) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

  if (scope === 'sessions') {
    dispatch(setSessionError(message));
  } else if (scope === 'chat') {
    dispatch(setChatError(message));
  }

  // Structured logging with filtering; still gated in dev for noise
  if (!isProduction) {
    logger.error('ThunkError', { scope, message }, error as Error);
  }
}
