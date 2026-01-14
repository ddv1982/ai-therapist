/**
 * Therapy Metadata Types
 * TypeScript interfaces and Zod schemas for therapy-related metadata fields
 * used in messages and session reports.
 */

import { z } from 'zod';

// ============================================================================
// MESSAGE METADATA TYPES
// ============================================================================

/**
 * Therapeutic framework identifier
 */
export type TherapeuticFrameworkId = 'CBT' | 'Schema' | 'ERP' | 'General' | 'ACT' | 'DBT';

/**
 * Emotional tone classification
 */
export type EmotionalTone = 'positive' | 'negative' | 'neutral' | 'mixed';

/**
 * Base message metadata for all messages
 */
export interface MessageMetadataBase {
  /** The therapeutic framework being used */
  therapeuticFramework?: TherapeuticFrameworkId;
  /** Emotional tone of the message */
  emotionalTone?: EmotionalTone;
  /** Whether crisis indicators were detected */
  crisisIndicators?: boolean;
  /** Tools or techniques used in this message */
  toolsUsed?: string[];
  /** AI model ID that generated this message */
  modelId?: string;
  /** Message type identifier */
  type?: string;
  /** Current step in a multi-step process */
  step?: string;
}

/**
 * Obsession data structure for ERP therapy
 * Mirrors: ObsessionData in types/domains/therapy.ts
 */
export interface ObsessionEntry {
  id: string;
  obsession: string;
  intensity: number;
  triggers: string[];
  createdAt: string;
}

/**
 * Compulsion data structure for ERP therapy
 * Mirrors: CompulsionData in types/domains/therapy.ts
 */
export interface CompulsionEntry {
  id: string;
  compulsion: string;
  frequency: number;
  duration: number;
  reliefLevel: number;
  createdAt: string;
}

/**
 * Obsessions and Compulsions data for ERP messages
 */
export interface ObsessionsCompulsionsMetadata {
  obsessions: ObsessionEntry[];
  compulsions: CompulsionEntry[];
  lastModified: string;
}

/**
 * Message metadata with obsessions/compulsions data
 */
export interface ObsessionsCompulsionsMessageMetadata extends MessageMetadataBase {
  type: 'obsessions-compulsions-table';
  step: 'obsessions-compulsions';
  data: ObsessionsCompulsionsMetadata;
}

/**
 * Union type for all possible message metadata shapes
 */
export type MessageMetadata = MessageMetadataBase | ObsessionsCompulsionsMessageMetadata;

// ============================================================================
// SESSION REPORT METADATA TYPES
// ============================================================================

/**
 * Key point extracted from a session
 */
export interface ReportKeyPoint {
  topic: string;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
}

/**
 * Therapeutic insight from session analysis
 */
export interface TherapeuticInsight {
  framework: string;
  insight: string;
  confidence: number;
}

/**
 * Pattern identified in the session
 */
export interface IdentifiedPattern {
  patternType: 'thinking' | 'emotional' | 'behavioral' | 'relational';
  description: string;
  frequency: 'rare' | 'occasional' | 'frequent' | 'persistent';
}

/**
 * Action item for follow-up
 */
export interface ActionItem {
  task: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  category: 'self-care' | 'reflection' | 'practice' | 'professional';
}

/**
 * Cognitive distortion identified in session
 */
export interface CognitiveDistortionEntry {
  id: string;
  name: string;
  description: string;
  examples: string[];
  severity: 'low' | 'moderate' | 'high';
  frequency: number;
  therapeuticPriority: 'low' | 'medium' | 'high';
  emotionalContext: number;
  contextualSupport: string[];
  contextAwareConfidence: number;
  validationRationale: string;
  neutralContextFlags: string[];
  falsePositiveRisk: 'low' | 'medium' | 'high';
  userDataSupported?: boolean;
  analysisGatingTier?: 'tier1_premium' | 'tier2_standard' | 'tier3_minimal';
}

/**
 * Schema mode from Schema Therapy
 */
export interface SchemaModeEntry {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  intensity: number;
  behavioralIndicators: string[];
  therapeuticResponse: string;
}

/**
 * Early maladaptive schema
 */
export interface EarlyMaladaptiveSchemaEntry {
  id: string;
  name: string;
  domain: string;
  description: string;
  isTriggered: boolean;
  severity: 'low' | 'moderate' | 'high';
  manifestations: string[];
}

/**
 * Schema analysis results
 */
export interface SchemaAnalysisData {
  activeModes: SchemaModeEntry[];
  triggeredSchemas: EarlyMaladaptiveSchemaEntry[];
  predominantMode: string | null;
  behavioralPatterns: string[];
  copingStrategies: {
    adaptive: string[];
    maladaptive: string[];
  };
  therapeuticRecommendations: string[];
}

/**
 * Therapeutic framework analysis
 */
export interface TherapeuticFrameworkEntry {
  name: string;
  applicability: 'high' | 'medium' | 'low';
  specificTechniques: string[];
  rationale: string;
  priority: number;
}

/**
 * Therapeutic recommendation
 */
export interface TherapeuticRecommendationEntry {
  framework: string;
  technique: string;
  rationale: string;
  urgency: 'immediate' | 'short-term' | 'long-term';
  expectedOutcome: string;
}

// ============================================================================
// ZOD SCHEMAS - MESSAGE METADATA
// ============================================================================

export const therapeuticFrameworkIdSchema = z.enum([
  'CBT',
  'Schema',
  'ERP',
  'General',
  'ACT',
  'DBT',
]);

export const emotionalToneSchema = z.enum(['positive', 'negative', 'neutral', 'mixed']);

export const obsessionEntrySchema = z.object({
  id: z.string(),
  obsession: z.string(),
  intensity: z.number(),
  triggers: z.array(z.string()),
  createdAt: z.string(),
});

export const compulsionEntrySchema = z.object({
  id: z.string(),
  compulsion: z.string(),
  frequency: z.number(),
  duration: z.number(),
  reliefLevel: z.number(),
  createdAt: z.string(),
});

export const obsessionsCompulsionsMetadataSchema = z.object({
  obsessions: z.array(obsessionEntrySchema),
  compulsions: z.array(compulsionEntrySchema),
  lastModified: z.string(),
});

export const messageMetadataBaseSchema = z.object({
  therapeuticFramework: therapeuticFrameworkIdSchema.optional(),
  emotionalTone: emotionalToneSchema.optional(),
  crisisIndicators: z.boolean().optional(),
  toolsUsed: z.array(z.string()).optional(),
  modelId: z.string().optional(),
  type: z.string().optional(),
  step: z.string().optional(),
});

export const obsessionsCompulsionsMessageMetadataSchema = messageMetadataBaseSchema.extend({
  type: z.literal('obsessions-compulsions-table'),
  step: z.literal('obsessions-compulsions'),
  data: obsessionsCompulsionsMetadataSchema,
});

/**
 * Flexible message metadata schema that allows known fields plus additional properties
 * This provides type safety for known fields while allowing extensibility
 */
export const messageMetadataSchema = z.union([
  obsessionsCompulsionsMessageMetadataSchema,
  messageMetadataBaseSchema.passthrough(),
]);

// ============================================================================
// ZOD SCHEMAS - SESSION REPORT METADATA
// ============================================================================

export const relevanceLevelSchema = z.enum(['high', 'medium', 'low']);
export const severityLevelSchema = z.enum(['low', 'moderate', 'high']);
export const patternTypeSchema = z.enum(['thinking', 'emotional', 'behavioral', 'relational']);
export const frequencyLevelSchema = z.enum(['rare', 'occasional', 'frequent', 'persistent']);
export const urgencyLevelSchema = z.enum(['immediate', 'short-term', 'long-term']);
export const contentTierSchema = z.enum(['tier1_premium', 'tier2_standard', 'tier3_minimal']);

export const reportKeyPointSchema = z.object({
  topic: z.string(),
  summary: z.string(),
  relevance: relevanceLevelSchema,
});

export const therapeuticInsightSchema = z.object({
  framework: z.string(),
  insight: z.string(),
  confidence: z.number().min(0).max(100),
});

export const identifiedPatternSchema = z.object({
  patternType: patternTypeSchema,
  description: z.string(),
  frequency: frequencyLevelSchema,
});

export const actionItemSchema = z.object({
  task: z.string(),
  priority: relevanceLevelSchema,
  timeframe: urgencyLevelSchema,
  category: z.enum(['self-care', 'reflection', 'practice', 'professional']),
});

export const cognitiveDistortionEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
  severity: severityLevelSchema,
  frequency: z.number().min(0).max(10),
  therapeuticPriority: relevanceLevelSchema,
  emotionalContext: z.number().min(0).max(10),
  contextualSupport: z.array(z.string()),
  contextAwareConfidence: z.number().min(0).max(100),
  validationRationale: z.string(),
  neutralContextFlags: z.array(z.string()),
  falsePositiveRisk: relevanceLevelSchema,
  userDataSupported: z.boolean().optional(),
  analysisGatingTier: contentTierSchema.optional(),
});

export const schemaModeEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  intensity: z.number().min(0).max(10),
  behavioralIndicators: z.array(z.string()),
  therapeuticResponse: z.string(),
});

export const earlyMaladaptiveSchemaEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  description: z.string(),
  isTriggered: z.boolean(),
  severity: severityLevelSchema,
  manifestations: z.array(z.string()),
});

export const schemaAnalysisDataSchema = z.object({
  activeModes: z.array(schemaModeEntrySchema),
  triggeredSchemas: z.array(earlyMaladaptiveSchemaEntrySchema),
  predominantMode: z.string().nullable(),
  behavioralPatterns: z.array(z.string()),
  copingStrategies: z.object({
    adaptive: z.array(z.string()),
    maladaptive: z.array(z.string()),
  }),
  therapeuticRecommendations: z.array(z.string()),
});

export const therapeuticFrameworkEntrySchema = z.object({
  name: z.string(),
  applicability: relevanceLevelSchema,
  specificTechniques: z.array(z.string()),
  rationale: z.string(),
  priority: z.number().min(1).max(5),
});

export const therapeuticRecommendationEntrySchema = z.object({
  framework: z.string(),
  technique: z.string(),
  rationale: z.string(),
  urgency: urgencyLevelSchema,
  expectedOutcome: z.string(),
});

// ============================================================================
// SIMPLIFIED SCHEMAS FOR CONVEX (string arrays for basic fields)
// ============================================================================

/**
 * Simple key points schema (array of strings)
 * Used when full ReportKeyPoint structure is not needed
 */
export const simpleKeyPointsSchema = z.array(z.string());

/**
 * Simple therapeutic insights schema (array of strings)
 * Used when full TherapeuticInsight structure is not needed
 */
export const simpleTherapeuticInsightsSchema = z.array(z.string());

/**
 * Simple patterns schema (array of strings)
 * Used when full IdentifiedPattern structure is not needed
 */
export const simplePatternsSchema = z.array(z.string());

/**
 * Simple action items schema (array of strings)
 * Used when full ActionItem structure is not needed
 */
export const simpleActionItemsSchema = z.array(z.string());
