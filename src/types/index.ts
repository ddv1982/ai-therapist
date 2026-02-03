/**
 * Types - Central Re-exports
 * Exports from domain-organized type definitions
 */

// ============================================================================
// DOMAIN TYPE EXPORTS
// ============================================================================

// Chat Domain - Messages, streaming, and chat interactions
export type { StreamingStage, ChatMessage } from './domains/chat';

// Sessions Domain - Session management and operations
export type { Session } from './domains/sessions';

// Therapy Domain - CBT and therapeutic tools (types)
export type {
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionData,
  RationalThoughtData,
  SchemaMode,
  SchemaModeData,
  SituationData,
  ActionPlanData,
  ChallengeQuestionsData,
  RationalThoughtsData,
  SchemaModesData,
  CBTFormData,
  CBTFormValidationError,
  NumericEmotionKeys,
  CBTStepType,
  ObsessionData,
  CompulsionData,
  ObsessionsCompulsionsData,
  ParsedCBTData,
  SchemaReflectionCategory,
  SchemaReflectionData,
  CBTStructuredAssessment,
} from './domains/therapy';

// Therapy Domain - CBT constants and utility functions (values)
export {
  createInitialCBTFormData,
} from './domains/therapy';

// ============================================================================
// EXISTING TYPE EXPORTS (Kept in place)
// ============================================================================

// Database types
export type * from './database';

// Convex types
export type * from './convex';

// ============================================================================
// FEATURE-SPECIFIC EXPORTS
// ============================================================================

// Message types from their actual location
export type { MessageData as Message } from '@/features/chat/messages/message';
