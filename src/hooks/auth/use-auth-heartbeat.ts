/**
 * Simple authentication heartbeat hook
 * Keeps session alive during active use
 */

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useRecoverSessionMutation } from '@/store/slices/sessionsApi';
import { useAuth } from './use-auth';

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useAuthHeartbeat() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const [recoverSession] = useRecoverSessionMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Perform initial heartbeat by calling recoverSession
    recoverSession();

    // Set up periodic heartbeat
    const interval = setInterval(() => {
      recoverSession();
    }, HEARTBEAT_INTERVAL);

    // Cleanup
    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch, recoverSession]);

  return null;
}

export default useAuthHeartbeat;
