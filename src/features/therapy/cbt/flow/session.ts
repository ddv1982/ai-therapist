import type { CBTFlowState, CBTStepId } from './types';
import { selectContext, selectIsComplete } from './engine';
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

export interface CBTSessionSnapshot {
  id: string;
  sessionId?: string;
  startTime: Date;
  currentStep: CBTStepId | 'complete';
  isComplete: boolean;
  lastModified?: string;
  situationData?: SituationData;
  emotionData?: EmotionData;
  thoughtData?: ThoughtData[];
  coreBeliefData?: CoreBeliefData;
  challengeQuestionsData?: ChallengeQuestionsData;
  rationalThoughtsData?: RationalThoughtsData;
  schemaModesData?: SchemaModesData;
  actionData?: ActionPlanData;
}

export function toSessionSnapshot(flow: CBTFlowState): CBTSessionSnapshot {
  const context = selectContext(flow);
  return {
    id: flow.sessionId ?? '',
    sessionId: flow.sessionId ?? undefined,
    startTime: flow.startedAt ? new Date(flow.startedAt) : new Date(),
    currentStep: flow.currentStepId,
    isComplete: selectIsComplete(flow),
    lastModified: flow.updatedAt ?? undefined,
    situationData: context.situation,
    emotionData: context.emotions,
    thoughtData: context.thoughts,
    coreBeliefData: context.coreBelief,
    challengeQuestionsData: context.challengeQuestions,
    rationalThoughtsData: context.rationalThoughts,
    schemaModesData: context.schemaModes,
    actionData: context.actionPlan,
  };
}
