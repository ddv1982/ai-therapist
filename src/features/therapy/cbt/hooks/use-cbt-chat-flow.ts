'use client';

import { useState, useCallback } from 'react';
import { generateUUID } from '@/lib/utils/utils';
import { getStepInfo, CBT_STEPS } from '../utils/step-mapping';
import type { 
  SituationData, 
  EmotionData, 
  ThoughtData, 
  ActionPlanData 
} from '../chat-components';
import type { CoreBeliefData } from '../chat-components/core-belief';
import type { ChallengeQuestionsData } from '../chat-components/challenge-questions';
import type { RationalThoughtsData } from '../chat-components/rational-thoughts';
import type { SchemaModesData } from '../chat-components/schema-modes';

export type CBTStep = 
  | 'situation' 
  | 'emotions' 
  | 'thoughts' 
  | 'core-belief'
  | 'challenge-questions'
  | 'rational-thoughts'
  | 'schema-modes'
  | 'actions' 
  | 'complete';

export interface CBTSessionData {
  id: string;
  startTime: Date;
  currentStep: CBTStep;
  situationData?: SituationData;
  emotionData?: EmotionData;
  thoughtData?: ThoughtData[];
  coreBeliefData?: CoreBeliefData;
  challengeQuestionsData?: ChallengeQuestionsData;
  rationalThoughtsData?: RationalThoughtsData;
  schemaModesData?: SchemaModesData;
  actionData?: ActionPlanData;
  isComplete: boolean;
}

export interface CBTChatMessage {
  id: string;
  type: 'cbt-component' | 'cbt-summary' | 'ai-response';
  step: CBTStep;
  content?: string;
  componentData?: unknown;
  timestamp: Date;
  metadata?: {
    stepNumber: number;
    totalSteps: number;
  };
}

interface UseCBTChatFlowReturn {
  // State
  isActive: boolean;
  currentStep: CBTStep;
  sessionData: CBTSessionData;
  cbtMessages: CBTChatMessage[];
  
  // Actions
  startCBTSession: () => void;
  completeSituationStep: (data: SituationData) => void;
  completeEmotionStep: (data: EmotionData) => void;
  completeThoughtStep: (data: ThoughtData[]) => void;
  completeCoreBeliefStep: (data: CoreBeliefData) => void;
  completeChallengeQuestionsStep: (data: ChallengeQuestionsData) => void;
  completeRationalThoughtsStep: (data: RationalThoughtsData) => void;
  completeSchemaModesStep: (data: SchemaModesData) => void;
  completeActionStep: (data: ActionPlanData) => void;
  generateFinalSummary: () => string;
  resetSession: () => void;
}


const STEP_TITLES = {
  situation: 'What happened?',
  emotions: 'How are you feeling?',
  thoughts: 'What thoughts went through your mind?',
  'core-belief': 'What\'s the core belief?',
  'challenge-questions': 'Challenge the belief',
  'rational-thoughts': 'Rational alternatives',
  'schema-modes': 'Schema modes',
  actions: 'How do you feel now?'
};

const AI_RESPONSES = {
  situation: "Thank you for sharing that situation with me. Understanding the context is so important for CBT work. Now let's explore how this situation made you feel emotionally.",
  emotions: "I can see you're experiencing some significant emotions around this situation. These feelings are completely valid. Now let's examine what thoughts were running through your mind during this experience.",
  thoughts: "Those automatic thoughts can be really powerful and feel very real in the moment. Let's dig deeper into what core beliefs might be underlying these thoughts.",
  'core-belief': "I can see the core belief you've identified. This insight is really valuable - recognizing these deep patterns is the first step toward change. Now let's challenge this belief together.",
  'challenge-questions': "Excellent work examining your belief from different angles. Those challenge questions help us see beyond our automatic thinking patterns. Now let's develop some more balanced, rational thoughts.",
  'rational-thoughts': "These rational alternatives you've developed are really insightful. Having these balanced thoughts ready can be incredibly helpful when the old patterns try to resurface. Now let's explore which schema modes feel most active for you right now.",
  'schema-modes': "Thank you for identifying those schema modes. Understanding which parts of yourself are most active can provide valuable insights into your emotional patterns. Now let's see how you're feeling after this reflection and plan for the future.",
  actions: "Wonderful work! You've completed a comprehensive CBT exploration. This kind of structured reflection can be incredibly helpful for understanding patterns and developing new ways of responding to challenging situations."
};

export function useCBTChatFlow(): UseCBTChatFlowReturn {
  const [sessionData, setSessionData] = useState<CBTSessionData>({
    id: '',
    startTime: new Date(),
    currentStep: 'situation',
    isComplete: false
  });
  
  const [cbtMessages, setCbtMessages] = useState<CBTChatMessage[]>([]);
  const [isActive, setIsActive] = useState(false);

  const addCBTMessage = useCallback((message: Omit<CBTChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: CBTChatMessage = {
      ...message,
      id: generateUUID(),
      timestamp: new Date(),
      // Auto-add step metadata for CBT components
      metadata: message.type === 'cbt-component' 
        ? { ...getStepInfo(message.step), ...message.metadata }
        : message.metadata
    };
    setCbtMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const progressToNextStep = useCallback((currentStep: CBTStep) => {
    const currentIndex = CBT_STEPS.indexOf(currentStep);
    const nextStep = CBT_STEPS[currentIndex + 1] as CBTStep;
    
    // Add AI response for the completed step
    if (currentStep !== 'complete' && AI_RESPONSES[currentStep as keyof typeof AI_RESPONSES]) {
      addCBTMessage({
        type: 'ai-response',
        step: currentStep,
        content: AI_RESPONSES[currentStep as keyof typeof AI_RESPONSES]
      });
    }
    
    // Update session to next step
    setSessionData(prev => ({
      ...prev,
      currentStep: nextStep || 'complete',
      isComplete: nextStep === 'complete'
    }));

    return nextStep;
  }, [addCBTMessage]);

  const startCBTSession = useCallback(() => {
    const newSession: CBTSessionData = {
      id: `cbt-${Date.now()}`,
      startTime: new Date(),
      currentStep: 'situation',
      isComplete: false
    };
    
    setSessionData(newSession);
    setIsActive(true);
    setCbtMessages([]);
    
    // Add initial CBT component message
    addCBTMessage({
      type: 'cbt-component',
      step: 'situation',
      content: STEP_TITLES.situation
    });
  }, [addCBTMessage]);

  const completeSituationStep = useCallback((data: SituationData) => {
    setSessionData(prev => ({ ...prev, situationData: data }));
    
    const nextStep = progressToNextStep('situation');
    if (nextStep) {
      addCBTMessage({
        type: 'cbt-component',
        step: nextStep,
        content: nextStep !== 'complete' ? STEP_TITLES[nextStep as keyof typeof STEP_TITLES] : 'Complete'
      });
    }
  }, [progressToNextStep, addCBTMessage]);

  const completeEmotionStep = useCallback((data: EmotionData) => {
    setSessionData(prev => ({ ...prev, emotionData: data }));
    
    const nextStep = progressToNextStep('emotions');
    if (nextStep) {
      addCBTMessage({
        type: 'cbt-component',
        step: nextStep,
        content: nextStep !== 'complete' ? STEP_TITLES[nextStep as keyof typeof STEP_TITLES] : 'Complete'
      });
    }
  }, [progressToNextStep, addCBTMessage]);

  const completeThoughtStep = useCallback((data: ThoughtData[]) => {
    setSessionData(prev => ({ ...prev, thoughtData: data }));
    
    const nextStep = progressToNextStep('thoughts');
    if (nextStep) {
      addCBTMessage({
        type: 'cbt-component',
        step: nextStep,
        content: nextStep !== 'complete' ? STEP_TITLES[nextStep as keyof typeof STEP_TITLES] : 'Complete'
      });
    }
  }, [progressToNextStep, addCBTMessage]);

  const completeCoreBeliefStep = useCallback((data: CoreBeliefData) => {
    setSessionData(prev => ({ ...prev, coreBeliefData: data }));
    
    const nextStep = progressToNextStep('core-belief');
    if (nextStep) {
      addCBTMessage({
        type: 'cbt-component',
        step: nextStep,
        content: nextStep !== 'complete' ? STEP_TITLES[nextStep as keyof typeof STEP_TITLES] : 'Complete'
      });
    }
  }, [progressToNextStep, addCBTMessage]);

  const completeChallengeQuestionsStep = useCallback((data: ChallengeQuestionsData) => {
    setSessionData(prev => ({ ...prev, challengeQuestionsData: data }));
    
    const nextStep = progressToNextStep('challenge-questions');
    if (nextStep) {
      addCBTMessage({
        type: 'cbt-component',
        step: nextStep,
        content: nextStep !== 'complete' ? STEP_TITLES[nextStep as keyof typeof STEP_TITLES] : 'Complete'
      });
    }
  }, [progressToNextStep, addCBTMessage]);

  const completeRationalThoughtsStep = useCallback((data: RationalThoughtsData) => {
    setSessionData(prev => ({ ...prev, rationalThoughtsData: data }));
    
    const nextStep = progressToNextStep('rational-thoughts');
    if (nextStep) {
      addCBTMessage({
        type: 'cbt-component',
        step: nextStep,
        content: nextStep !== 'complete' ? STEP_TITLES[nextStep as keyof typeof STEP_TITLES] : 'Complete'
      });
    }
  }, [progressToNextStep, addCBTMessage]);

  const completeSchemaModesStep = useCallback((data: SchemaModesData) => {
    setSessionData(prev => ({ ...prev, schemaModesData: data }));
    
    const nextStep = progressToNextStep('schema-modes');
    if (nextStep) {
      addCBTMessage({
        type: 'cbt-component',
        step: nextStep,
        content: nextStep !== 'complete' ? STEP_TITLES[nextStep as keyof typeof STEP_TITLES] : 'Complete'
      });
    }
  }, [progressToNextStep, addCBTMessage]);

  const completeActionStep = useCallback((data: ActionPlanData) => {
    setSessionData(prev => ({ 
      ...prev, 
      actionData: data,
      isComplete: true,
      currentStep: 'complete'
    }));
    
    // Add final AI response
    addCBTMessage({
      type: 'ai-response',
      step: 'actions',
      content: AI_RESPONSES.actions
    });

    // Mark session as complete
    setIsActive(false);
  }, [addCBTMessage]);

  const generateFinalSummary = useCallback((): string => {
    const date = new Date(sessionData.startTime).toLocaleDateString();
    
    let summary = `## CBT Session Summary - ${date}\n\n`;
    
    // Situation
    if (sessionData.situationData) {
      summary += `**Situation:** ${sessionData.situationData.description}\n\n`;
    }
    
    // Emotions
    if (sessionData.emotionData) {
      const emotions = Object.entries(sessionData.emotionData)
        .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
        .map(([emotion, intensity]) => `${emotion}: ${intensity}/10`)
        .join(', ');
      
      if (emotions) {
        summary += `**Initial Emotions:** ${emotions}\n`;
      }
      
      if (sessionData.emotionData.other && sessionData.emotionData.otherIntensity) {
        summary += `**Custom Emotion:** ${sessionData.emotionData.other}: ${sessionData.emotionData.otherIntensity}/10\n`;
      }
      summary += '\n';
    }
    
    // Thoughts
    if (sessionData.thoughtData && sessionData.thoughtData.length > 0) {
      summary += `**Automatic Thoughts:**\n`;
      sessionData.thoughtData.forEach((thought, index) => {
        summary += `${index + 1}. "${thought.thought}" (Credibility: ${thought.credibility}/10)\n`;
      });
      summary += '\n';
    }
    
    // Core Belief
    if (sessionData.coreBeliefData) {
      summary += `**Core Belief:** "${sessionData.coreBeliefData.coreBeliefText}" (Credibility: ${sessionData.coreBeliefData.coreBeliefCredibility}/10)\n\n`;
    }
    
    // Rational Thoughts
    if (sessionData.rationalThoughtsData && sessionData.rationalThoughtsData.rationalThoughts.length > 0) {
      summary += `**Rational Alternative Thoughts:**\n`;
      sessionData.rationalThoughtsData.rationalThoughts.forEach((thought, index) => {
        summary += `${index + 1}. "${thought.thought}" (Confidence: ${thought.confidence}/10)\n`;
      });
      summary += '\n';
    }
    
    // Schema Modes
    if (sessionData.schemaModesData && sessionData.schemaModesData.selectedModes.length > 0) {
      summary += `**Active Schema Modes:**\n`;
      sessionData.schemaModesData.selectedModes
        .filter(mode => mode.selected)
        .forEach((mode, index) => {
          summary += `${index + 1}. ${mode.name}${mode.intensity ? ` (Intensity: ${mode.intensity}/10)` : ''}\n`;
        });
      summary += '\n';
    }
    
    // Final emotions/action plan
    if (sessionData.actionData) {
      if (sessionData.actionData.finalEmotions) {
        const finalEmotions = Object.entries(sessionData.actionData.finalEmotions)
          .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
          .map(([emotion, intensity]) => `${emotion}: ${intensity}/10`)
          .join(', ');
        
        if (finalEmotions) {
          summary += `**Final Emotions:** ${finalEmotions}\n\n`;
        }
      }
      
      if (sessionData.actionData.newBehaviors) {
        summary += `**New Behaviors/Strategies:** ${sessionData.actionData.newBehaviors}\n\n`;
      }
      
      if (sessionData.actionData.alternativeResponses && sessionData.actionData.alternativeResponses.length > 0) {
        summary += `**Alternative Responses:**\n`;
        sessionData.actionData.alternativeResponses.forEach((response, index) => {
          summary += `${index + 1}. ${response.response}\n`;
        });
        summary += '\n';
      }
    }
    
    summary += `*This CBT session was completed on ${date} and included comprehensive work on situation analysis, emotion tracking, thought examination, core belief exploration, rational thought development, and action planning.*`;
    
    return summary;
  }, [sessionData]);

  const resetSession = useCallback(() => {
    setSessionData({
      id: '',
      startTime: new Date(),
      currentStep: 'situation',
      isComplete: false
    });
    setCbtMessages([]);
    setIsActive(false);
  }, []);

  return {
    // State
    isActive,
    currentStep: sessionData.currentStep,
    sessionData,
    cbtMessages,
    
    // Actions
    startCBTSession,
    completeSituationStep,
    completeEmotionStep,
    completeThoughtStep,
    completeCoreBeliefStep,
    completeChallengeQuestionsStep,
    completeRationalThoughtsStep,
    completeSchemaModesStep,
    completeActionStep,
    generateFinalSummary,
    resetSession
  };
}