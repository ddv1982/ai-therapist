/**
 * Simple session heartbeat middleware
 * Manages basic session keepalive
 */

import { Middleware, MiddlewareAPI, AnyAction } from '@reduxjs/toolkit';
import { performSessionHeartbeat } from '../slices/sessionsSlice';

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
        // Initial heartbeat - handle AsyncThunkAction dispatch
        const heartbeatAction = performSessionHeartbeat() as unknown as AnyAction;
        api.dispatch(heartbeatAction);
        
        // Set up periodic heartbeat
        heartbeatInterval = setInterval(() => {
          const intervalAction = performSessionHeartbeat() as unknown as AnyAction;
          api.dispatch(intervalAction);
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
