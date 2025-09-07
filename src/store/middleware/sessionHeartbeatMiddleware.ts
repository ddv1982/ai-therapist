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

import { Middleware, MiddlewareAPI, AnyAction } from '@reduxjs/toolkit';
import { sessionsApi } from '../slices/sessionsApi';

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes

let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Redux middleware for session heartbeat management
 */
export const sessionHeartbeatMiddleware: Middleware = 
  (api: MiddlewareAPI) => 
  (next) => 
  (action) => {
    
    const result = next(action);

    // Start heartbeat when a session becomes active
    if ((action as AnyAction).type === 'sessions/setCurrentSession' && (action as AnyAction).payload) {
      if (!heartbeatInterval) {
        // Initial heartbeat using getCurrentSession endpoint
        api.dispatch(sessionsApi.endpoints.getCurrentSession.initiate() as unknown as AnyAction);

        // Set up periodic heartbeat
        heartbeatInterval = setInterval(() => {
          api.dispatch(sessionsApi.endpoints.getCurrentSession.initiate() as unknown as AnyAction);
        }, HEARTBEAT_INTERVAL);
      }
    }

    // Stop heartbeat when session is cleared
    if ((action as AnyAction).type === 'sessions/setCurrentSession' && !(action as AnyAction).payload) {
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
