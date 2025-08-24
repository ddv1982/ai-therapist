'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  ChevronRight,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { generateUUID, cn } from '@/lib/utils/utils';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { logger } from '@/lib/utils/logger';
import type { MessageData } from '@/features/chat/messages/message';
import { useCBTChatExperience } from '@/features/therapy/cbt/hooks/use-cbt-chat-experience';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import { clearCBTDraft } from '@/features/therapy/cbt/hooks/use-cbt-draft-persistence';
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
import { REPORT_GENERATION_PROMPT } from '@/lib/therapy/therapy-prompts';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { startCBTSession as startReduxCBTSession } from '@/store/slices/cbtSlice';
import { useChatMessages } from '@/hooks/use-chat-messages';
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
  
  // Get session ID from Redux
  const reduxSessionId = useAppSelector(state => state.cbt.sessionData.sessionId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use CBT data manager hook for draft management (transition phase)
  const { status: dataManagerStatus, draftActions } = useCBTDataManager();

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
    generateTherapeuticSummaryCard
  } = useCBTChatExperience();

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing draft using CBT data manager status
  const hasDraft = dataManagerStatus.isDraftSaved;
  const draftLastSaved: string | undefined = dataManagerStatus.lastAutoSave || undefined;

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
    clearCBTDraft();
    
    showToast({
      type: 'info',
      title: 'New Session Started',
      message: 'Previous draft cleared, starting fresh'
    });
  }, [draftActions, showToast]);

  // Start CBT session when user clicks start button
  const handleStartCBT = useCallback(async () => {
    setHasStarted(true);
    
    // Get or create a session and initialize Redux
    try {
      let sessionId = reduxSessionId;
      
      if (!sessionId) {
        // Try to get current session first
        const sessionData = await apiClient.getCurrentSession();
        const currentSessionData = (sessionData && sessionData.success) ? sessionData.data : sessionData;
        if (currentSessionData?.currentSession) {
          sessionId = currentSessionData.currentSession.id;
        }
        
        // If still no session, create one
        if (!sessionId) {
          const title = 'CBT Session - ' + new Date().toLocaleDateString();
          const createResp = await apiClient.createSession({ title });
          if (createResp && createResp.success && createResp.data) {
            const newSession = createResp.data as components['schemas']['Session'];
            sessionId = newSession.id;
            // Set as current session
            await apiClient.setCurrentSession(newSession.id);
          }
        }
        
        // Initialize Redux with the session ID
        if (sessionId) {
          dispatch(startReduxCBTSession({ sessionId }));
        }
      }
    } catch (error) {
      logger.error('Failed to initialize CBT session', {
        component: 'CBTDiaryPage',
        operation: 'handleStartCBT',
        reduxSessionId
      }, error instanceof Error ? error : new Error(String(error)));
    }
    
    // Start the CBT flow
    startCBTFlow();
  }, [reduxSessionId, dispatch, startCBTFlow]);

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

    setIsLoading(true);
    setIsStreaming(true);
    
    try {
      // Environment API key is automatically handled by the server
      
      // Generate comprehensive CBT summary using structured card format
      const summaryData = generateTherapeuticSummaryCard();
      const cbtSummary = `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
      
      // Prepare session content for analysis
      const sessionContent = messages
        .filter(msg => !msg.metadata?.step) // Exclude CBT component messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      
      const fullSessionContent = [
        cbtSummary,
        sessionContent ? `\n\nSession Context:\n${sessionContent}` : ''
      ].filter(Boolean).join('\n');

      // Ensure a session ID exists (fetch or create if Redux is empty)
      let sessionId = reduxSessionId;
      if (!sessionId) {
        try {
          // Try to get current session first
          const sessionData = await apiClient.getCurrentSession();
          const currentSessionData = (sessionData && (sessionData as { success?: boolean }).success)
            ? (sessionData as { data: { currentSession?: { id: string } } }).data
            : (sessionData as { currentSession?: { id: string } } | null) || {};
          if (currentSessionData?.currentSession) {
            sessionId = currentSessionData.currentSession.id;
          }
          // If still no session, create one
          if (!sessionId) {
            const title = 'CBT Session - ' + new Date().toLocaleDateString();
            const createResp = await apiClient.createSession({ title });
            if (createResp && createResp.success && createResp.data) {
              const newSession = createResp.data as components['schemas']['Session'];
              sessionId = newSession.id;
              await apiClient.setCurrentSession(newSession.id);
            }
          }
          // Initialize Redux with the session ID if found/created
          if (sessionId) {
            dispatch(startReduxCBTSession({ sessionId }));
          }
        } catch {}
      }
      if (!sessionId) {
        throw new Error('No session available - please start a CBT session first');
      }

      // Try using the report generation API first as it's more stable
      let therapeuticAnalysis = '';
      let useStreamingFallback = false;
      
      try {
        // First attempt: Use report generation API
        const reportResponse = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId, // Use the actual session ID
            messages: [
              { role: 'user', content: cbtSummary, timestamp: new Date().toISOString() },
              ...messages.filter(msg => !msg.metadata?.step).map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp.toISOString()
              }))
            ]
          }),
        });

        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          if (reportData.success && reportData.reportContent) {
            therapeuticAnalysis = reportData.reportContent;
            logger.info('Using report generation API for CBT analysis', {
              component: 'CBTDiaryPage',
              operation: 'handleSendToChat',
              sessionId
            });
          } else {
            useStreamingFallback = true;
          }
        } else {
          useStreamingFallback = true;
        }
      } catch (reportError) {
        logger.warn('Report generation API failed, falling back to streaming', {
          component: 'CBTDiaryPage',
          operation: 'handleSendToChat',
          sessionId,
          error: reportError instanceof Error ? reportError.message : String(reportError)
        });
        useStreamingFallback = true;
      }

      // Fallback: Use streaming chat API if report generation failed
      if (useStreamingFallback) {
        logger.info('Using streaming chat API as fallback for CBT analysis', {
          component: 'CBTDiaryPage',
          operation: 'handleSendToChat',
          sessionId
        });
        
        const analysisResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: REPORT_GENERATION_PROMPT },
              { role: 'user', content: fullSessionContent }
            ],
            selectedModel: 'openai/gpt-oss-120b' // Use analytical model for comprehensive analysis
          }),
        });

        if (!analysisResponse.ok) {
          throw new Error('Failed to generate therapeutic analysis');
        }

        // Handle streaming response with improved error handling
        if (analysisResponse.body) {
          const reader = analysisResponse.body.getReader();
          const decoder = new TextDecoder();
          
          try {
            let buffer = '';
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Decode chunk and add to buffer
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // Process complete lines
              const lines = buffer.split('\n');
              // Keep the last incomplete line in buffer
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try {
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr) {
                      const data = JSON.parse(jsonStr);
                      if (data.type === 'text-delta' && data.delta) {
                        therapeuticAnalysis += data.delta;
                      }
                    }
                  } catch (parseError) {
                    logger.warn('Failed to parse streaming data line during CBT analysis', {
                      component: 'CBTDiaryPage',
                      operation: 'handleSendToChat',
                      line: line.substring(0, 100) + '...',
                      sessionId,
                      error: parseError instanceof Error ? parseError.message : String(parseError)
                    });
                    // Continue processing other lines
                  }
                }
              }
            }
          
            // Process any remaining buffer content
            if (buffer.trim()) {
              const line = buffer.trim();
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    if (data.type === 'text-delta' && data.delta) {
                      therapeuticAnalysis += data.delta;
                    }
                  }
                } catch (parseError) {
                  logger.warn('Failed to parse final buffer data during CBT analysis', {
                    component: 'CBTDiaryPage',
                    operation: 'handleSendToChat',
                    line: line.substring(0, 100) + '...',
                    sessionId,
                    error: parseError instanceof Error ? parseError.message : String(parseError)
                  });
                }
              }
            }
          
          } catch (streamError) {
            logger.error('Streaming error during CBT analysis', {
              component: 'CBTDiaryPage',
              operation: 'handleSendToChat',
              sessionId,
              hasPartialContent: !!therapeuticAnalysis.trim()
            }, streamError instanceof Error ? streamError : new Error(String(streamError)));
            
            // If we have some content, use it instead of failing completely
            if (therapeuticAnalysis.trim()) {
              logger.warn('Stream interrupted but partial content available, continuing analysis', {
                component: 'CBTDiaryPage',
                operation: 'handleSendToChat',
                sessionId,
                contentLength: therapeuticAnalysis.length
              });
            } else {
              throw new Error('Failed to process streaming analysis: ' + (streamError instanceof Error ? streamError.message : 'Unknown error'));
            }
          } finally {
            // Ensure reader is properly released
            try {
              reader.releaseLock();
            } catch {
              // Ignore lock release errors
            }
          }
        }
      }

      if (!therapeuticAnalysis) {
        throw new Error('No analysis content received');
      }

      setIsStreaming(false);

      // Save CBT summary to chat
      const summaryResponse: PostMessageResponse = await apiClient.postMessage(sessionId, { role: 'user', content: cbtSummary });
      getApiData(summaryResponse);

      // Save therapeutic analysis to chat
      const analysisMessageResponse: PostMessageResponse = await apiClient.postMessage(sessionId, { role: 'assistant', content: therapeuticAnalysis, modelUsed: 'openai/gpt-oss-120b' });
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
      
      // Redirect to chat
      router.push('/');
      
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
  }, [hasStarted, isCBTActive, generateTherapeuticSummaryCard, messages, router, showToast, draftActions, reduxSessionId, dispatch]);

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
    
    // Generate therapeutic summary card data
    const summaryData = generateTherapeuticSummaryCard();
    
    // Create special markdown format that will be processed into a CBT summary card
    const cbtSummaryMarkdown = `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->

## CBT Session Summary - ${summaryData.date}

Your completed CBT session data has been processed and formatted for optimal review.

<!-- END_CBT_SUMMARY_CARD -->`;

    const summaryMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: cbtSummaryMarkdown,
      timestamp: new Date()
    };
    
    const completionMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: "🌟 **Congratulations!** You've completed a full CBT session! 🎉\n\nThis kind of structured reflection is incredibly valuable for understanding patterns and developing new ways of responding to challenging situations.\n\nI've generated a complete summary of your CBT session above. You can:\n• **Review** your insights anytime\n• **Practice** your new rational thoughts\n• **Follow** your action plan\n• **Return** to these techniques whenever you need them\n\nYou should feel proud of the thoughtful work you've done today. Remember, building these skills takes practice, so be patient and kind with yourself! 💙",
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    };
    
    setMessages(prev => [...prev, summaryMessage, completionMessage]);
  }, [completeActionStep, generateTherapeuticSummaryCard]);


  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/20 flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button 
              onClick={() => router.push('/')}
              className="hover:text-foreground transition-colors"
            >
              Chat
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">CBT Session</span>
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
                <span className="hidden sm:inline">Back to Chat</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold">
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
              <span className="text-sm font-medium text-foreground">
                Step {getStepInfo(cbtCurrentStep).stepNumber} of {getStepInfo(cbtCurrentStep).totalSteps}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round((getStepInfo(cbtCurrentStep).stepNumber / getStepInfo(cbtCurrentStep).totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${(getStepInfo(cbtCurrentStep).stepNumber / getStepInfo(cbtCurrentStep).totalSteps) * 100}%` 
                }}
              ></div>
            </div>
            {!isMobile && (
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Situation</span>
                <span>Emotions</span>
                <span>Thoughts</span>
                <span>Core Belief</span>
                <span>Challenge</span>
                <span>Rational</span>
                <span>Schema</span>
                <span>Actions</span>
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
                  <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Brain className="w-8 h-8 sm:w-12 sm:h-12 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-xl sm:text-2xl mb-4 gradient-text">
                    Welcome to CBT Session
                  </h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    A guided journey to understand your thoughts, feelings, and behaviors through proven CBT techniques.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-left">
                    <h3 className="text-lg text-primary mb-2">🧠 Evidence-Based</h3>
                    <p className="text-sm text-muted-foreground">Using proven CBT techniques for lasting change</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-left">
                    <h3 className="text-lg text-accent mb-2">💡 Interactive</h3>
                    <p className="text-sm text-muted-foreground">Step-by-step guidance through your reflection</p>
                  </div>
                </div>
                
                {/* Draft detection and action buttons */}
                {hasDraft ? (
                  <div className="space-y-4">
                    {/* Draft info */}
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">📝 Previous Session Found</h3>
                        {dataManagerStatus.isDraftSaved && (
                          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            Saved
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-90">
                        You have an unfinished CBT session from {draftLastSaved ? new Date(draftLastSaved).toLocaleDateString() : 'recently'}.
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        Choose to continue where you left off or start fresh.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={handleResumeDraft}
                        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-semibold"
                      >
                        <Brain className="w-5 h-5 mr-2" />
                        Resume Previous Session
                      </Button>
                      <Button
                        onClick={handleStartFresh}
                        variant="outline"
                        className="border-2 hover:bg-accent hover:text-accent-foreground px-6 py-3 text-base font-semibold"
                      >
                        Start New Session
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleStartCBT}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg font-semibold"
                    >
                      <Brain className="w-5 h-5 mr-2" />
                      Begin CBT Session
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
          <div className="text-xs text-muted-foreground">
            {isStreaming ? (
              <span>🔄 Analyzing your CBT session and preparing for chat...</span>
            ) : isCBTActive && cbtCurrentStep !== 'complete' && cbtCurrentStep !== 'actions' ? (
              <span>💙 Complete the {cbtCurrentStep.replace('-', ' ')} exercise above to continue your CBT journey</span>
            ) : isCBTActive && cbtCurrentStep === 'actions' ? (
              <span>💙 Complete your action plan above, then click &quot;Send to Chat&quot; for AI analysis</span>
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
      const title = 'CBT Session - ' + new Date().toLocaleDateString();
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
  }, []);

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