/**
 * Simplified Session Management Hook
 *
 * Replaces complex CBT data manager and session contexts with simple session management.
 */

'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export function useSession() {
  const currentSessionId = useSelector((state: RootState) => state.sessions.currentSessionId);

  return useMemo(() => ({
    sessionId: currentSessionId,
    hasSession: !!currentSessionId,
  }), [currentSessionId]);
}

/**
 * Simple session actions hook
 */
export function useSessionActions() {
  return useMemo(() => ({
    // These would be dispatch actions, but simplified for now
    startSession: (sessionId: string) => {
      console.log('Start session:', sessionId);
    },
    endSession: () => {
      console.log('End session');
    },
  }), []);
}
