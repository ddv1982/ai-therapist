// CBT Chat Components - Clean, intuitive components for integrated CBT therapy

export { SituationPrompt } from './situation-prompt';
export { EmotionScale } from './emotion-scale';
export { ThoughtRecord } from './thought-record';
export { CoreBelief } from './core-belief';
export { ChallengeQuestions } from './challenge-questions';
export { RationalThoughts } from './rational-thoughts';
export { SchemaModes } from './schema-modes';
export { FinalEmotionReflection } from './final-emotion-reflection';
export { ActionPlan } from './action-plan';

// Component props types for convenience - now from Redux store
export type { 
  SituationData, 
  EmotionData, 
  ThoughtData, 
  SchemaModeData,
  ActionPlanData,
  CoreBeliefData,
  ChallengeQuestionData,
  RationalThoughtData
} from '@/store/slices/cbtSlice';
