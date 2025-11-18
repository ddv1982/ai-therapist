'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useCurrentSessionQuery, useSetCurrentSessionMutation } from '@/lib/queries/sessions';

interface SessionContextValue {
  currentSessionId: string | null;
  setCurrentSession: (sessionId: string | null) => void;
  selectSession: (sessionId: string | null) => Promise<void>;
  isCreatingSession: boolean;
  setCreatingSession: (val: boolean) => void;
  isDeletingSession: string | null;
  setDeletingSession: (val: string | null) => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreatingSession, setCreatingSession] = useState(false);
  const [isDeletingSession, setDeletingSession] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const { data: currentServerSession } = useCurrentSessionQuery();
  const { mutateAsync: setCurrentOnServer } = useSetCurrentSessionMutation();

  // Sync with server on mount only once
  useEffect(() => {
    if (!hasHydrated && currentServerSession?.id) {
      setCurrentSessionId(currentServerSession.id);
      setHasHydrated(true);
    }
  }, [currentServerSession?.id, hasHydrated]);

  const selectSession = useCallback(
    async (sessionId: string | null) => {
      setCurrentSessionId(sessionId);
      if (sessionId) {
        try {
          await setCurrentOnServer(sessionId);
        } catch {
          // Silently ignore server sync errors
        }
      }
    },
    [setCurrentOnServer]
  );

  const value: SessionContextValue = {
    currentSessionId,
    setCurrentSession: setCurrentSessionId,
    selectSession,
    isCreatingSession,
    setCreatingSession,
    isDeletingSession,
    setDeletingSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
