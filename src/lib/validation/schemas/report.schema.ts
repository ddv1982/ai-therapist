/**
 * Report Validation Schemas
 *
 * These schemas are shared between client and server for consistent validation.
 * They must be kept in sync with Convex validators in `convex/validators.ts`.
 *
 * @module validation/schemas/report
 */

import { z } from 'zod';
import { messageRoleSchema } from './message.schema';

// ============================================================================
// SEVERITY LEVEL ENUM
// ============================================================================

export const severityLevels = ['low', 'moderate', 'high'] as const;

export const severityLevelSchema = z.enum(severityLevels);

// ============================================================================
// RELEVANCE LEVEL ENUM
// ============================================================================

export const relevanceLevels = ['low', 'medium', 'high'] as const;

export const relevanceLevelSchema = z.enum(relevanceLevels);

// ============================================================================
// KEY POINT SCHEMA
// ============================================================================

/**
 * Report key point validation schema
 */
export const keyPointSchema = z.object({
  topic: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  relevance: relevanceLevelSchema,
});

export const keyPointsSchema = z.array(keyPointSchema).max(50);

// ============================================================================
// THERAPEUTIC INSIGHT SCHEMA
// ============================================================================

/**
 * Therapeutic insight validation schema
 */
export const therapeuticInsightSchema = z.object({
  framework: z.string().min(1).max(100),
  insight: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(100),
});

export const therapeuticInsightsSchema = z.array(therapeuticInsightSchema).max(50);

// ============================================================================
// PATTERN SCHEMA
// ============================================================================

/**
 * Pattern identified validation schema
 */
export const patternIdentifiedSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  frequency: z.number().min(0).max(10),
  severity: severityLevelSchema,
});

export const patternsIdentifiedSchema = z.array(patternIdentifiedSchema).max(50);

// ============================================================================
// ACTION ITEM SCHEMA
// ============================================================================

/**
 * Action item validation schema
 */
export const actionItemSchema = z.object({
  action: z.string().min(1).max(500),
  priority: relevanceLevelSchema,
  timeframe: z.string().max(100).optional(),
});

export const actionItemsSchema = z.array(actionItemSchema).max(20);

// ============================================================================
// COGNITIVE DISTORTION SCHEMA
// ============================================================================

/**
 * Cognitive distortion validation schema
 */
export const cognitiveDistortionSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  examples: z.array(z.string().max(1000)).max(10).optional(),
  severity: severityLevelSchema,
  frequency: z.number().min(0).max(10),
  therapeuticPriority: relevanceLevelSchema,
});

export const cognitiveDistortionsSchema = z.array(cognitiveDistortionSchema).max(20).optional();

// ============================================================================
// SCHEMA ANALYSIS SCHEMA
// ============================================================================

/**
 * Schema analysis validation schema
 */
export const schemaAnalysisSchema = z
  .object({
    activeModes: z.array(z.string().max(100)).max(20).optional(),
    triggeredSchemas: z.array(z.string().max(100)).max(20).optional(),
    predominantMode: z.string().max(100).nullable().optional(),
    behavioralPatterns: z.array(z.string().max(500)).max(20).optional(),
    copingStrategies: z
      .object({
        adaptive: z.array(z.string().max(500)).max(10).optional(),
        maladaptive: z.array(z.string().max(500)).max(10).optional(),
      })
      .optional(),
    therapeuticRecommendations: z.array(z.string().max(1000)).max(10).optional(),
  })
  .optional();

// ============================================================================
// THERAPEUTIC FRAMEWORK SCHEMA
// ============================================================================

/**
 * Therapeutic framework application validation schema
 */
export const therapeuticFrameworkApplicationSchema = z.object({
  name: z.string().min(1).max(100),
  applicability: relevanceLevelSchema,
  specificTechniques: z.array(z.string().max(500)).max(10),
  rationale: z.string().max(2000),
  priority: z.number().int().min(1).max(5),
});

export const therapeuticFrameworksSchema = z
  .array(therapeuticFrameworkApplicationSchema)
  .max(10)
  .optional();

// ============================================================================
// RECOMMENDATION SCHEMA
// ============================================================================

/**
 * Therapeutic recommendation validation schema
 */
export const recommendationSchema = z.object({
  framework: z.string().min(1).max(100),
  technique: z.string().min(1).max(200),
  rationale: z.string().max(2000),
  urgency: z.enum(['immediate', 'short-term', 'long-term']),
  expectedOutcome: z.string().max(1000).optional(),
});

export const recommendationsSchema = z.array(recommendationSchema).max(20).optional();

// ============================================================================
// REPORT MESSAGE SCHEMA
// ============================================================================

/**
 * Simple message schema for report generation
 */
export const reportMessageSchema = z.object({
  role: messageRoleSchema,
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(50000, 'Message content too long'),
  timestamp: z.string().datetime().optional(),
});

// ============================================================================
// REPORT GENERATION SCHEMA
// ============================================================================

/**
 * Schema for report generation requests
 */
export const reportGenerationSchema = z
  .object({
    sessionId: z.string().min(1, 'Session ID cannot be empty'),
    model: z.string().min(1).max(100).optional(),
  })
  .strict();

/**
 * Schema for internal report generation with explicit context messages
 */
export const reportGenerationWithContextSchema = z
  .object({
    sessionId: z.string().min(1, 'Session ID cannot be empty'),
    contextualMessages: z
      .array(reportMessageSchema)
      .min(1, 'At least one message is required')
      .max(1000, 'Too many messages (max 1000)'),
    model: z.string().min(1).max(100).optional(),
  })
  .strict();

// ============================================================================
// FULL SESSION REPORT SCHEMA
// ============================================================================

/**
 * Full session report schema for stored reports
 */
export const sessionReportSchema = z.object({
  sessionId: z.string().min(1),
  reportContent: z.string().min(1),
  keyPoints: keyPointsSchema,
  therapeuticInsights: therapeuticInsightsSchema,
  patternsIdentified: patternsIdentifiedSchema,
  actionItems: actionItemsSchema,
  moodAssessment: z.string().max(1000).optional(),
  progressNotes: z.string().max(5000).optional(),
  cognitiveDistortions: cognitiveDistortionsSchema,
  schemaAnalysis: schemaAnalysisSchema,
  therapeuticFrameworks: therapeuticFrameworksSchema,
  recommendations: recommendationsSchema,
  analysisConfidence: z.number().min(0).max(100).optional(),
  analysisVersion: z.string().max(50).optional(),
  createdAt: z.number().int().positive(),
});
