/**
 * Simple authentication heartbeat hook
 * Keeps session alive during active use
 */

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { sessionsApi } from '@/store/slices/sessionsApi';
import { useAuth } from './use-auth';

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useAuthHeartbeat() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Perform initial heartbeat by calling getCurrentSession (keeps cookie/session warm)
    dispatch(sessionsApi.endpoints.getCurrentSession.initiate());

    // Set up periodic heartbeat
    const interval = setInterval(() => {
      dispatch(sessionsApi.endpoints.getCurrentSession.initiate());
    }, HEARTBEAT_INTERVAL);

    // Cleanup
    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  return null;
}

export default useAuthHeartbeat;
