'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelectSession } from '@/hooks/use-select-session';
import { useAuthReady } from '@/hooks/auth/use-auth-ready';
import {
  useSessionsQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useCurrentSessionQuery,
  type SessionData,
} from '@/lib/queries/sessions';
import type { UiSession } from '@/lib/chat/session-mapper';

interface UseChatSessionsOptions {
  loadMessages: (sessionId: string) => Promise<void>;
  clearMessages: () => void;
  resolveDefaultTitle: () => string;
}

export function useChatSessions(options: UseChatSessionsOptions) {
  const { loadMessages, clearMessages, resolveDefaultTitle } = options;
  const { selectSession } = useSelectSession();
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const authReady = useAuthReady();
  const hydratedSessionRef = useRef<string | null | undefined>(undefined);

  const {
    data: apiSessions = [],
    refetch: refetchSessions,
  } = useSessionsQuery({ enabled: authReady });

  const {
    data: currentSessionRecord,
    refetch: refetchCurrentSession,
  } = useCurrentSessionQuery({ enabled: authReady });

  const { mutateAsync: createSessionRequest } = useCreateSessionMutation();
  const { mutateAsync: deleteSessionRequest } = useDeleteSessionMutation();

  const sessions: UiSession[] = useMemo(() => {
    return (apiSessions ?? []).map((session: SessionData) => ({
      id: session.id,
      title: session.title,
      startedAt: session.createdAt ? new Date(session.createdAt) : undefined,
      lastMessage: session.lastMessage,
      _count:
        session.messageCount !== undefined
          ? { messages: session.messageCount }
          : undefined,
    }));
  }, [apiSessions]);

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
    if (!authReady) return;
    await refetchSessions();
  }, [authReady, refetchSessions]);

  const hydrateCurrentSession = useCallback(async () => {
    if (!authReady) return;
    hydratedSessionRef.current = undefined;
    await refetchCurrentSession();
  }, [authReady, refetchCurrentSession]);

  const ensureActiveSession = useCallback(async () => {
    if (currentSession) return currentSession;
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
  }, [currentSession, resolveDefaultTitle, createSessionRequest, setCurrentSessionAndLoad, loadSessions]);

  const startNewSession = useCallback(async () => {
    await clearCurrentSession();
    await loadSessions();
  }, [clearCurrentSession, loadSessions]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSessionRequest(sessionId);
        if (currentSession === sessionId) {
          await clearCurrentSession();
        }
        await loadSessions();
      } catch {
        // ignore errors for deletion to keep UI responsive
      }
    },
    [deleteSessionRequest, currentSession, clearCurrentSession, loadSessions]
  );

  useEffect(() => {
    if (!authReady) return;
    if (currentSessionRecord === undefined) return;

    const nextId = currentSessionRecord?.id ?? null;
    if (hydratedSessionRef.current === nextId) return;
    hydratedSessionRef.current = nextId;

    if (nextId) {
      void setCurrentSessionAndLoad(nextId);
    } else {
      void clearCurrentSession();
    }
  }, [
    authReady,
    currentSessionRecord,
    setCurrentSessionAndLoad,
    clearCurrentSession,
  ]);

  return {
    sessions,
    currentSession,
    loadSessions,
    ensureActiveSession,
    startNewSession,
    deleteSession,
    setCurrentSessionAndLoad,
    hydrateCurrentSession,
  } as const;
}
