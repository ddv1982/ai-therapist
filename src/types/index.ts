/**
 * Types - Central Re-exports
 * Exports from domain-organized type definitions
 */

// ============================================================================
// DOMAIN TYPE EXPORTS
// ============================================================================

// Chat Domain - Messages, streaming, and chat interactions
export type {
  ChatInterfaceProps,
  TypingIndicatorProps,
  StreamingStage,
  StreamingState,
  StreamingConfig,
  ChatMessage,
  NewMessage,
  ChatRequest,
  ModelConfig,
  ApiError,
  MessageListResponse,
} from './domains/chat';

// Sessions Domain - Session management and operations
export type {
  Session,
  CreateSessionRequest,
  CurrentSessionResponse,
  SessionSuccessResponse,
} from './domains/sessions';

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
  CBTSessionState,
  CBTFormValidationError,
  NumericEmotionKeys,
  CBTStepType,
  CBTStepData,
  CBTExtractionResult,
  ObsessionData,
  CompulsionData,
  ObsessionsCompulsionsData,
  ParsedCBTData,
  CBTExportData,
  SchemaReflectionCategory,
  SchemaReflectionQuestion,
  SchemaReflectionData,
  EmotionComparisonData,
  CBTStructuredAssessment,
} from './domains/therapy';

// Therapy Domain - CBT constants and utility functions (values)
export {
  DEFAULT_SCHEMA_MODES,
  DEFAULT_CHALLENGE_QUESTIONS,
  DEFAULT_SCHEMA_REFLECTION_QUESTIONS,
  createEmptyEmotionData,
  createInitialCBTFormData,
  getInitialCBTFormData,
} from './domains/therapy';

// Reports Domain - Session reports and therapeutic analysis
export type {
  SessionReport,
  SessionReportProps,
  ReportSummaryProps,
  GenerateReportRequest,
  ReportContent,
  CognitiveDistortion,
  SchemaAnalysis,
  TherapeuticFramework,
  TherapeuticRecommendation,
  EnhancedCognitiveAnalysis,
  ValidationResult,
  SessionContextSummary,
  ContentTier,
  AnalysisScope,
  ReportStyle,
  UserDataMetadata,
  ClientFriendlySessionReport,
  UserProvidedAssessment,
  GrowthInsight,
  ActionStep,
  Resource,
  Pattern,
  EnhancedCognitiveDistortion,
  ReportGenerationContext,
  ReportUserPreferences,
  ReportGenerationResult,
  ReportAnalytics,
  SessionReportMetrics,
  EmailReportRequest,
  ReportSuccessResponse,
  DetailedReportGenerationRequest,
  DetailedReportGenerationResponse,
  COGNITIVE_DISTORTIONS,
  SCHEMA_MODES,
  EARLY_MALADAPTIVE_SCHEMAS,
} from './domains/reports';

// ============================================================================
// EXISTING TYPE EXPORTS (Kept in place)
// ============================================================================

// UI types
export type * from './ui';

// Database types
export type * from './database';

// Convex types
export type * from './convex';

// ============================================================================
// FEATURE-SPECIFIC EXPORTS
// ============================================================================

// Message types from their actual location
export type { MessageData as Message } from '@/features/chat/messages/message';
export type { MessageRole } from '@/lib/ui/design-system/message';
export type { ApiResponse } from '@/lib/api/api-response';

// Session reducer types
import type { Session as SessionReducerType } from '@/features/chat/lib/session-reducer';
export type SessionReducer = SessionReducerType;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ChatSettings {
  model: string; // Model ID
  systemPrompt?: string;
  webSearchEnabled: boolean;
}

export interface SessionControlsProps {
  sessionId?: string;
  onStartSession: () => void | Promise<void>;
  onEndSession: () => void | Promise<void>;
  sessionDuration: number;
  status: string;
}
