'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  ChevronRight,
  Brain,
  Trash2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {useTranslations} from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { generateUUID, cn } from '@/lib/utils/utils';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { logger } from '@/lib/utils/logger';
import type { MessageData } from '@/features/chat/messages/message';
import { useCBTChatExperience } from '@/features/therapy/cbt/hooks/use-cbt-chat-experience';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';

import { getStepInfo } from '@/features/therapy/cbt/utils/step-mapping';
import type { 
  SituationData, 
  EmotionData, 
  ThoughtData, 
  ActionPlanData,
  CoreBeliefData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData
} from '@/types/therapy';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { startCBTSession as startReduxCBTSession } from '@/store/slices/cbtSlice';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useSelectSession } from '@/hooks';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/types/api.generated';
import { getApiData, type ApiResponse } from '@/lib/api/api-response';

type PostMessageResponse = ApiResponse<components['schemas']['Message']>;

// Using MessageData from the message system
type Message = MessageData;

function CBTDiaryPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const t = useTranslations('cbt');
  const { selectSession } = useSelectSession();
  
  // Get session ID from Redux
  const reduxSessionId = useAppSelector(state => state.cbt?.sessionData?.sessionId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use CBT data manager hook for draft management (transition phase)
  const { draftActions, savedDrafts, currentDraft } = useCBTDataManager();

  // Removed inline quick draft form to keep classic guided flow experience
  
  // Quick draft form removed; state is managed by the guided CBT flow only
  
  // CBT Chat Flow
  const {
    isActive: isCBTActive,
    currentStep: cbtCurrentStep,
    sessionData: cbtSessionData,
    cbtMessages,
    startCBTSession: startCBTFlow,
    completeSituationStep,
    completeEmotionStep,
    completeThoughtStep,
    completeCoreBeliefStep,
    completeChallengeQuestionsStep,
    completeRationalThoughtsStep,
    completeSchemaModesStep,
    completeActionStep,
    completeFinalEmotionsStep,
    generateTherapeuticSummaryCard
  } = useCBTChatExperience();

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing draft using saved drafts for immediate UI updates
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

  // Handle CBT session start and add situation component
  useEffect(() => {
    if (isCBTActive && cbtCurrentStep === 'situation' && cbtMessages.length > 0) {
      // Add CBT situation component directly (no welcome message)
      const { stepNumber, totalSteps } = getStepInfo(cbtCurrentStep);
      const cbtComponentMessage: Message = {
        id: `cbt-component-${Date.now()}`,
        role: 'assistant',
        content: cbtCurrentStep,
        timestamp: new Date(),
        metadata: {
          step: cbtCurrentStep,
          stepNumber,
          totalSteps,
          sessionData: cbtSessionData
        }
      };
      
      setMessages([cbtComponentMessage]);
    }
  }, [isCBTActive, cbtCurrentStep, cbtMessages.length, cbtSessionData]);

  // Effect to add next CBT component when step progresses
  useEffect(() => {
    if (isCBTActive && cbtCurrentStep !== 'situation' && cbtCurrentStep !== 'complete') {
      const { stepNumber, totalSteps } = getStepInfo(cbtCurrentStep);
      
      const cbtComponentMessage: Message = {
        id: `cbt-component-${cbtCurrentStep}-${Date.now()}`,
        role: 'assistant',
        content: cbtCurrentStep,
        timestamp: new Date(),
        metadata: {
          step: cbtCurrentStep,
          stepNumber,
          totalSteps,
          sessionData: cbtSessionData
        }
      };
      
      setMessages(prev => [...prev, cbtComponentMessage]);
    }
  }, [isCBTActive, cbtCurrentStep, cbtSessionData]);

  // CBT Step Completion Handlers
  const handleCBTSituationComplete = useCallback(async (data: SituationData) => {
    completeSituationStep(data);
    
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Thank you for sharing that situation with me. Understanding the context is so important for CBT work. 💙\n\nNow let's explore how this situation made you feel emotionally. Remember, all feelings are valid and it's okay to experience multiple emotions at once.",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [completeSituationStep]);

  const handleCBTEmotionComplete = useCallback(async (data: EmotionData) => {
    completeEmotionStep(data);
    
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "I can see you're experiencing some significant emotions around this situation. These feelings are completely valid and normal. 🌟\n\nNow let's examine what thoughts were running through your mind during this experience. Sometimes our thoughts happen so quickly we barely notice them!",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [completeEmotionStep]);

  const handleCBTThoughtComplete = useCallback(async (data: ThoughtData[]) => {
    completeThoughtStep(data);
    
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Those automatic thoughts can be really powerful and feel very real in the moment. You're doing great work exploring them! 🔍\n\nLet's dig deeper into what core beliefs might be underlying these thoughts. What deeper beliefs about yourself, others, or the world might be connected to this situation?",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [completeThoughtStep]);

  const handleCBTCoreBeliefComplete = useCallback(async (data: CoreBeliefData) => {
    completeCoreBeliefStep(data);
    
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Excellent insight into those deeper beliefs! 💭 Understanding our core beliefs is a crucial step in CBT work.\n\nNow let's challenge these thoughts and beliefs. I'll guide you through some questions to help you examine the evidence and develop a more balanced perspective.",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [completeCoreBeliefStep]);

  const handleCBTChallengeQuestionsComplete = useCallback(async (data: ChallengeQuestionsData) => {
    completeChallengeQuestionsStep(data);
    
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Great work challenging those thoughts! 🌱 You're developing valuable skills for examining your thinking patterns.\n\nNow let's create some more balanced, rational thoughts based on your reflections. These will help you respond differently to similar situations in the future.",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [completeChallengeQuestionsStep]);

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
      // Environment API key is automatically handled by the server
      
      // Generate comprehensive CBT summary using structured card format
      const summaryData = generateTherapeuticSummaryCard();
      const cbtSummary = `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
      
      // Always create a NEW session for each CBT send
      let sessionId: string | null = null;
      const title = t('sessionReportTitle');
      const createResp = await apiClient.createSession({ title });
      if (createResp && createResp.success && createResp.data) {
        const newSession = createResp.data as components['schemas']['Session'];
        sessionId = newSession.id;
        await selectSession(sessionId);
        // Initialize Redux CBT session context with the new session id for bookkeeping
        dispatch(startReduxCBTSession({ sessionId }));
      }
      if (!sessionId) {
        throw new Error('Failed to create a new session for CBT');
      }

      // Precompute report messages payload (summary + contextual messages)
      const reportMessagesPayload = [
        { role: 'user', content: cbtSummary, timestamp: new Date().toISOString() },
        ...messages.filter(msg => !msg.metadata?.step).map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }))
      ];
      
      // Generate the session report using the detailed API (single path)
      let therapeuticAnalysis = '';
      const reportData = await apiClient.generateReportDetailed({
        sessionId: sessionId,
        messages: reportMessagesPayload.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
        model: 'openai/gpt-oss-120b'
      });
      if (reportData && (reportData as { success?: boolean; reportContent?: string }).success && (reportData as { reportContent?: string }).reportContent) {
        therapeuticAnalysis = (reportData as { reportContent: string }).reportContent;
        logger.info('Generated CBT session report via API', {
          component: 'CBTDiaryPage',
          operation: 'handleSendToChat',
          sessionId
        });
      } else {
        throw new Error('Failed to generate session report');
      }

      setIsStreaming(false);

      // Save CBT summary to chat
      const summaryResponse: PostMessageResponse = await apiClient.postMessage(sessionId, { role: 'user', content: cbtSummary });
      getApiData(summaryResponse);

      // Save therapeutic analysis to chat, prefixed as a clear Session Report
      const prefixedReportContent = `📊 **Session Report**\n\n${therapeuticAnalysis}`;
      const analysisMessageResponse: PostMessageResponse = await apiClient.postMessage(sessionId, { role: 'assistant', content: prefixedReportContent, modelUsed: 'openai/gpt-oss-120b' });
      getApiData(analysisMessageResponse);

      // Clear CBT session since it's complete - use unified CBT action
      draftActions.reset();
      
      // Reset component state  
      setHasStarted(false);
      setMessages([]);
      
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
  }, [hasStarted, isCBTActive, isLoading, isStreaming, generateTherapeuticSummaryCard, messages, router, showToast, draftActions, reduxSessionId, dispatch, t, selectSession]);

  const handleCBTRationalThoughtsComplete = useCallback(async (data: RationalThoughtsData) => {
    completeRationalThoughtsStep(data);
    
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Beautiful work developing those balanced thoughts! 🎯 You're really getting the hang of this.\n\nNow let's explore which schema modes feel most active for you right now. Understanding these different parts of yourself can provide valuable insights into your emotional patterns.",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
    
    // Note: handleSendToChat is now called directly from the rational thoughts component
    // when "Send to Chat" button is clicked, not automatically here
  }, [completeRationalThoughtsStep]);

  const handleCBTSchemaModesComplete = useCallback(async (data: SchemaModesData) => {
    completeSchemaModesStep(data);
    
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Thank you for identifying those schema modes! 🌟 Understanding which parts of yourself are most active can provide valuable insights into your emotional patterns.\n\nFor our final step, let's create a practical action plan. What specific steps can you take to apply these insights in your daily life?",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [completeSchemaModesStep]);

  const handleCBTActionComplete = useCallback(async (data: ActionPlanData) => {
    completeActionStep(data);
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Great work creating a practical action plan! ✅ As a final step, please reflect on how you feel now. When you're ready, click ‘Send to Chat’ to analyze your full session.",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [completeActionStep]);

  const handleCBTFinalEmotionsComplete = useCallback(async (data: EmotionData) => {
    completeFinalEmotionsStep(data);
    const aiMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "Wonderful reflection. 🎉 You’ve completed your CBT session. You can now send your session to chat for therapeutic analysis.",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    setMessages(prev => [...prev, aiMessage]);
  }, [completeFinalEmotionsStep]);

  return (
    <div className="h-screen bg-background flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button 
              onClick={() => router.push('/')}
              className="hover:text-foreground transition-colors"
            >
              {t('nav.chat')}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-semibold">{t('nav.session')}</span>
            {isCBTActive && cbtCurrentStep !== 'complete' && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-primary capitalize">
                  Step {getStepInfo(cbtCurrentStep).stepNumber} of {getStepInfo(cbtCurrentStep).totalSteps}: {cbtCurrentStep.replace('-', ' ')}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.backToChat')}</span>
                <span className="sm:hidden">{t('nav.back')}</span>
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold">
                    Interactive CBT Session
                    {isCBTActive && cbtCurrentStep !== 'complete' && (
                      <span className="ml-3 text-base text-primary font-normal">
                        (Step {getStepInfo(cbtCurrentStep).stepNumber} of {getStepInfo(cbtCurrentStep).totalSteps})
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    {isCBTActive && cbtCurrentStep !== 'complete' 
                      ? `Current: ${cbtCurrentStep.replace('-', ' ')} - Guided cognitive behavioral therapy experience`
                      : "Guided cognitive behavioral therapy experience"
                    }
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {isCBTActive && cbtCurrentStep !== 'complete' && (
        <div className="border-b bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                Step {getStepInfo(cbtCurrentStep).stepNumber} of {getStepInfo(cbtCurrentStep).totalSteps}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((getStepInfo(cbtCurrentStep).stepNumber / getStepInfo(cbtCurrentStep).totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${(getStepInfo(cbtCurrentStep).stepNumber / getStepInfo(cbtCurrentStep).totalSteps) * 100}%` 
                }}
              ></div>
            </div>
            {!isMobile && (
              <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                <span>Situation</span>
                <span>Emotions</span>
                <span>Thoughts</span>
                <span>Core Belief</span>
                <span>Challenge</span>
                <span>Rational</span>
                <span>Schema</span>
                <span>Actions</span>
                <span>Final Emotions</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                  <div className="space-y-4">
                    {/* Draft info */}
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">📝 Previous Session Found</h3>
                          {hasDraft && (
                            <span className="px-2 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                              {t('status.saved')}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('actions.deleteDraft')}
                          title={t('actions.deleteDraft')}
                          onClick={handleDeleteDraft}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm opacity-90">
                        You have an unfinished CBT session from {draftLastSaved ? new Date(draftLastSaved).toLocaleDateString() : 'recently'}.
                      </p>
                      <p className="text-sm opacity-75 mt-1">
                        {t('draft.choice')}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={handleResumeDraft}
                        className="justify-center gap-3 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 group px-6"
                      >
                        <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <Brain className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">{t('actions.resume')}</span>
                        <Sparkles className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </Button>
                      <Button
                        onClick={handleStartFresh}
                        variant="outline"
                        className="justify-center h-12 rounded-xl border-2 hover:bg-accent hover:text-accent-foreground px-6 font-semibold"
                      >
                        {t('actions.startNew')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleStartCBT}
                      className="justify-center gap-3 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 group px-8"
                    >
                      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Brain className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">{t('actions.begin')}</span>
                      <Sparkles className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div data-testid="cbt-welcome">
              <VirtualizedMessageList 
                messages={messages}
                isStreaming={isLoading}
                isMobile={isMobile}
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

      {/* Progress Information */}
      <div className="border-t bg-card/50 backdrop-blur-md">
        <div className={cn("max-w-4xl mx-auto py-4 text-center", isMobile ? "px-3" : "px-4 sm:px-6")}>
          <div className="text-sm text-muted-foreground">
            {isStreaming ? (
              <span>🔄 Analyzing your CBT session and preparing for chat...</span>
            ) : isCBTActive && cbtCurrentStep !== 'complete' && cbtCurrentStep !== 'final-emotions' ? (
              <span>💙 Complete the {cbtCurrentStep.replace('-', ' ')} exercise above to continue your CBT journey</span>
            ) : isCBTActive && cbtCurrentStep === 'final-emotions' ? (
              <span>💙 Reflect on your emotions, then click &quot;Send to Chat&quot; for AI analysis</span>
            ) : hasStarted ? (
              <span>💙 Your progress is automatically saved in each step - no additional input needed</span>
            ) : (
              <span>💙 Start your CBT session to begin therapeutic exploration</span>
            )}
          </div>
        </div>
      </div>
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
