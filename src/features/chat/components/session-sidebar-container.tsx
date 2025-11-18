'use client';

import { SessionSidebar } from './session-sidebar';
import { useSessionsQuery, useDeleteSessionMutation } from '@/lib/queries/sessions';
import { useSession } from '@/contexts/session-context';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/utils/logger';
import { useSelectSession } from '@/hooks';
import { useTranslations } from 'next-intl';

export function SessionSidebarContainer({
  isMobile,
  showSidebar,
  setShowSidebar,
  children,
}: {
  isMobile: boolean;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  children?: React.ReactNode;
}) {
  // i18n available if needed in future; unused here as we defer creation
  const { currentSessionId, setCurrentSession } = useSession();
  // Normalize SessionData to match SessionSidebarProps expectations
  const { data: apiSessions = [] } = useSessionsQuery();
  const sessions = apiSessions.map((s) => ({
    ...s,
    userId: 'default-user-id', // Add default userId for Session type compatibility
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    startedAt: s.createdAt, // Keep as string for Session type compatibility
    status: 'active' as const,
    _count: {
      messages:
        (s as unknown as { _count?: { messages?: number } })._count?.messages ??
        (s as unknown as { messageCount?: number }).messageCount ??
        0,
    },
  }));
  const deleteSessionMutation = useDeleteSessionMutation();
  const { selectSession } = useSelectSession();
  const { showToast } = useToast();
  const t = useTranslations('toast');

  // Session hydration is now handled in SessionProvider only

  // Title resolution not needed here since we defer session creation until send

  const handleStartNewSession = async () => {
    // Do not create a DB session yet; clear selection and let first send create it
    setCurrentSession(null);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSession(null);
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: t('deleteSessionFailedTitle'),
        message: t('deleteSessionFailedBody'),
      });
      logger.error(
        'Failed to delete session',
        { component: 'SessionSidebarContainer', sessionId },
        err as Error
      );
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
