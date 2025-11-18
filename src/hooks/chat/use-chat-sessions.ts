'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useSessionStore } from '@/hooks/use-session-store';
import { useSelectSession } from '@/hooks/use-select-session';
import { useAuthReady } from '@/hooks/auth/use-auth-ready';

interface UseChatSessionsOptions {
  loadMessages: (sessionId: string) => Promise<void>;
  clearMessages: () => void;
  resolveDefaultTitle: () => string;
}

interface CurrentSessionResponse {
  currentSession?: {
    id: string;
    messageCount?: number;
  };
}

export function useChatSessions(options: UseChatSessionsOptions) {
  const { loadMessages, clearMessages, resolveDefaultTitle } = options;
  const {
    sessions,
    loadSessions: loadSessionsFromStore,
    removeSession,
    createSession,
  } = useSessionStore();
  const { selectSession } = useSelectSession();
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const loadingSessionsRef = useRef(false);
  const authReady = useAuthReady();

  const persistSessionSelection = useCallback(
    async (sessionId: string | null) => {
      await selectSession(sessionId);
      setCurrentSession(sessionId);
      if (typeof window !== 'undefined') {
        if (sessionId) {
          window.localStorage.setItem('currentSessionId', sessionId);
        } else {
          window.localStorage.removeItem('currentSessionId');
        }
      }
    },
    [selectSession]
  );

  const setCurrentSessionAndLoad = useCallback(
    async (sessionId: string) => {
      await persistSessionSelection(sessionId);
      await loadMessages(sessionId);
    },
    [persistSessionSelection, loadMessages]
  );

  const clearCurrentSession = useCallback(async () => {
    await persistSessionSelection(null);
    clearMessages();
  }, [persistSessionSelection, clearMessages]);

  const loadSessions = useCallback(async () => {
    if (loadingSessionsRef.current) return;
    loadingSessionsRef.current = true;
    try {
      await loadSessionsFromStore();
    } finally {
      loadingSessionsRef.current = false;
    }
  }, [loadSessionsFromStore]);

  const hydrateCurrentSession = useCallback(async () => {
    async function attempt(retry = false): Promise<void> {
      try {
        const response = await apiClient.getCurrentSession();
        const normalized =
          response && (response as { success?: boolean }).success
            ? (response as { data: CurrentSessionResponse }).data
            : (response as CurrentSessionResponse | undefined);
        const active = normalized?.currentSession?.id;
        if (active) {
          await setCurrentSessionAndLoad(active);
        } else if (authReady && !retry) {
          setTimeout(() => {
            void attempt(true);
          }, 400);
        } else {
          await clearCurrentSession();
        }
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (authReady && !retry && status === 401) {
          setTimeout(() => {
            void attempt(true);
          }, 400);
        }
        // otherwise ignore to avoid blocking UI
      }
    }
    await attempt(false);
  }, [authReady, setCurrentSessionAndLoad, clearCurrentSession]);

  const ensureActiveSession = useCallback(async () => {
    if (currentSession) return currentSession;
    try {
      const title = resolveDefaultTitle();
      const created = await createSession(title);
      if (!created) throw new Error('Failed to create chat session');
      await setCurrentSessionAndLoad(created.id);
      return created.id;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }, [currentSession, resolveDefaultTitle, createSession, setCurrentSessionAndLoad]);

  const startNewSession = useCallback(async () => {
    await clearCurrentSession();
  }, [clearCurrentSession]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await removeSession(sessionId);
        if (currentSession === sessionId) {
          await clearCurrentSession();
          await loadSessions();
        } else {
          await loadSessions();
        }
      } catch {
        // ignore errors for deletion to keep UI responsive
      }
    },
    [removeSession, currentSession, clearCurrentSession, loadSessions]
  );

  useEffect(() => {
    if (!authReady) return;
    void (async () => {
      await Promise.allSettled([loadSessions(), hydrateCurrentSession()]);
    })();
  }, [authReady, loadSessions, hydrateCurrentSession]);

  return {
    sessions,
    currentSession,
    loadSessions,
    ensureActiveSession,
    startNewSession,
    deleteSession,
    setCurrentSessionAndLoad,
    clearCurrentSession,
    hydrateCurrentSession,
  } as const;
}
