import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { generateUUID } from '@/lib/utils/utils';
import { useCBTChatExperience } from './use-cbt-chat-experience';
import { getStepInfo } from '@/features/therapy/cbt/utils/step-mapping';
import type { CBTStep } from './use-cbt-chat-experience';
import type { MessageData } from '@/features/chat/messages/message';
import type { 
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData,
  ActionPlanData
} from '@/types/therapy';

export interface UseCbtDiaryFlowReturn {
  // State for rendering
  messages: MessageData[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;

  // Step/session state for UI
  isCBTActive: boolean;
  cbtCurrentStep: CBTStep;
  cbtSessionData: ReturnType<typeof useCBTChatExperience>['sessionData'];

  // Actions
  startCBTFlow: () => void;
  generateTherapeuticSummaryCard: ReturnType<typeof useCBTChatExperience>['generateTherapeuticSummaryCard'];

  // Completion handlers wired for VirtualizedMessageList
  handleCBTSituationComplete: (data: SituationData) => Promise<void> | void;
  handleCBTEmotionComplete: (data: EmotionData) => Promise<void> | void;
  handleCBTThoughtComplete: (data: ThoughtData[]) => Promise<void> | void;
  handleCBTCoreBeliefComplete: (data: CoreBeliefData) => Promise<void> | void;
  handleCBTChallengeQuestionsComplete: (data: ChallengeQuestionsData) => Promise<void> | void;
  handleCBTRationalThoughtsComplete: (data: RationalThoughtsData) => Promise<void> | void;
  handleCBTSchemaModesComplete: (data: SchemaModesData) => Promise<void> | void;
  handleCBTActionComplete: (data: ActionPlanData) => Promise<void> | void;
  handleCBTFinalEmotionsComplete: (data: EmotionData) => Promise<void> | void;
}

export function useCbtDiaryFlow(): UseCbtDiaryFlowReturn {
  const t = useTranslations('cbt');

  // Chat flow engine
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

  // Local UI message stream
  const [messages, setMessages] = useState<MessageData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastInsertedStepRef = useRef<string | null>(null);

  // Initial step insert when session starts
  useEffect(() => {
    if (!isCBTActive) return;
    if (cbtCurrentStep !== 'situation') return;
    // Mirror the first CBT component once
    if (cbtMessages.length === 0) return;

    const { stepNumber, totalSteps } = getStepInfo('situation');
    const msg: MessageData = {
      id: `cbt-component-situation-${Date.now()}`,
      role: 'assistant',
      content: 'situation',
      timestamp: new Date(),
      metadata: { step: 'situation', stepNumber, totalSteps, sessionData: cbtSessionData }
    } as MessageData;

    if (!messages.some(m => m.metadata?.step === 'situation')) {
      setMessages([msg]);
      lastInsertedStepRef.current = 'situation';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCBTActive, cbtCurrentStep, cbtMessages.length]);

  const appendStepComponent = useCallback((step: CBTStep) => {
    const { stepNumber, totalSteps } = getStepInfo(step);
    const nextComponent: MessageData = {
      id: `cbt-component-${step}-${Date.now()}`,
      role: 'assistant',
      content: step,
      timestamp: new Date(),
      metadata: { step, stepNumber, totalSteps, sessionData: cbtSessionData }
    } as MessageData;

    // Synchronously append for deterministic test behavior and simpler UI updates
    setMessages(prev => {
      const alreadyPresent = prev.some(m => m.metadata?.step === step);
      if (alreadyPresent) return prev;
      lastInsertedStepRef.current = step;
      return [...prev, nextComponent];
    });
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  }, [cbtSessionData]);

  // Ensure current step component exists (works for resume/drafts)
  useEffect(() => {
    if (!isCBTActive) return;
    if (!cbtCurrentStep || cbtCurrentStep === 'complete') return;

    const present = messages.some(m => m.metadata?.step === cbtCurrentStep);
    if (!present) appendStepComponent(cbtCurrentStep);
  }, [isCBTActive, cbtCurrentStep, messages, appendStepComponent]);

  // Step completion handlers (AI message + insert next)
  const handleCBTSituationComplete = useCallback((data: SituationData) => {
    completeSituationStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.situationNext', { default: "Thank you for sharing that situation with me. Understanding the context is so important for CBT work.\n\nNow let's explore how this situation made you feel emotionally." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
    appendStepComponent('emotions');
  }, [completeSituationStep, appendStepComponent, t]);

  const handleCBTEmotionComplete = useCallback((data: EmotionData) => {
    completeEmotionStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.emotionsNext', { default: "These feelings are valid. Now let's examine what thoughts were running through your mind." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
    appendStepComponent('thoughts');
  }, [completeEmotionStep, appendStepComponent, t]);

  const handleCBTThoughtComplete = useCallback((data: ThoughtData[]) => {
    completeThoughtStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.thoughtsNext', { default: "Great work exploring your thoughts. Let's consider the core beliefs underneath." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
    appendStepComponent('core-belief');
  }, [completeThoughtStep, appendStepComponent, t]);

  const handleCBTCoreBeliefComplete = useCallback((data: CoreBeliefData) => {
    completeCoreBeliefStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.coreBeliefNext', { default: "Excellent insight. Now let's challenge this belief together." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
    appendStepComponent('challenge-questions');
  }, [completeCoreBeliefStep, appendStepComponent, t]);

  const handleCBTChallengeQuestionsComplete = useCallback((data: ChallengeQuestionsData) => {
    completeChallengeQuestionsStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.challengeNext', { default: "Great work challenging those thoughts. Let's develop some rational alternatives." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
    appendStepComponent('rational-thoughts');
  }, [completeChallengeQuestionsStep, appendStepComponent, t]);

  const handleCBTRationalThoughtsComplete = useCallback((data: RationalThoughtsData) => {
    completeRationalThoughtsStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.rationalNext', { default: "Beautiful work developing balanced thoughts. Let's explore schema modes next." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
    appendStepComponent('schema-modes');
  }, [completeRationalThoughtsStep, appendStepComponent, t]);

  const handleCBTSchemaModesComplete = useCallback((data: SchemaModesData) => {
    completeSchemaModesStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.schemaNext', { default: "Thanks for identifying schema modes. Let's create an action plan." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
    appendStepComponent('actions');
  }, [completeSchemaModesStep, appendStepComponent, t]);

  const handleCBTActionComplete = useCallback((data: ActionPlanData) => {
    completeActionStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.actionsNext', { default: "Great plan. As a final step, please reflect on how you feel now." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
    appendStepComponent('final-emotions');
  }, [completeActionStep, appendStepComponent, t]);

  const handleCBTFinalEmotionsComplete = useCallback((data: EmotionData) => {
    completeFinalEmotionsStep(data);
    const aiMessage: MessageData = {
      id: generateUUID(),
      role: 'assistant',
      content: t('ai.finalNext', { default: "Wonderful reflection. You've completed your CBT session." }) as string,
      timestamp: new Date(),
      modelUsed: 'therapeutic-assistant'
    } as unknown as MessageData;
    setMessages(prev => [...prev, aiMessage]);
  }, [completeFinalEmotionsStep, t]);

  return {
    messages,
    messagesEndRef,
    isCBTActive,
    cbtCurrentStep,
    cbtSessionData,
    startCBTFlow,
    generateTherapeuticSummaryCard,
    handleCBTSituationComplete,
    handleCBTEmotionComplete,
    handleCBTThoughtComplete,
    handleCBTCoreBeliefComplete,
    handleCBTChallengeQuestionsComplete,
    handleCBTRationalThoughtsComplete,
    handleCBTSchemaModesComplete,
    handleCBTActionComplete,
    handleCBTFinalEmotionsComplete,
  };
}
