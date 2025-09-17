'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';
import {useTranslations} from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/utils';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { DraftPanel } from '@/features/therapy/cbt/components/draft-panel';
import { FooterInfo } from '@/features/therapy/cbt/components/footer-info';
import { DiaryHeader } from '@/features/therapy/cbt/components/diary-header';
import { DiaryProgress } from '@/features/therapy/cbt/components/diary-progress';
import { logger } from '@/lib/utils/logger';
import type { MessageData } from '@/features/chat/messages/message';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { startCBTSession as startReduxCBTSession } from '@/store/slices/cbtSlice';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useSelectSession } from '@/hooks';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/types/api.generated';
//
import { useCbtDiaryFlow } from '@/features/therapy/cbt/hooks/use-cbt-diary-flow';
import { sendToChat } from '@/features/therapy/cbt/utils/send-to-chat';

// Using MessageData from the message system
// Type alias not required locally

function CBTDiaryPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const t = useTranslations('cbt');
  const { selectSession } = useSelectSession();
  
  // Get session ID from Redux
  const reduxSessionId = useAppSelector((state) => state.cbt?.flow?.sessionId ?? null);
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
  const draftLastSaved: string | undefined = (savedDrafts && savedDrafts[0]) ? savedDrafts[0].lastSaved : undefined;
  
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
        title: 'Draft Deleted',
        message: 'Your previous CBT draft has been removed.'
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Unable to delete draft',
        message: 'Please try again.'
      });
    }
  }, [draftActions, savedDrafts, showToast]);

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
      title: 'Draft Resumed',
      message: 'Continuing your previous CBT session'
    });
    
    logger.info('Resumed CBT draft', {
      component: 'CBTDiaryPage',
      operation: 'handleResumeDraft',
      sessionId: reduxSessionId || undefined
    });
  }, [startCBTFlow, showToast, reduxSessionId]);

  // Start fresh CBT session (clearing any existing draft)
  const handleStartFresh = useCallback(async () => {
    // Use unified CBT action to reset everything
    draftActions.reset();

    showToast({
      type: 'info',
      title: 'New Session Started',
      message: 'Previous draft cleared, starting fresh'
    });
  }, [draftActions, showToast]);

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
        title: 'No CBT Session',
        message: 'Please start and complete some CBT steps first.'
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
        .map((m: MessageData) => ({ role: m.role, content: m.content, timestamp: m.timestamp.toISOString() }));

      const { sessionId } = await sendToChat({
        title: t('sessionReportTitle'),
        flowState: cbtFlowState,
        contextualMessages: contextual,
        model: (await import('@/features/chat/config')).ANALYTICAL_MODEL_ID,
      });

      await selectSession(sessionId);
      dispatch(startReduxCBTSession({ sessionId }));
 
      // Clear CBT session since it's complete - use unified CBT action
      draftActions.reset();
      
      // Reset component state  
      setHasStarted(false);
      
      // Show success
      showToast({
        type: 'success',
        title: 'CBT Session Analyzed & Sent',
        message: 'Your CBT session and therapeutic analysis have been added to your chat!'
      });
      
      // Redirect back to root, chat will load current session
      router.replace('/');
      
    } catch (error) {
      logger.error('Error sending CBT session to chat', {
        component: 'CBTDiaryPage',
        operation: 'handleSendToChat',
        sessionId: reduxSessionId || 'unknown',
        hasStarted,
        isCBTActive
      }, error instanceof Error ? error : new Error(String(error)));
      showToast({
        type: 'error',
        title: 'Failed to Send',
        message: 'There was an error analyzing and sending your session. Please try again.'
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [hasStarted, isCBTActive, isLoading, isStreaming, cbtFlowState, messages, router, showToast, draftActions, reduxSessionId, dispatch, t, selectSession]);

  return (
    <div className={cn("h-screen bg-background flex flex-col", isMobile && "cbt-compact")} style={{ height: '100dvh' }}>
      {/* Header */}
      <DiaryHeader
        isMobile={isMobile}
        isCBTActive={isCBTActive}
        cbtCurrentStep={cbtCurrentStep}
        onBack={() => router.push('/')}
      />

      <DiaryProgress isMobile={isMobile} isCBTActive={isCBTActive} cbtCurrentStep={cbtCurrentStep} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 scroll-container" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className={cn("max-w-4xl mx-auto py-6 min-h-full", isMobile ? "px-3 pb-6" : "px-4 sm:px-6 pb-8")}>
          {!hasStarted ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-2xl animate-fade-in">
                <div className="mb-8">
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Brain className="w-8 h-8 sm:w-12 sm:h-12 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-3xl mb-4 gradient-text">
                    {t('welcome.title')}
                  </h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('welcome.subtitle')}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-left">
                    <h3 className="text-xl font-semibold text-primary mb-2">🧠 {t('welcome.evidenceTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('welcome.evidenceDesc')}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-left">
                    <h3 className="text-xl font-semibold text-accent mb-2">💡 {t('welcome.interactiveTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('welcome.interactiveDesc')}</p>
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
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const t = useTranslations('cbt');

  // Session management for CBT diary
  const ensureSession = useCallback(async (): Promise<string | null> => {
    try {
      // Try to get current session first
      const current = await apiClient.getCurrentSession();
      const currentSessionData: { currentSession?: { id: string } } = (current && (current as { success?: boolean }).success)
        ? (current as { data: { currentSession?: { id: string } } }).data
        : (current as { currentSession?: { id: string } } | null) || {};
      if (currentSessionData?.currentSession) {
        const sessionId = currentSessionData.currentSession.id;
        setCurrentSession(sessionId);
        return sessionId;
      }

      // If no current session, create a new one for CBT diary
      const title = t('sessionReportTitle');
      const createResp = await apiClient.createSession({ title });
      if (createResp && createResp.success && createResp.data) {
        const newSession = createResp.data as components['schemas']['Session'];
        const sessionId = newSession.id;
        setCurrentSession(sessionId);
        
        // Set as current session
        await apiClient.setCurrentSession(sessionId);
        
        return sessionId;
      }
    } catch (error) {
      logger.error('Failed to ensure session for CBT diary', {
        component: 'CBTDiaryPage',
        operation: 'ensureSession'
      }, error instanceof Error ? error : new Error(String(error)));
    }
    return null;
  }, [t]);

  // Initialize session when component mounts
  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  // Create the chat UI bridge for CBT components
  const chatUIBridge: ChatUIBridge = {
    addMessageToChat: async (message) => {
      // Ensure we have a session
      const sessionId = message.sessionId || currentSession || await ensureSession();
      if (!sessionId) {
        return { success: false, error: 'No session available' };
      }

      // Use the message API directly since this is a standalone page
      return await addMessageToChat({
        ...message,
        sessionId
      });
    },
    currentSessionId: currentSession,
    isLoading: false
  };

  return (
    <ChatUIProvider bridge={chatUIBridge}>
      <CBTDiaryPageContent />
    </ChatUIProvider>
  );
}
