/**
 * Session heartbeat middleware
 *
 * Unified selection model:
 * - The server is authoritative for the current session via `/api/sessions/current`.
 * - The client reflects this in Redux `sessions.currentSessionId`.
 *
 * This middleware keeps the client hydrated by periodically calling
 * `GET /api/sessions/current` while a session is selected, so Redux stays
 * aligned with server state across tabs/devices.
 */

import { Middleware, MiddlewareAPI, UnknownAction, ThunkDispatch } from '@reduxjs/toolkit';
import { sessionsApi } from '../slices/sessionsApi';

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes

let heartbeatInterval: NodeJS.Timeout | null = null;

type SetCurrentSessionAction = { type: 'sessions/setCurrentSession'; payload: unknown };

function isSetCurrentSessionAction(action: unknown): action is SetCurrentSessionAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as { type?: unknown }).type === 'sessions/setCurrentSession'
  );
}

/**
 * Redux middleware for session heartbeat management
 */
export const sessionHeartbeatMiddleware: Middleware<object, unknown, ThunkDispatch<unknown, unknown, UnknownAction>> = 
  (api: MiddlewareAPI<ThunkDispatch<unknown, unknown, UnknownAction>>) => 
  (next) => 
  (action) => {
    
    const result = next(action);

    // Start heartbeat when a session becomes active
    if (isSetCurrentSessionAction(action) && action.payload) {
      if (!heartbeatInterval) {
        // Initial heartbeat using getCurrentSession endpoint
        api.dispatch(sessionsApi.endpoints.getCurrentSession.initiate());

        // Set up periodic heartbeat
        heartbeatInterval = setInterval(() => {
          api.dispatch(sessionsApi.endpoints.getCurrentSession.initiate());
        }, HEARTBEAT_INTERVAL);
      }
    }

    // Stop heartbeat when session is cleared
    if (isSetCurrentSessionAction(action) && !action.payload) {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    }

    return result;
  };

/**
 * Cleanup function to be called when the app unmounts
 */
export function cleanupHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
