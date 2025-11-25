/**
 * Convex Validators
 *
 * This file provides Convex validators that mirror the Zod schemas in
 * `src/lib/validation/schemas/`. These validators ensure type safety
 * in Convex functions and maintain parity with client-side validation.
 *
 * ## IMPORTANT: Keeping Validators in Sync
 *
 * These validators MUST match the Zod schemas exactly. When modifying:
 * 1. Update the Zod schema first in `src/lib/validation/schemas/`
 * 2. Update the corresponding validator here
 * 3. Run type tests to verify alignment
 *
 * ## Validator Naming Convention
 *
 * - Validators end with `Validator` (e.g., `messageContentValidator`)
 * - Match the Zod schema name pattern (e.g., `messageContentSchema` → `messageContentValidator`)
 *
 * @module convex/validators
 */

import { v } from 'convex/values';

// ============================================================================
// THERAPEUTIC FRAMEWORK VALIDATORS
// ============================================================================

/**
 * Therapeutic frameworks used in therapy sessions
 * Mirrors: therapeuticFrameworkSchema in message.schema.ts
 */
export const therapeuticFrameworkValidator = v.union(
  v.literal('CBT'),
  v.literal('Schema'),
  v.literal('ERP'),
  v.literal('General')
);

/**
 * Extended therapeutic frameworks including ACT and DBT
 * Mirrors: therapeuticFrameworkIdSchema in therapy-metadata.ts
 */
export const therapeuticFrameworkIdValidator = v.union(
  v.literal('CBT'),
  v.literal('Schema'),
  v.literal('ERP'),
  v.literal('General'),
  v.literal('ACT'),
  v.literal('DBT')
);

// ============================================================================
// EMOTIONAL TONE VALIDATORS
// ============================================================================

/**
 * Emotional tone classification
 * Mirrors: emotionalToneSchema in message.schema.ts
 */
export const emotionalToneValidator = v.union(
  v.literal('positive'),
  v.literal('negative'),
  v.literal('neutral'),
  v.literal('mixed')
);

// ============================================================================
// MESSAGE VALIDATORS
// ============================================================================

/**
 * Message role validator
 * Mirrors: messageRoleSchema in message.schema.ts
 */
export const messageRoleValidator = v.union(v.literal('user'), v.literal('assistant'));

/**
 * Obsession entry validator for ERP therapy
 */
export const obsessionEntryValidator = v.object({
  trigger: v.string(),
  thought: v.string(),
  intensity: v.number(),
});

/**
 * Compulsion entry validator for ERP therapy
 */
export const compulsionEntryValidator = v.object({
  behavior: v.string(),
  frequency: v.string(),
  reduction: v.optional(v.string()),
});

/**
 * Obsessions and compulsions data validator for ERP messages
 */
export const obsessionsCompulsionsDataValidator = v.object({
  obsessions: v.array(obsessionEntryValidator),
  compulsions: v.array(compulsionEntryValidator),
  lastModified: v.string(),
});

/**
 * Message metadata validator (optional fields)
 * Mirrors: messageMetadataSchema in message.schema.ts
 *
 * Note: Uses optional fields wrapped in v.optional() to match Zod's .optional()
 */
export const messageMetadataValidator = v.optional(
  v.object({
    therapeuticFramework: v.optional(therapeuticFrameworkValidator),
    emotionalTone: v.optional(emotionalToneValidator),
    crisisIndicators: v.optional(v.boolean()),
    toolsUsed: v.optional(v.array(v.string())),
    // Extended fields for special message types
    modelId: v.optional(v.string()),
    type: v.optional(v.string()),
    step: v.optional(v.string()),
    // Structured data for ERP messages
    data: v.optional(obsessionsCompulsionsDataValidator),
    // Additional metadata fields for CBT messages
    stepNumber: v.optional(v.number()),
    totalSteps: v.optional(v.number()),
    sessionData: v.optional(v.object({})), // Allow empty object for session data
    dismissed: v.optional(v.boolean()),
    dismissedReason: v.optional(v.union(v.string(), v.null())),
  })
);

/**
 * Full message validator for stored messages
 * Mirrors: messageSchema in message.schema.ts
 */
export const messageValidator = v.object({
  sessionId: v.id('sessions'),
  role: v.string(),
  content: v.string(),
  modelUsed: v.optional(v.string()),
  metadata: messageMetadataValidator,
  timestamp: v.number(),
  createdAt: v.number(),
});

// ============================================================================
// SESSION VALIDATORS
// ============================================================================

/**
 * Session status validator
 * Mirrors: sessionStatusSchema in session.schema.ts
 */
export const sessionStatusValidator = v.union(v.literal('active'), v.literal('completed'));

/**
 * Full session validator for stored sessions
 * Mirrors: sessionSchema in session.schema.ts
 */
export const sessionValidator = v.object({
  userId: v.id('users'),
  title: v.string(),
  messageCount: v.number(),
  startedAt: v.number(),
  endedAt: v.union(v.number(), v.null()),
  status: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// ============================================================================
// REPORT VALIDATORS
// ============================================================================

/**
 * Severity level validator
 * Mirrors: severityLevelSchema in report.schema.ts
 */
export const severityLevelValidator = v.union(
  v.literal('low'),
  v.literal('moderate'),
  v.literal('high')
);

/**
 * Relevance/priority level validator
 * Mirrors: relevanceLevelSchema in report.schema.ts
 */
export const relevanceLevelValidator = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high')
);

/**
 * Urgency level validator
 * Mirrors: urgencyLevelSchema in therapy-metadata.ts
 */
export const urgencyLevelValidator = v.union(
  v.literal('immediate'),
  v.literal('short-term'),
  v.literal('long-term')
);

/**
 * Key point validator
 * Mirrors: keyPointSchema in report.schema.ts
 */
export const keyPointValidator = v.object({
  topic: v.string(),
  summary: v.string(),
  relevance: relevanceLevelValidator,
});

/**
 * Key points array validator
 * Mirrors: keyPointsSchema in report.schema.ts
 */
export const keyPointsValidator = v.array(keyPointValidator);

/**
 * Therapeutic insight validator
 * Mirrors: therapeuticInsightSchema in report.schema.ts
 */
export const therapeuticInsightValidator = v.object({
  framework: v.string(),
  insight: v.string(),
  confidence: v.number(),
});

/**
 * Therapeutic insights array validator
 * Mirrors: therapeuticInsightsSchema in report.schema.ts
 */
export const therapeuticInsightsValidator = v.array(therapeuticInsightValidator);

/**
 * Pattern identified validator
 * Mirrors: patternIdentifiedSchema in report.schema.ts
 */
export const patternIdentifiedValidator = v.object({
  name: v.string(),
  description: v.string(),
  frequency: v.number(),
  severity: severityLevelValidator,
});

/**
 * Patterns identified array validator
 * Mirrors: patternsIdentifiedSchema in report.schema.ts
 */
export const patternsIdentifiedValidator = v.array(patternIdentifiedValidator);

/**
 * Action item validator
 * Mirrors: actionItemSchema in report.schema.ts
 */
export const actionItemValidator = v.object({
  action: v.string(),
  priority: relevanceLevelValidator,
  timeframe: v.optional(v.string()),
});

/**
 * Action items array validator
 * Mirrors: actionItemsSchema in report.schema.ts
 */
export const actionItemsValidator = v.array(actionItemValidator);

/**
 * Cognitive distortion validator
 * Mirrors: cognitiveDistortionSchema in report.schema.ts
 */
export const cognitiveDistortionValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  examples: v.optional(v.array(v.string())),
  severity: severityLevelValidator,
  frequency: v.number(),
  therapeuticPriority: relevanceLevelValidator,
});

/**
 * Cognitive distortions array validator
 * Mirrors: cognitiveDistortionsSchema in report.schema.ts
 */
export const cognitiveDistortionsValidator = v.optional(v.array(cognitiveDistortionValidator));

/**
 * Schema analysis validator
 * Mirrors: schemaAnalysisSchema in report.schema.ts
 * Also accepts encrypted string for backwards compatibility
 */
export const schemaAnalysisValidator = v.optional(
  v.union(
    v.string(),
    v.object({
      activeModes: v.optional(v.array(v.string())),
      triggeredSchemas: v.optional(v.array(v.string())),
      predominantMode: v.optional(v.union(v.string(), v.null())),
      behavioralPatterns: v.optional(v.array(v.string())),
      copingStrategies: v.optional(
        v.object({
          adaptive: v.optional(v.array(v.string())),
          maladaptive: v.optional(v.array(v.string())),
        })
      ),
      therapeuticRecommendations: v.optional(v.array(v.string())),
    })
  )
);

/**
 * Therapeutic framework application validator
 * Mirrors: therapeuticFrameworkApplicationSchema in report.schema.ts
 */
export const therapeuticFrameworkApplicationValidator = v.object({
  name: v.string(),
  applicability: relevanceLevelValidator,
  specificTechniques: v.array(v.string()),
  rationale: v.string(),
  priority: v.number(),
});

/**
 * Therapeutic frameworks array validator
 * Mirrors: therapeuticFrameworksSchema in report.schema.ts
 * Also accepts encrypted string for backwards compatibility
 */
export const therapeuticFrameworksValidator = v.optional(
  v.union(v.string(), v.array(therapeuticFrameworkApplicationValidator))
);

/**
 * Recommendation validator
 * Mirrors: recommendationSchema in report.schema.ts
 */
export const recommendationValidator = v.object({
  framework: v.string(),
  technique: v.string(),
  rationale: v.string(),
  urgency: urgencyLevelValidator,
  expectedOutcome: v.optional(v.string()),
});

/**
 * Recommendations array validator
 * Mirrors: recommendationsSchema in report.schema.ts
 * Also accepts encrypted string for backwards compatibility
 */
export const recommendationsValidator = v.optional(
  v.union(v.string(), v.array(recommendationValidator))
);

/**
 * Flexible key points validator - accepts array of strings, structured objects,
 * or encrypted string (for backwards compatibility with encrypted data)
 */
export const flexibleKeyPointsValidator = v.union(
  v.string(),
  v.array(v.string()),
  v.array(keyPointValidator)
);

/**
 * Flexible therapeutic insights validator - accepts array of strings, structured objects,
 * encrypted string, or legacy object format (for backwards compatibility)
 */
export const flexibleTherapeuticInsightsValidator = v.union(
  v.string(),
  v.array(v.string()),
  v.array(therapeuticInsightValidator),
  v.any() // Allow legacy object format
);

/**
 * Flexible patterns identified validator - accepts array of strings, structured objects,
 * or encrypted string (for backwards compatibility with encrypted data)
 */
export const flexiblePatternsIdentifiedValidator = v.union(
  v.string(),
  v.array(v.string()),
  v.array(patternIdentifiedValidator)
);

/**
 * Flexible action items validator - accepts array of strings, structured objects,
 * or encrypted string (for backwards compatibility with encrypted data)
 */
export const flexibleActionItemsValidator = v.union(
  v.string(),
  v.array(v.string()),
  v.array(actionItemValidator)
);

/**
 * Flexible cognitive distortions validator - accepts array of strings, structured objects,
 * or encrypted string (for backwards compatibility with encrypted data)
 */
export const flexibleCognitiveDistortionsValidator = v.optional(
  v.union(v.string(), v.array(v.string()), v.array(cognitiveDistortionValidator))
);

/**
 * Full session report validator
 * Mirrors: sessionReportSchema in report.schema.ts
 *
 * Supports both simple string arrays and structured object arrays
 * for backwards compatibility with existing data.
 */
export const sessionReportValidator = v.object({
  sessionId: v.id('sessions'),
  reportContent: v.string(),
  keyPoints: flexibleKeyPointsValidator,
  therapeuticInsights: flexibleTherapeuticInsightsValidator,
  patternsIdentified: flexiblePatternsIdentifiedValidator,
  actionItems: flexibleActionItemsValidator,
  moodAssessment: v.optional(v.string()),
  progressNotes: v.optional(v.string()),
  cognitiveDistortions: flexibleCognitiveDistortionsValidator,
  schemaAnalysis: schemaAnalysisValidator,
  therapeuticFrameworks: therapeuticFrameworksValidator,
  recommendations: recommendationsValidator,
  analysisConfidence: v.optional(v.number()),
  analysisVersion: v.optional(v.string()),
  createdAt: v.number(),
});

// ============================================================================
// ARGUMENT VALIDATORS FOR CONVEX FUNCTIONS
// ============================================================================

/**
 * Send message argument validator
 * For use in Convex mutation arguments
 */
export const sendMessageArgsValidator = {
  sessionId: v.id('sessions'),
  content: v.string(),
  role: v.optional(messageRoleValidator),
  metadata: messageMetadataValidator,
};

/**
 * Create session argument validator
 * For use in Convex mutation arguments
 */
export const createSessionArgsValidator = {
  title: v.string(),
};

/**
 * Update session argument validator
 * For use in Convex mutation arguments
 */
export const updateSessionArgsValidator = {
  id: v.id('sessions'),
  title: v.optional(v.string()),
  status: v.optional(sessionStatusValidator),
  endedAt: v.optional(v.union(v.number(), v.null())),
};

/**
 * Get messages argument validator
 * For use in Convex query arguments
 */
export const getMessagesArgsValidator = {
  sessionId: v.id('sessions'),
  limit: v.optional(v.number()),
};

/**
 * Create report argument validator
 * For use in Convex mutation arguments
 */
export const createReportArgsValidator = {
  sessionId: v.id('sessions'),
  reportContent: v.string(),
  keyPoints: flexibleKeyPointsValidator,
  therapeuticInsights: flexibleTherapeuticInsightsValidator,
  patternsIdentified: flexiblePatternsIdentifiedValidator,
  actionItems: flexibleActionItemsValidator,
  moodAssessment: v.optional(v.string()),
  progressNotes: v.optional(v.string()),
  cognitiveDistortions: flexibleCognitiveDistortionsValidator,
  schemaAnalysis: schemaAnalysisValidator,
  therapeuticFrameworks: therapeuticFrameworksValidator,
  recommendations: recommendationsValidator,
  analysisConfidence: v.optional(v.number()),
  analysisVersion: v.optional(v.string()),
};

// ============================================================================
// TYPE EXPORTS FOR USE WITH CONVEX FUNCTIONS
// ============================================================================

/**
 * TypeScript types inferred from validators
 * Use these for type-safe Convex function implementations
 */
export type TherapeuticFramework = 'CBT' | 'Schema' | 'ERP' | 'General';
export type TherapeuticFrameworkId = 'CBT' | 'Schema' | 'ERP' | 'General' | 'ACT' | 'DBT';
export type EmotionalTone = 'positive' | 'negative' | 'neutral' | 'mixed';
export type MessageRole = 'user' | 'assistant';
export type SessionStatus = 'active' | 'completed';
export type SeverityLevel = 'low' | 'moderate' | 'high';
export type RelevanceLevel = 'low' | 'medium' | 'high';
export type UrgencyLevel = 'immediate' | 'short-term' | 'long-term';
