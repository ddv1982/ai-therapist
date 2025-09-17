import { useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { MessageData } from '@/features/chat/messages/message';
import { useCBTChatExperience } from './use-cbt-chat-experience';
import type {
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData,
  ActionPlanData,
} from '@/types/therapy';

export interface UseCbtDiaryFlowReturn {
  messages: MessageData[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isCBTActive: boolean;
  cbtCurrentStep: ReturnType<typeof useCBTChatExperience>['currentStep'];
  cbtSessionData: ReturnType<typeof useCBTChatExperience>['sessionData'];
  cbtFlowState: ReturnType<typeof useCBTChatExperience>['flowState'];
  completedSteps: ReturnType<typeof useCBTChatExperience>['flowState']['completedSteps'];
  goToStep: ReturnType<typeof useCBTChatExperience>['goToStep'];
  startCBTFlow: () => void;
  generateTherapeuticSummaryCard: ReturnType<typeof useCBTChatExperience>['generateTherapeuticSummaryCard'];
  handleCBTSituationComplete: (data: SituationData) => void;
  handleCBTEmotionComplete: (data: EmotionData) => void;
  handleCBTThoughtComplete: (data: ThoughtData[]) => void;
  handleCBTCoreBeliefComplete: (data: CoreBeliefData) => void;
  handleCBTChallengeQuestionsComplete: (data: ChallengeQuestionsData) => void;
  handleCBTRationalThoughtsComplete: (data: RationalThoughtsData) => void;
  handleCBTSchemaModesComplete: (data: SchemaModesData) => void;
  handleCBTActionComplete: (data: ActionPlanData) => void;
  handleCBTFinalEmotionsComplete: (data: EmotionData) => void;
}

function mapDescriptorToMessage(
  descriptor: ReturnType<typeof useCBTChatExperience>['cbtMessages'][number],
  sessionData: ReturnType<typeof useCBTChatExperience>['sessionData'],
  translate: ReturnType<typeof useTranslations<'cbt'>>,
): MessageData {
  if (descriptor.type === 'cbt-component') {
    return {
      id: `${sessionData.id || 'cbt'}:${descriptor.id}`,
      role: 'assistant',
      content: descriptor.stepId,
      timestamp: new Date(),
      metadata: {
        step: descriptor.stepId,
        stepNumber: descriptor.stepNumber,
        totalSteps: descriptor.totalSteps,
        sessionData,
      },
    };
  }

  const content = translate(descriptor.translationKey as unknown as Parameters<typeof translate>[0], {
    default: descriptor.defaultText,
  }) as string;

  return {
    id: `${sessionData.id || 'cbt'}:${descriptor.id}`,
    role: 'assistant',
    content,
    timestamp: new Date(),
    modelUsed: 'therapeutic-assistant',
    metadata: {
      step: descriptor.stepId,
      stepNumber: descriptor.stepNumber,
      totalSteps: descriptor.totalSteps,
      sessionData,
    },
  };
}

export function useCbtDiaryFlow(): UseCbtDiaryFlowReturn {
  const t = useTranslations('cbt');

  const {
    isActive: isCBTActive,
    currentStep: cbtCurrentStep,
    sessionData: cbtSessionData,
    flowState: cbtFlowState,
    cbtMessages,
    startCBTSession,
    generateTherapeuticSummaryCard,
    completeSituationStep,
    completeEmotionStep,
    completeThoughtStep,
    completeCoreBeliefStep,
    completeChallengeQuestionsStep,
    completeRationalThoughtsStep,
    completeSchemaModesStep,
    completeActionStep,
    completeFinalEmotionsStep,
    goToStep,
  } = useCBTChatExperience();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const messages = useMemo(
    () =>
      cbtMessages.map((descriptor) => mapDescriptorToMessage(descriptor, cbtSessionData, t)),
    [cbtMessages, cbtSessionData, t],
  );

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return {
    messages,
    messagesEndRef,
    isCBTActive,
    cbtCurrentStep,
    cbtSessionData,
    cbtFlowState,
    completedSteps: cbtFlowState.completedSteps,
    goToStep,
    startCBTFlow: startCBTSession,
    generateTherapeuticSummaryCard,
    handleCBTSituationComplete: completeSituationStep,
    handleCBTEmotionComplete: completeEmotionStep,
    handleCBTThoughtComplete: completeThoughtStep,
    handleCBTCoreBeliefComplete: completeCoreBeliefStep,
    handleCBTChallengeQuestionsComplete: completeChallengeQuestionsStep,
    handleCBTRationalThoughtsComplete: completeRationalThoughtsStep,
    handleCBTSchemaModesComplete: completeSchemaModesStep,
    handleCBTActionComplete: completeActionStep,
    handleCBTFinalEmotionsComplete: completeFinalEmotionsStep,
  };
}
