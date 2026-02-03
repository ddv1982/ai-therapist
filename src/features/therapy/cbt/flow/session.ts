import type { CBTStepId } from './types';
import type {
  SituationData,
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData,
  ActionPlanData,
} from '@/types';

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
