'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { DraftPanel } from '@/features/therapy/cbt/components/draft-panel';
import { DiaryHeader } from '@/features/therapy/cbt/components/diary-header';
import { logger } from '@/lib/utils/logger';
import { useCBT } from '@/contexts/cbt-context';
import { useChatPersistence } from '@/features/chat/hooks/use-chat-persistence';
import { useSelectSession } from '@/hooks/use-select-session';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import { CBTDiaryFlow } from '@/features/therapy/cbt/components/cbt-diary-flow';
import type { CBTSessionData } from '@/features/therapy/cbt/hooks/use-cbt-flow';
import {
  hasPersistedDraft,
  getPersistedDraftTimestamp,
  clearPersistedDraft,
} from '@/features/therapy/cbt/hooks/use-persisted-cbt-flow';
import { CBT_STEP_ORDER } from '@/features/therapy/cbt/flow/types';
import { sendToChat } from '@/features/therapy/cbt/utils/send-to-chat';
import { sessionKeys } from '@/lib/queries/sessions';
import { useSession } from '@/contexts/session-context';
import { useApiKeys } from '@/hooks/use-api-keys';

function CBTDiaryPageContent() {
  const router = useRouter();
  const cbt = useCBT();
  const { showToast } = useToast();
  const t = useTranslations('cbt');
  const toastT = useTranslations('toast');
  const { selectSession } = useSelectSession();
  const queryClient = useQueryClient();
  const { keys, isActive: byokActive } = useApiKeys();
  const byokKey = byokActive ? keys.openai : null;

  // View state
  const [hasStarted, setHasStarted] = useState(false);
  const [skipHydration, setSkipHydration] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session data for send to chat
  const [sessionData, setSessionData] = useState<CBTSessionData | null>(null);

  // Check for existing draft using the new persisted flow utilities
  const [hasDraft, setHasDraft] = useState(false);
  const [draftLastSaved, setDraftLastSaved] = useState<string | undefined>(undefined);

  // Check for persisted draft on mount (client-side only)
  useEffect(() => {
    setHasDraft(hasPersistedDraft());
    setDraftLastSaved(getPersistedDraftTimestamp() ?? undefined);
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle draft deletion
  const handleDeleteDraft = useCallback(() => {
    try {
      clearPersistedDraft();
      cbt.clearCBTSession();
      setHasDraft(false);
      setDraftLastSaved(undefined);
      showToast({
        type: 'success',
        title: toastT('draftDeletedTitle'),
        message: toastT('draftDeletedBody'),
      });
    } catch {
      showToast({
        type: 'error',
        title: toastT('draftDeleteFailedTitle'),
        message: toastT('draftDeleteFailedBody'),
      });
    }
  }, [cbt, showToast, toastT]);

  // Resume existing draft - will hydrate from localStorage
  const handleResumeDraft = useCallback(() => {
    setSkipHydration(false);
    setHasStarted(true);
    showToast({
      type: 'success',
      title: toastT('draftResumedTitle'),
      message: toastT('draftResumedBody'),
    });
  }, [showToast, toastT]);

  // Start fresh - clear all draft data and skip hydration
  const handleStartFresh = useCallback(() => {
    clearPersistedDraft();
    cbt.clearCBTSession();
    setSkipHydration(true);
    setHasStarted(true);
    showToast({
      type: 'info',
      title: toastT('newSessionStartedTitle'),
      message: toastT('newSessionStartedBody'),
    });
  }, [cbt, showToast, toastT]);

  // Start CBT session (when no draft exists)
  const handleStartCBT = useCallback(() => {
    setSkipHydration(false);
    setHasStarted(true);
  }, []);

  // Handle session data changes (for auto-save)
  const handleSessionChange = useCallback((data: CBTSessionData) => {
    setSessionData(data);
  }, []);

  // Send completed session to chat
  const handleSendToChat = useCallback(async () => {
    if (!sessionData) {
      showToast({
        type: 'warning',
        title: toastT('noCbtSessionTitle'),
        message: toastT('noCbtSessionBody'),
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Build flowState for sendToChat
      const flowState = {
        sessionId: null,
        startedAt: sessionData.lastModified,
        updatedAt: sessionData.lastModified,
        status: 'complete' as const,
        currentStepId: 'complete' as const,
        completedSteps: [...CBT_STEP_ORDER],
        context: {
          situation: sessionData.situation ?? undefined,
          emotions: sessionData.emotions ?? undefined,
          thoughts: sessionData.thoughts,
          coreBelief: sessionData.coreBelief ?? undefined,
          challengeQuestions: sessionData.challengeQuestions ?? undefined,
          rationalThoughts: sessionData.rationalThoughts ?? undefined,
          schemaModes: sessionData.schemaModes ?? undefined,
          actionPlan: sessionData.actionPlan ?? undefined,
          finalEmotions: sessionData.finalEmotions ?? undefined,
        },
      };

      const { sessionId } = await sendToChat({
        title: t('sessionReportTitle'),
        flowState,
        contextualMessages: [],
        model: (await import('@/features/chat/config')).ANALYTICAL_MODEL_ID,
        byokKey,
      });

      await selectSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      cbt.startCBTSession({ sessionId });

      // Clear persisted draft after successful send
      clearPersistedDraft();
      setHasStarted(false);

      showToast({
        type: 'success',
        title: toastT('cbtSentTitle'),
        message: toastT('cbtSentBody'),
      });

      router.replace('/');
    } catch (error) {
      logger.error(
        'Error sending CBT session to chat',
        { component: 'CBTDiaryPage', operation: 'handleSendToChat' },
        error instanceof Error ? error : new Error(String(error))
      );
      showToast({
        type: 'error',
        title: toastT('cbtSendFailedTitle'),
        message: toastT('cbtSendFailedBody'),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    sessionData,
    isSubmitting,
    router,
    showToast,
    t,
    selectSession,
    toastT,
    cbt,
    byokKey,
    queryClient,
  ]);

  return (
    <div
      className={cn('bg-background flex h-screen flex-col', isMobile && 'cbt-compact')}
      style={{ height: '100dvh' }}
    >
      {/* Header */}
      <DiaryHeader
        isMobile={isMobile}
        isCBTActive={hasStarted}
        cbtCurrentStep="situation"
        onBack={() => router.push('/')}
      />

      {/* Content */}
      <div
        className="scroll-container min-h-0 flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className={cn(
            'mx-auto min-h-full max-w-4xl py-6',
            isMobile ? 'px-3 pb-6' : 'px-4 pb-8 sm:px-6'
          )}
        >
          {!hasStarted ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="animate-fade-in max-w-2xl text-center">
                <div className="mb-8">
                  <div className="bg-muted mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-lg">
                    <Brain className="text-primary h-8 w-8 animate-pulse sm:h-12 sm:w-12" />
                  </div>
                  <h2 className="gradient-text mb-4 text-3xl">{t('welcome.title')}</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('welcome.subtitle')}
                  </p>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-card/50 border-border/50 rounded-xl border p-4 text-left">
                    <h3 className="text-primary mb-2 text-xl font-semibold">
                      🧠 {t('welcome.evidenceTitle')}
                    </h3>
                    <p className="text-muted-foreground text-sm">{t('welcome.evidenceDesc')}</p>
                  </div>
                  <div className="bg-card/50 border-border/50 rounded-xl border p-4 text-left">
                    <h3 className="text-accent mb-2 text-xl font-semibold">
                      💡 {t('welcome.interactiveTitle')}
                    </h3>
                    <p className="text-muted-foreground text-sm">{t('welcome.interactiveDesc')}</p>
                  </div>
                </div>

                {hasDraft ? (
                  <DraftPanel
                    hasDraft={true}
                    draftLastSaved={draftLastSaved}
                    onDeleteDraft={handleDeleteDraft}
                    onResume={handleResumeDraft}
                    onStartFresh={handleStartFresh}
                  />
                ) : (
                  <DraftPanel
                    hasDraft={false}
                    onDeleteDraft={handleDeleteDraft}
                    onResume={handleStartCBT}
                    onStartFresh={handleStartFresh}
                  />
                )}
              </div>
            </div>
          ) : (
            <div data-testid="cbt-diary-flow">
              <CBTDiaryFlow
                skipHydration={skipHydration}
                onChange={handleSessionChange}
                onComplete={handleSessionChange}
                onSendToChat={handleSendToChat}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main export with ChatUIProvider wrapper
export default function CBTDiaryPage() {
  const { currentSessionId } = useSession();
  const [currentSession, setCurrentSession] = useState<string | null>(currentSessionId ?? null);
  const { saveMessage } = useChatPersistence(currentSession);

  useEffect(() => {
    setCurrentSession(currentSessionId ?? null);
  }, [currentSessionId]);

  // Create the chat UI bridge for CBT components
  const chatUIBridge: ChatUIBridge = {
    addMessageToChat: async (message) => {
      // Ensure we have a session
      const sessionId = message.sessionId || currentSession;
      if (!sessionId) {
        return { success: false, error: 'No session available' };
      }

      // Use the persistence hook to save the message
      const result = await saveMessage({
        role: message.role,
        content: message.content,
        modelUsed: message.modelUsed,
      });

      return result;
    },
    currentSessionId: currentSession,
    isLoading: false,
  };

  return (
    <ChatUIProvider bridge={chatUIBridge}>
      <CBTDiaryPageContent />
    </ChatUIProvider>
  );
}
