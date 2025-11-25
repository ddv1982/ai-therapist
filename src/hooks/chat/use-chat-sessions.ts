'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useSelectSession } from '@/hooks/use-select-session';
import { useAuthReady } from '@/hooks/auth/use-auth-ready';
import {
  useSessionsQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
  type SessionData,
} from '@/lib/queries/sessions';
import type { UiSession } from '@/lib/chat/session-mapper';
import { useSession } from '@/contexts/session-context';

interface UseChatSessionsOptions {
  loadMessages: (sessionId: string) => Promise<void>;
  clearMessages: () => void;
  resolveDefaultTitle: () => string;
}

export function useChatSessions(options: UseChatSessionsOptions) {
  const { loadMessages, clearMessages, resolveDefaultTitle } = options;
  const { selectSession } = useSelectSession();
  const { currentSessionId, setCurrentSession } = useSession();
  const authReady = useAuthReady();

  const { data: apiSessions = [], refetch: refetchSessions } = useSessionsQuery({
    enabled: authReady,
  });

  const { mutateAsync: createSessionRequest } = useCreateSessionMutation();
  const { mutateAsync: deleteSessionRequest } = useDeleteSessionMutation();
  const lastLoadedSessionIdRef = useRef<string | null>(null);

  const sessions: UiSession[] = useMemo(() => {
    return (apiSessions ?? []).map((session: SessionData) => ({
      id: session.id,
      title: session.title,
      startedAt: session.createdAt ? new Date(session.createdAt) : undefined,
      lastMessage: session.lastMessage,
      _count: session.messageCount !== undefined ? { messages: session.messageCount } : undefined,
    }));
  }, [apiSessions]);

  const persistSessionSelection = useCallback(
    async (sessionId: string | null) => {
      setCurrentSession(sessionId);
      await selectSession(sessionId);
    },
    [selectSession, setCurrentSession]
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
    if (!authReady) return;
    await refetchSessions();
  }, [authReady, refetchSessions]);

  const ensureActiveSession = useCallback(async () => {
    if (currentSessionId) return currentSessionId;
    try {
      const title = resolveDefaultTitle();
      const created = await createSessionRequest({ title });
      if (!created?.id) throw new Error('Failed to create chat session');
      await loadSessions();
      await setCurrentSessionAndLoad(created.id);
      return created.id;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }, [
    currentSessionId,
    resolveDefaultTitle,
    createSessionRequest,
    setCurrentSessionAndLoad,
    loadSessions,
  ]);

  const startNewSession = useCallback(async () => {
    await clearCurrentSession();
    await loadSessions();
  }, [clearCurrentSession, loadSessions]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSessionRequest(sessionId);
        if (currentSessionId === sessionId) {
          await clearCurrentSession();
        }
        await loadSessions();
      } catch {
        // ignore errors for deletion to keep UI responsive
      }
    },
    [deleteSessionRequest, currentSessionId, clearCurrentSession, loadSessions]
  );

  useEffect(() => {
    if (!currentSessionId) {
      if (lastLoadedSessionIdRef.current === null) return;
      lastLoadedSessionIdRef.current = null;
      clearMessages();
      return;
    }

    if (lastLoadedSessionIdRef.current === currentSessionId) return;
    lastLoadedSessionIdRef.current = currentSessionId;

    void loadMessages(currentSessionId).catch(() => {
      if (lastLoadedSessionIdRef.current === currentSessionId) {
        lastLoadedSessionIdRef.current = null;
      }
    });
  }, [currentSessionId, clearMessages, loadMessages]);

  return {
    sessions,
    currentSession: currentSessionId,
    loadSessions,
    ensureActiveSession,
    startNewSession,
    deleteSession,
    setCurrentSessionAndLoad,
  } as const;

  useEffect(() => {
    if (!currentSessionId) {
      if (lastLoadedSessionIdRef.current === null) return;
      lastLoadedSessionIdRef.current = null;
      clearMessages();
      return;
    }

    if (lastLoadedSessionIdRef.current === currentSessionId) return;
    lastLoadedSessionIdRef.current = currentSessionId;

    void loadMessages(currentSessionId).catch(() => {
      if (lastLoadedSessionIdRef.current === currentSessionId) {
        lastLoadedSessionIdRef.current = null;
      }
    });
  }, [currentSessionId, clearMessages, loadMessages]);
}
