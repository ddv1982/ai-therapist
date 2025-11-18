'use client';

import { useCallback, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { getApiData } from '@/lib/api/api-response';
import { mapApiSessionToUiSession } from '@/lib/chat/session-mapper';
import type { components } from '@/types/api/sessions';
import type { PaginatedResponse } from '@/lib/api/api-response';

type UiSession = ReturnType<typeof mapApiSessionToUiSession>;

export function useSessionStore() {
  const [sessions, setSessions] = useState<UiSession[]>([]);
  const loadingRef = useRef(false);

  const loadSessions = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const sessionsData = await apiClient.listSessions();
      const response = getApiData(sessionsData) as PaginatedResponse<
        components['schemas']['Session']
      >;
      const sessionsArray = response?.items || [];
      const uiSessions: UiSession[] = sessionsArray.map(mapApiSessionToUiSession) as UiSession[];
      setSessions(uiSessions);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const removeSession = useCallback(async (sessionId: string) => {
    const resp = await apiClient.deleteSession(sessionId);
    if (resp) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  }, []);

  const createSession = useCallback(async (title: string) => {
    const result = await apiClient.createSession({ title });
    const created = getApiData(result) as components['schemas']['Session'];
    const ui = mapApiSessionToUiSession(created) as UiSession;
    setSessions((prev) => [ui, ...prev]);
    return ui;
  }, []);

  return { sessions, setSessions, loadSessions, removeSession, createSession } as const;
}
