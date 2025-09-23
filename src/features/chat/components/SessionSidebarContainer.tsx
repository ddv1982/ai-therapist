'use client';

import React, { useEffect } from 'react';
import { SessionSidebar } from './session-sidebar';
import { 
  useFetchSessionsQuery, 
  useDeleteSessionMutation,
  useGetCurrentSessionQuery,
  SessionData
} from '@/store/slices/sessionsApi';
// import { useTranslations } from 'next-intl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentSession as setCurrentSessionAction } from '@/store/slices/sessionsSlice';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/utils/logger';
import { useSelectSession } from '@/hooks';

export function SessionSidebarContainer({
  isMobile,
  showSidebar,
  setShowSidebar,
  children,
}: { isMobile: boolean; showSidebar: boolean; setShowSidebar: (show: boolean) => void; children?: React.ReactNode }) {
  // i18n available if needed in future; unused here as we defer creation
  // const t = useTranslations();
  const dispatch = useAppDispatch();
  // Normalize SessionData to match SessionSidebarProps expectations
  const { data: apiSessions = [] } = useFetchSessionsQuery() as unknown as { data: SessionData[] };
  const sessions = apiSessions.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    startedAt: new Date(s.createdAt),
    status: 'active',
    _count: { messages: (s as unknown as { _count?: { messages?: number } })._count?.messages ?? (s as unknown as { messageCount?: number }).messageCount ?? 0 }
  }));
  const [deleteSession] = useDeleteSessionMutation();
  const { data: currentServerSession, refetch: refetchCurrent } = useGetCurrentSessionQuery();
  const currentSessionId = useAppSelector(state => state.sessions.currentSessionId);
  const { selectSession } = useSelectSession();
  const { showToast } = useToast();

  // Hydrate from server on mount
  useEffect(() => {
    if (currentServerSession?.id) {
      dispatch(setCurrentSessionAction(currentServerSession.id));
    }
  }, [currentServerSession?.id, dispatch]);

  // Title resolution not needed here since we defer session creation until send

  const handleStartNewSession = async () => {
    // Do not create a DB session yet; clear selection and let first send create it
    dispatch(setCurrentSessionAction(null));
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId).unwrap();
      if (currentSessionId === sessionId) {
        dispatch(setCurrentSessionAction(null));
        try {
          const refreshed = await refetchCurrent();
          const nextId = (refreshed?.data as { id?: string } | undefined)?.id ?? null;
          if (nextId) {
            dispatch(setCurrentSessionAction(nextId));
          }
        } catch {}
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Delete failed', message: 'Could not delete the session. Please try again.' });
      logger.error('Failed to delete session', { component: 'SessionSidebarContainer', sessionId }, err as Error);
    }
  };

  const handleLoadMessages = async (sessionId: string) => {
    await selectSession(sessionId);
  };

  return (
    <SessionSidebar
      showSidebar={showSidebar}
      setShowSidebar={setShowSidebar}
      sessions={sessions}
      currentSession={currentSessionId}
      setCurrentSession={(id) => dispatch(setCurrentSessionAction(id))}
      loadMessages={handleLoadMessages}
      deleteSession={handleDeleteSession}
      startNewSession={handleStartNewSession}
      isMobile={isMobile}
      onSessionSelect={(id) => dispatch(setCurrentSessionAction(id))}
      onSessionDelete={handleDeleteSession}
      onNewSession={handleStartNewSession}
    >
      {children}
    </SessionSidebar>
  );
}
