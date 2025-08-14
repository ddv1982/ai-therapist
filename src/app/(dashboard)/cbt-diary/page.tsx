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
import type { MessageData } from '@/features/chat/messages/message';
import { useCBTChatFlow } from '@/features/therapy/cbt/hooks/use-cbt-chat-flow';
import { getStepInfo } from '@/features/therapy/cbt/utils/step-mapping';
import type { 
  SituationData, 
  EmotionData, 
  ThoughtData, 
  ActionPlanData 
} from '@/features/therapy/cbt/chat-components';
import type { CoreBeliefData } from '@/features/therapy/cbt/chat-components/core-belief';
import type { ChallengeQuestionsData } from '@/features/therapy/cbt/chat-components/challenge-questions';
import type { RationalThoughtsData } from '@/features/therapy/cbt/chat-components/rational-thoughts';
import type { SchemaModesData } from '@/features/therapy/cbt/chat-components/schema-modes';
import { REPORT_GENERATION_PROMPT } from '@/lib/therapy/therapy-prompts';
import { clearAllCBTDrafts } from '@/lib/utils/cbt-draft-utils';

// Using MessageData from the message system
type Message = MessageData;

export default function CBTDiaryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // CBT Chat Flow
  const {
    isActive: isCBTActive,
    currentStep: cbtCurrentStep,
    sessionData: cbtSessionData,
    cbtMessages,
    startCBTSession,
    completeSituationStep,
    completeEmotionStep,
    completeThoughtStep,
    completeCoreBeliefStep,
    completeChallengeQuestionsStep,
    completeRationalThoughtsStep,
    completeSchemaModesStep,
    completeActionStep,
    generateFinalSummary
  } = useCBTChatFlow();

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Start CBT session when user clicks start button
  const handleStartCBT = useCallback(() => {
    setHasStarted(true);
    startCBTSession();
  }, [startCBTSession]);

  // Handle CBT session completion and add welcome message
  useEffect(() => {
    if (isCBTActive && cbtCurrentStep === 'situation' && cbtMessages.length > 0) {
      // Add initial CBT welcome message
      const cbtWelcomeMessage: Message = {
        id: `cbt-welcome-${Date.now()}`,
        role: 'assistant',
        content: "Welcome to your CBT (Cognitive Behavioral Therapy) session! 🧠\n\nThis interactive experience will guide you through understanding your thoughts, feelings, and behaviors step by step. We'll work together to:\n\n• **Explore** the situation that's on your mind\n• **Identify** your emotions and their intensity  \n• **Examine** your automatic thoughts\n• **Challenge** unhelpful thinking patterns\n• **Develop** more balanced perspectives\n• **Create** an action plan for moving forward\n\nTake your time with each step - this is your safe space for reflection and growth.",
        timestamp: new Date(),
        modelUsed: 'therapeutic-assistant'
      };
      
      // Add CBT component message
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
      
      setMessages([cbtWelcomeMessage, cbtComponentMessage]);
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
      // Check if environment API key is available
      const envResponse = await fetch('/api/env');
      const envData = await envResponse.json();
      const hasEnvApiKey = envData.hasGroqApiKey;
      
      if (!hasEnvApiKey) {
        showToast({
          type: 'warning',
          title: 'API Key Required',
          message: 'Please set GROQ_API_KEY environment variable to send to chat'
        });
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      // Generate CBT summary without additional user thoughts
      const cbtSummary = generateFinalSummary();
      
      // Prepare session content for analysis
      const sessionContent = messages
        .filter(msg => !msg.metadata?.step) // Exclude CBT component messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      
      const fullSessionContent = [
        cbtSummary,
        sessionContent ? `\n\nSession Context:\n${sessionContent}` : ''
      ].filter(Boolean).join('\n');

      // Generate therapeutic analysis using AI with streaming
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

      let therapeuticAnalysis = '';
      
      // Handle streaming response
      if (analysisResponse.body) {
        const reader = analysisResponse.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'text-delta' && data.delta) {
                    therapeuticAnalysis += data.delta;
                  }
                } catch {
                  // Skip invalid JSON lines
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          throw new Error('Failed to process streaming analysis');
        }
      }

      if (!therapeuticAnalysis) {
        throw new Error('No analysis content received');
      }

      setIsStreaming(false);

      // Get or create session
      const sessionResponse = await fetch('/api/sessions/current');
      let sessionId = null;
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        const currentSessionData = sessionData.success ? sessionData.data : sessionData;
        if (currentSessionData?.currentSession) {
          sessionId = currentSessionData.currentSession.id;
        }
      }

      if (!sessionId) {
        const title = 'CBT Session Analysis - ' + new Date().toLocaleDateString();
        const createResponse = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });

        if (createResponse.ok) {
          const result = await createResponse.json();
          const newSession = result.success ? result.data : result;
          sessionId = newSession.id;
          
          await fetch('/api/sessions/current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
        } else {
          throw new Error('Failed to create session');
        }
      }

      // Save CBT summary to chat
      const summaryResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          role: 'user',
          content: cbtSummary
        }),
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to save CBT summary to chat');
      }

      // Save therapeutic analysis to chat
      const analysisMessageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          role: 'assistant',
          content: therapeuticAnalysis,
          modelUsed: 'openai/gpt-oss-120b'
        }),
      });

      if (!analysisMessageResponse.ok) {
        throw new Error('Failed to save therapeutic analysis to chat');
      }

      // Clear all CBT drafts since session is complete
      clearAllCBTDrafts();
      
      // Show success
      showToast({
        type: 'success',
        title: 'CBT Session Analyzed & Sent',
        message: 'Your CBT session and therapeutic analysis have been added to your chat!'
      });
      
      // Redirect to chat
      router.push('/');
      
    } catch (error) {
      console.error('Error sending CBT session:', error);
      showToast({
        type: 'error',
        title: 'Failed to Send',
        message: 'There was an error analyzing and sending your session. Please try again.'
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [hasStarted, isCBTActive, generateFinalSummary, messages, router, showToast]);

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
    
    // Generate final summary and add to chat
    const summary = generateFinalSummary();
    const summaryMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: summary,
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
  }, [completeActionStep, generateFinalSummary]);


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
                    Welcome to your CBT (Cognitive Behavioral Therapy) session! 🧠 This interactive experience will guide you through understanding your thoughts, feelings, and behaviors step by step.
                  </p>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    We&apos;ll work together to explore the situation that&apos;s on your mind, identify your emotions and their intensity, examine your automatic thoughts, challenge unhelpful thinking patterns, develop more balanced perspectives, and create an action plan for moving forward.
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
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleStartCBT}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg font-semibold"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Begin CBT Session
                  </Button>
                </div>
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