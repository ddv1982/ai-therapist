'use client';

import React, { useState } from 'react';
import { SessionSidebar } from './session-sidebar';
import { 
  useFetchSessionsQuery, 
  useCreateSessionMutation, 
  useDeleteSessionMutation,
  SessionData
} from '@/store/slices/sessionsApi';

export function SessionSidebarContainer({
  isMobile,
  showSidebar,
  setShowSidebar,
  children,
}: { isMobile: boolean; showSidebar: boolean; setShowSidebar: (show: boolean) => void; children?: React.ReactNode }) {
  // Normalize SessionData to match SessionSidebarProps expectations
  const { data: apiSessions = [] } = useFetchSessionsQuery() as unknown as { data: SessionData[] };
  const sessions = apiSessions.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    startedAt: new Date(s.createdAt),
    status: 'active',
    _count: { messages: s.messageCount }
  }));
  const [createSession] = useCreateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const handleStartNewSession = async () => {
    try {
      const newSession = await createSession({ title: 'New Session' }).unwrap();
      setCurrentSession(newSession.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId).unwrap();
      if (currentSession === sessionId) {
        setCurrentSession(null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleLoadMessages = (sessionId: string) => {
    // Messages are automatically fetched via chatApi when session is selected
    setCurrentSession(sessionId);
  };

  return (
    <SessionSidebar
      showSidebar={showSidebar}
      setShowSidebar={setShowSidebar}
      sessions={sessions}
      currentSession={currentSession}
      setCurrentSession={setCurrentSession}
      loadMessages={handleLoadMessages}
      deleteSession={handleDeleteSession}
      startNewSession={handleStartNewSession}
      isMobile={isMobile}
      onSessionSelect={setCurrentSession}
      onSessionDelete={handleDeleteSession}
      onNewSession={handleStartNewSession}
    >
      {children}
    </SessionSidebar>
  );
}
