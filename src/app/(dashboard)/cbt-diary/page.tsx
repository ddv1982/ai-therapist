'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { DraftPanel } from '@/features/therapy/cbt/components/draft-panel';
import { FooterInfo } from '@/features/therapy/cbt/components/footer-info';
import { DiaryHeader } from '@/features/therapy/cbt/components/diary-header';
import { DiaryProgress } from '@/features/therapy/cbt/components/diary-progress';
import { logger } from '@/lib/utils/logger';
import type { MessageData } from '@/features/chat/messages/message';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import { useCBT } from '@/contexts/cbt-context';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useSelectSession } from '@/hooks';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
//
import { useCbtDiaryFlow } from '@/features/therapy/cbt/hooks/use-cbt-diary-flow';
import { sendToChat } from '@/features/therapy/cbt/utils/send-to-chat';
import { sessionKeys } from '@/lib/queries/sessions';
import { useSession } from '@/contexts/session-context';
import { useApiKeys } from '@/hooks/use-api-keys';

// Using MessageData from the message system
// Type alias not required locally

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

  // Get session ID from CBT context
  const reduxSessionId = cbt.flow?.sessionId ?? null;
  // Streaming and view state
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // CBT Diary Flow (encapsulated logic)
  const {
    messages,
    isCBTActive,
    cbtCurrentStep,
    cbtFlowState,
    goToStep,
    startCBTFlow,
    handleCBTSituationComplete,
    handleCBTEmotionComplete,
    handleCBTThoughtComplete,
    handleCBTCoreBeliefComplete,
    handleCBTChallengeQuestionsComplete,
    handleCBTRationalThoughtsComplete,
    handleCBTSchemaModesComplete,
    handleCBTActionComplete,
    handleCBTFinalEmotionsComplete,
  } = useCbtDiaryFlow();

  // Auto-scroll only when non-CBT text messages are appended (avoid jank on steps)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    const isCBTComponent = Boolean(last.metadata?.step);
    if (!isCBTComponent) scrollToBottom();
  }, [messages]);

  // Check for existing draft using saved drafts for immediate UI updates
  const { draftActions, savedDrafts, currentDraft } = useCBTDataManager();
  const hasDraft = (savedDrafts?.length || 0) > 0 || !!currentDraft;
  const draftLastSaved: string | undefined =
    savedDrafts && savedDrafts[0] ? savedDrafts[0].lastSaved : undefined;

  // Delete existing draft from Redux
  const handleDeleteDraft = useCallback(() => {
    try {
      // Remove any saved drafts
      if (savedDrafts && savedDrafts.length > 0) {
        for (const d of savedDrafts) {
          draftActions.delete(d.id);
        }
      }
      // Clear current unsaved draft state
      draftActions.reset();
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
  }, [draftActions, savedDrafts, showToast, toastT]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Resume existing draft using unified CBT
  const handleResumeDraft = useCallback(async () => {
    setHasStarted(true);

    // The unified CBT hook will automatically load the existing draft
    // No need to manually restore - it's already available via unifiedSessionData
    startCBTFlow();

    showToast({
      type: 'success',
      title: toastT('draftResumedTitle'),
      message: toastT('draftResumedBody'),
    });

    logger.info('Resumed CBT draft', {
      component: 'CBTDiaryPage',
      operation: 'handleResumeDraft',
      sessionId: reduxSessionId || undefined,
    });
  }, [startCBTFlow, showToast, reduxSessionId, toastT]);

  // Start fresh CBT session (clearing any existing draft)
  const handleStartFresh = useCallback(async () => {
    // Use unified CBT action to reset everything
    draftActions.reset();

    showToast({
      type: 'info',
      title: toastT('newSessionStartedTitle'),
      message: toastT('newSessionStartedBody'),
    });
  }, [draftActions, showToast, toastT]);

  // Start CBT session when user clicks start button
  const handleStartCBT = useCallback(async () => {
    setHasStarted(true);
    // Do NOT create a chat session at start. We only create one on "Send to Chat".
    startCBTFlow();
  }, [startCBTFlow]);

  // No local guard needed; handled inside the hook

  // Initial CBT step insertion handled here

  // Handlers defined below

  const handleSendToChat = useCallback(async () => {
    if (!hasStarted || !isCBTActive) {
      showToast({
        type: 'warning',
        title: toastT('noCbtSessionTitle'),
        message: toastT('noCbtSessionBody'),
      });
      return;
    }

    // Guard against accidental double-clicks or rapid re-submissions
    if (isLoading || isStreaming) return;

    setIsLoading(true);
    setIsStreaming(true);

    try {
      if (!cbtFlowState) {
        throw new Error('CBT flow state missing');
      }

      const contextual = messages
        .filter((msg: MessageData) => !msg.metadata?.step)
        .map((m: MessageData) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        }));

      const { sessionId } = await sendToChat({
        title: t('sessionReportTitle'),
        flowState: cbtFlowState,
        contextualMessages: contextual,
        model: (await import('@/features/chat/config')).ANALYTICAL_MODEL_ID,
        byokKey,
      });

      await selectSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      cbt.startCBTSession({ sessionId });

      // Clear CBT session since it's complete - use unified CBT action
      draftActions.reset();

      // Reset component state
      setHasStarted(false);

      // Show success
      showToast({
        type: 'success',
        title: toastT('cbtSentTitle'),
        message: toastT('cbtSentBody'),
      });

      // Redirect back to root, chat will load current session
      router.replace('/');
    } catch (error) {
      logger.error(
        'Error sending CBT session to chat',
        {
          component: 'CBTDiaryPage',
          operation: 'handleSendToChat',
          sessionId: reduxSessionId || 'unknown',
          hasStarted,
          isCBTActive,
        },
        error instanceof Error ? error : new Error(String(error))
      );
      showToast({
        type: 'error',
        title: toastT('cbtSendFailedTitle'),
        message: toastT('cbtSendFailedBody'),
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [
    hasStarted,
    isCBTActive,
    isLoading,
    isStreaming,
    cbtFlowState,
    messages,
    router,
    showToast,
    draftActions,
    reduxSessionId,
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
        isCBTActive={isCBTActive}
        cbtCurrentStep={cbtCurrentStep}
        onBack={() => router.push('/')}
      />

      <DiaryProgress
        isMobile={isMobile}
        isCBTActive={isCBTActive}
        cbtCurrentStep={cbtCurrentStep}
      />

      {/* Messages */}
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

                {/* Draft detection and action buttons */}
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
            <div data-testid="cbt-welcome">
              <VirtualizedMessageList
                messages={messages}
                isStreaming={isLoading}
                isMobile={isMobile}
                activeCBTStep={cbtCurrentStep}
                onCBTStepNavigate={goToStep}
                onCBTSituationComplete={handleCBTSituationComplete}
                onCBTEmotionComplete={handleCBTEmotionComplete}
                onCBTThoughtComplete={handleCBTThoughtComplete}
                onCBTCoreBeliefComplete={handleCBTCoreBeliefComplete}
                onCBTChallengeQuestionsComplete={handleCBTChallengeQuestionsComplete}
                onCBTRationalThoughtsComplete={handleCBTRationalThoughtsComplete}
                onCBTSchemaModesComplete={handleCBTSchemaModesComplete}
                onCBTSendToChat={handleSendToChat}
                onCBTFinalEmotionsComplete={handleCBTFinalEmotionsComplete}
                onCBTActionComplete={handleCBTActionComplete}
              />
              {/* Inline quick draft form removed */}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Progress Information - desktop only */}
      {!isMobile && (
        <FooterInfo
          isStreaming={isStreaming}
          isCBTActive={isCBTActive}
          cbtCurrentStep={cbtCurrentStep}
          hasStarted={hasStarted}
        />
      )}
    </div>
  );
}

// Main export with ChatUIProvider wrapper
export default function CBTDiaryPage() {
  const { addMessageToChat } = useChatMessages();
  const { currentSessionId } = useSession();
  const [currentSession, setCurrentSession] = useState<string | null>(currentSessionId ?? null);

  // Session management for CBT diary (do not auto-create sessions)
  const ensureSession = useCallback(async (): Promise<string | null> => {
    return currentSessionId ?? null;
  }, [currentSessionId]);

  useEffect(() => {
    setCurrentSession(currentSessionId ?? null);
  }, [currentSessionId]);

  // Create the chat UI bridge for CBT components
  const chatUIBridge: ChatUIBridge = {
    addMessageToChat: async (message) => {
      // Ensure we have a session
      const sessionId = message.sessionId || currentSession || (await ensureSession());
      if (!sessionId) {
        return { success: false, error: 'No session available' };
      }

      // Use the message API directly since this is a standalone page
      return await addMessageToChat({
        ...message,
        sessionId,
      });
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
