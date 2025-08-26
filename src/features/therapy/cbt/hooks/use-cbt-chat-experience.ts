'use client';

import { useState, useCallback } from 'react';
import { generateUUID } from '@/lib/utils/utils';
import { getStepInfo, CBT_STEPS } from '../utils/step-mapping';
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

export type CBTStep = 
  | 'situation' 
  | 'emotions' 
  | 'thoughts' 
  | 'core-belief'
  | 'challenge-questions'
  | 'rational-thoughts'
  | 'schema-modes'
  | 'final-emotions'
  | 'actions' 
  | 'complete';

// Use CBTChatFlowSessionData from unified types - this one extends it for chat flow
export interface CBTChatFlowSessionData {
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

interface UseCBTChatExperienceReturn {
  // State
  isActive: boolean;
  currentStep: CBTStep;
  sessionData: CBTChatFlowSessionData;
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
  completeFinalEmotionsStep: (data: EmotionData) => void;
  generateFinalSummary: () => string;
  generateTherapeuticSummaryCard: () => import('@/components/ui/cbt-session-summary-card').CBTSessionSummaryData;
  resetSession: () => void;
}


const STEP_TITLES = {
  situation: 'What happened?',
  emotions: 'How are you feeling?',
  'final-emotions': 'How do you feel now?',
  thoughts: 'What thoughts went through your mind?',
  'core-belief': 'What\'s the core belief?',
  'challenge-questions': 'Challenge the belief',
  'rational-thoughts': 'Rational alternatives',
  'schema-modes': 'Schema modes',
  actions: 'Future Action Plan'
};

const AI_RESPONSES = {
  situation: "Thank you for sharing that situation with me. Understanding the context is so important for CBT work. Now let's explore how this situation made you feel emotionally.",
  emotions: "I can see you're experiencing some significant emotions around this situation. These feelings are completely valid. Now let's examine what thoughts were running through your mind during this experience.",
  thoughts: "Those automatic thoughts can be really powerful and feel very real in the moment. Let's dig deeper into what core beliefs might be underlying these thoughts.",
  'core-belief': "I can see the core belief you've identified. This insight is really valuable - recognizing these deep patterns is the first step toward change. Now let's challenge this belief together.",
  'challenge-questions': "Excellent work examining your belief from different angles. Those challenge questions help us see beyond our automatic thinking patterns. Now let's develop some more balanced, rational thoughts.",
  'rational-thoughts': "These rational alternatives you've developed are really insightful. Having these balanced thoughts ready can be incredibly helpful when the old patterns try to resurface. Now let's explore which schema modes feel most active for you right now.",
  'schema-modes': "Thank you for identifying those schema modes. Understanding which parts of yourself are most active can provide valuable insights into your emotional patterns. Next, let's outline a concrete action plan for future situations.",
  actions: "Great plan. Now, as a final step, please reflect on how you feel after this whole process. When you're ready, you can send your session to chat for analysis.",
  'final-emotions': "Wonderful work! You've completed a comprehensive CBT exploration. This kind of structured reflection can be incredibly helpful for understanding patterns and developing new ways of responding to challenging situations."
};

export function useCBTChatExperience(): UseCBTChatExperienceReturn {
  const [sessionData, setSessionData] = useState<CBTChatFlowSessionData>({
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
      isComplete: !nextStep ? true : nextStep === 'complete'
    }));

    return nextStep;
  }, [addCBTMessage]);

  const startCBTSession = useCallback(() => {
    const newSession: CBTChatFlowSessionData = {
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
    // Save action plan and progress to final emotions
    setSessionData(prev => ({ 
      ...prev, 
      actionData: data
    }));

    const nextStep = progressToNextStep('actions');
    if (nextStep) {
      addCBTMessage({
        type: 'cbt-component',
        step: nextStep,
        content: STEP_TITLES[nextStep as keyof typeof STEP_TITLES]
      });
    }
  }, [addCBTMessage, progressToNextStep]);

  const completeFinalEmotionsStep = useCallback((data: EmotionData) => {
    // Persist final emotions into action data and mark complete
    setSessionData(prev => ({
      ...prev,
      actionData: {
        finalEmotions: data,
        originalThoughtCredibility: prev.actionData?.originalThoughtCredibility ?? 5,
        newBehaviors: prev.actionData?.newBehaviors ?? ''
      },
      currentStep: 'complete',
      isComplete: true
    }));

    // Add final AI response for completion
    addCBTMessage({
      type: 'ai-response',
      step: 'final-emotions',
      content: AI_RESPONSES['final-emotions']
    });

    setIsActive(false);
  }, [addCBTMessage]);

  const generateFinalSummary = useCallback((): string => {
    const date = new Date(sessionData.startTime).toLocaleDateString();
    
    let summary = `## CBT Session Summary - ${date}\n\n`;
    
    // Situation
    if (sessionData.situationData) {
      summary += `**Situation:** ${sessionData.situationData.situation}\n\n`;
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
      
      // alternativeResponses removed from current UX
    }
    
    summary += `*This CBT session was completed on ${date} and included comprehensive work on situation analysis, emotion tracking, thought examination, core belief exploration, rational thought development, and action planning.*`;
    
    return summary;
  }, [sessionData]);

  const generateTherapeuticSummaryCard = useCallback(() => {
    const date = new Date(sessionData.startTime).toLocaleDateString();
    
    // Extract completed steps
    const completedSteps: string[] = [];
    if (sessionData.situationData) completedSteps.push('Situation Analysis');
    if (sessionData.emotionData) completedSteps.push('Emotion Assessment');
    if (sessionData.thoughtData && sessionData.thoughtData.length > 0) completedSteps.push('Automatic Thoughts');
    if (sessionData.coreBeliefData) completedSteps.push('Core Belief Exploration');
    if (sessionData.rationalThoughtsData && sessionData.rationalThoughtsData.rationalThoughts.length > 0) completedSteps.push('Rational Response Development');
    if (sessionData.schemaModesData && sessionData.schemaModesData.selectedModes.length > 0) completedSteps.push('Schema Mode Analysis');
    if (sessionData.actionData) completedSteps.push('Action Plan Development');

    // Format initial emotions
    const initialEmotions = sessionData.emotionData ? 
      Object.entries(sessionData.emotionData)
        .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
        .map(([emotion, rating]) => ({ emotion, rating: rating as number })) : [];

    // Add custom emotion if exists
    if (sessionData.emotionData?.other && sessionData.emotionData?.otherIntensity) {
      initialEmotions.push({ 
        emotion: sessionData.emotionData.other, 
        rating: sessionData.emotionData.otherIntensity 
      });
    }

    // Format automatic thoughts
    const automaticThoughts = sessionData.thoughtData ? 
      sessionData.thoughtData.map(thought => ({
        thought: thought.thought,
        credibility: thought.credibility
      })) : [];

    // Format core belief
    const coreBelief = sessionData.coreBeliefData ? {
      belief: sessionData.coreBeliefData.coreBeliefText,
      credibility: sessionData.coreBeliefData.coreBeliefCredibility
    } : undefined;

    // Format rational thoughts
    const rationalThoughts = sessionData.rationalThoughtsData ? 
      sessionData.rationalThoughtsData.rationalThoughts.map(thought => ({
        thought: thought.thought,
        confidence: thought.confidence
      })) : [];

    // Format schema modes
    const schemaModes = sessionData.schemaModesData ? 
      sessionData.schemaModesData.selectedModes
        .filter(mode => mode.selected)
        .map(mode => ({
          name: mode.name,
          intensity: mode.intensity
        })) : [];

    // Format final emotions from action plan
    const finalEmotions = sessionData.actionData?.finalEmotions ? 
      Object.entries(sessionData.actionData.finalEmotions)
        .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
        .map(([emotion, rating]) => ({ emotion, rating: rating as number })) : [];

    // Format action plan data
    const newBehaviors = sessionData.actionData?.newBehaviors ? [sessionData.actionData.newBehaviors] : [];
    // alternativeResponses removed from current UX

    return {
      date,
      situation: sessionData.situationData?.situation,
      initialEmotions,
      automaticThoughts,
      coreBelief,
      rationalThoughts,
      schemaModes,
      finalEmotions,
      newBehaviors,
      
      completedSteps
    };
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
    completeFinalEmotionsStep,
    generateFinalSummary,
    generateTherapeuticSummaryCard,
    resetSession
  };
}

// Backward compatibility export
export const useCBTChatFlow = useCBTChatExperience;