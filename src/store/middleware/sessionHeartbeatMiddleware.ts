/**
 * Simple session heartbeat middleware
 * Manages basic session keepalive
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
        // Initial heartbeat using recoverSession endpoint
        api.dispatch(sessionsApi.endpoints.recoverSession.initiate() as unknown as AnyAction);

        // Set up periodic heartbeat
        heartbeatInterval = setInterval(() => {
          api.dispatch(sessionsApi.endpoints.recoverSession.initiate() as unknown as AnyAction);
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
