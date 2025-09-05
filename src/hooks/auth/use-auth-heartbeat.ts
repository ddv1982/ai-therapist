/**
 * Simple authentication heartbeat hook
 * Keeps session alive during active use
 */

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { performSessionHeartbeat } from '@/store/slices/sessionsSlice';
import { useAuth } from './use-auth';
import type { AnyAction } from '@reduxjs/toolkit';

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useAuthHeartbeat() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Perform initial heartbeat - handle AsyncThunkAction dispatch
    const heartbeatAction = performSessionHeartbeat() as unknown as AnyAction;
    dispatch(heartbeatAction);

    // Set up periodic heartbeat
    const interval = setInterval(() => {
      const intervalAction = performSessionHeartbeat() as unknown as AnyAction;
      dispatch(intervalAction);
    }, HEARTBEAT_INTERVAL);

    // Cleanup
    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  return null;
}

export default useAuthHeartbeat;
