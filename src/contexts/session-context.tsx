'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { readStreamableValue, useActions, useSyncUIState, useUIState, type StreamableValue } from '@ai-sdk/rsc';
import type { SessionAIType, SessionSelectionStatus } from '@/app/ai/session-ai';

interface SessionContextValue {
  currentSessionId: string | null;
  setCurrentSession: (sessionId: string | null) => void;
  selectSession: (sessionId: string | null) => Promise<void>;
  isCreatingSession: boolean;
  setCreatingSession: (val: boolean) => void;
  isDeletingSession: string | null;
  setDeletingSession: (val: string | null) => void;
  selectionStatus: SessionSelectionStatus;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [uiState, setUiState] = useUIState<SessionAIType>();
  const actions = useActions<SessionAIType>() as SessionAIActions;
  const selectSessionAction = actions.selectSession;
  const syncUiState = useSyncUIState();
  const currentSessionId = uiState?.currentSessionId ?? null;
  const [isCreatingSession, setCreatingSession] = useState(false);
  const [isDeletingSession, setDeletingSession] = useState<string | null>(null);
  const [selectionStatus, setSelectionStatus] = useState<SessionSelectionStatus>({
    phase: 'idle',
    sessionId: currentSessionId,
  });

  useEffect(() => {
    setSelectionStatus((prev) =>
      prev.phase === 'idle'
        ? { ...prev, sessionId: currentSessionId }
        : prev
    );
  }, [currentSessionId]);

  const setCurrentSession = useCallback(
    (sessionId: string | null) => {
      setUiState({ currentSessionId: sessionId });
    },
    [setUiState]
  );

  const selectSession = useCallback(
    async (sessionId: string | null) => {
      setCurrentSession(sessionId);
      try {
        setSelectionStatus({
          phase: 'validating',
          sessionId,
          message: sessionId ? 'Validating session' : 'Clearing session',
        });
        const stream = await selectSessionAction(sessionId ?? null);
        if (stream) {
          for await (const update of readStreamableValue(stream)) {
            if (update) {
              setSelectionStatus(update);
            }
          }
        }
        setSelectionStatus({ phase: 'idle', sessionId: sessionId ?? null });
      } catch {
        await syncUiState();
        setSelectionStatus({
          phase: 'idle',
          sessionId: currentSessionId,
          message: 'Selection failed',
        });
      }
    },
    [currentSessionId, selectSessionAction, setCurrentSession, syncUiState]
  );

  const value: SessionContextValue = {
    currentSessionId,
    setCurrentSession,
    selectSession,
    isCreatingSession,
    setCreatingSession,
    isDeletingSession,
    setDeletingSession,
    selectionStatus,
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

type SessionAIActions = {
  selectSession: (sessionId: string | null) => Promise<StreamableValue<SessionSelectionStatus> | undefined>;
};

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
