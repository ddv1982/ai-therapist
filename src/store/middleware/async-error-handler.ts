import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import { setError as setSessionError } from '../slices/sessionsSlice';
import { setError as setChatError } from '../slices/chatSlice';

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

  // Optionally log to console or external service
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ThunkError][${scope}]`, message, error);
  }
}
