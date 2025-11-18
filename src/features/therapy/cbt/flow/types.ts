import type {
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData,
  ActionPlanData,
  CBTStepType,
} from '@/types';

export type CBTStepId = Exclude<CBTStepType, 'complete'>;

export const CBT_STEP_ORDER: readonly CBTStepId[] = [
  'situation',
  'emotions',
  'thoughts',
  'core-belief',
  'challenge-questions',
  'rational-thoughts',
  'schema-modes',
  'actions',
  'final-emotions',
] as const;

export type CBTFlowStatus = 'idle' | 'active' | 'complete';

export interface CBTFlowContext {
  situation?: SituationData;
  emotions?: EmotionData;
  thoughts?: ThoughtData[];
  coreBelief?: CoreBeliefData;
  challengeQuestions?: ChallengeQuestionsData;
  rationalThoughts?: RationalThoughtsData;
  schemaModes?: SchemaModesData;
  actionPlan?: ActionPlanData;
  finalEmotions?: EmotionData;
}

export interface CBTFlowState {
  sessionId: string | null;
  startedAt: string | null;
  updatedAt: string | null;
  status: CBTFlowStatus;
  currentStepId: CBTStepId | 'complete';
  completedSteps: CBTStepId[];
  context: CBTFlowContext;
}

export interface CBTStepMessages {
  component: {
    translationKey: string;
    defaultText: string;
  };
  aiResponse?: {
    translationKey: string;
    defaultText: string;
  };
}

export interface CBTStepMetadata {
  title: {
    translationKey: string;
    defaultText: string;
  };
  subtitle?: {
    translationKey: string;
    defaultText: string;
  };
  helpText?: {
    translationKey: string;
    defaultText: string;
  };
  completedLabel?: {
    translationKey: string;
    defaultText: string;
  };
  icon?: string;
}

export interface CBTStepConfig<TPayload> {
  id: CBTStepId;
  messages: CBTStepMessages;
  metadata: CBTStepMetadata;
  persist: (context: CBTFlowContext, payload: TPayload) => CBTFlowContext;
}

export type CBTStepPayloadMap = {
  situation: SituationData;
  emotions: EmotionData;
  thoughts: ThoughtData[];
  'core-belief': CoreBeliefData;
  'challenge-questions': ChallengeQuestionsData;
  'rational-thoughts': RationalThoughtsData;
  'schema-modes': SchemaModesData;
  actions: ActionPlanData;
  'final-emotions': EmotionData;
};

export type CBTStepConfigMap = {
  [K in CBTStepId]: CBTStepConfig<CBTStepPayloadMap[K]>;
};

export interface CBTFlowMessageDescriptor {
  id: string;
  stepId: CBTStepId;
  type: 'cbt-component' | 'ai-response';
  translationKey: string;
  defaultText: string;
  stepNumber: number;
  totalSteps: number;
}
