import { z } from 'zod';

/**
 * Zod schema for therapeutic analysis structure
 * Used for type-safe AI-generated structured outputs
 */

export const copingStrategiesSchema = z.object({
  adaptive: z.array(z.string()).describe('Healthy coping mechanisms used by the client'),
  maladaptive: z.array(z.string()).describe('Unhealthy coping mechanisms to address'),
});

export const schemaAnalysisSchema = z.object({
  activeModes: z
    .array(z.any())
    .optional()
    .describe('Active schema modes identified in the session'),
  triggeredSchemas: z
    .array(z.any())
    .optional()
    .describe('Core schemas that were triggered during the conversation'),
  behavioralPatterns: z.array(z.string()).default([]).describe('Observable behavioral patterns'),
  predominantMode: z
    .string()
    .nullable()
    .optional()
    .describe('The primary schema mode during this session'),
  copingStrategies: copingStrategiesSchema
    .default({ adaptive: [], maladaptive: [] })
    .describe('Coping strategies observed'),
  therapeuticRecommendations: z
    .array(z.string())
    .default([])
    .describe('Recommended therapeutic interventions'),
});

export const sessionOverviewSchema = z.object({
  themes: z.array(z.string()).optional().describe('Main themes discussed in the session'),
  emotionalTone: z.string().optional().describe('Overall emotional tone of the session'),
  engagement: z.string().optional().describe('Client engagement level during session'),
});

export const cognitiveDistortionSchema = z.object({
  name: z.string().describe('Name of the cognitive distortion'),
  description: z.string().optional().describe('Description of how it manifested'),
  contextAwareConfidence: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Confidence score (0-100) accounting for context'),
  falsePositiveRisk: z
    .enum(['high', 'medium', 'low'])
    .optional()
    .describe('Risk of false positive identification'),
  examples: z.array(z.string()).optional().describe('Examples from the conversation'),
});

export const userDataIntegrationSchema = z.object({
  userRatingsUsed: z.boolean().optional().describe('Whether user provided emotion ratings'),
  userAssessmentCount: z.number().optional().describe('Number of user assessments included'),
  userInsightsPrioritized: z
    .boolean()
    .optional()
    .describe('Whether user insights were prioritized'),
});

export const contentTierMetadataSchema = z.object({
  tier: z.string().optional().describe('Content tier (e.g., structured-cbt, conversational)'),
  analysisScope: z.string().optional().describe('Scope of analysis (e.g., comprehensive, basic)'),
  userDataReliability: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Reliability score for user-provided data'),
  dataSource: z.string().optional().describe('Source of the data (e.g., parsed, inferred)'),
});

/**
 * Main schema for parsed therapeutic analysis
 */
export const parsedAnalysisSchema = z.object({
  sessionOverview: sessionOverviewSchema.optional(),
  cognitiveDistortions: z
    .array(cognitiveDistortionSchema)
    .optional()
    .describe('Cognitive distortions identified in the session'),
  schemaAnalysis: schemaAnalysisSchema.optional(),
  therapeuticFrameworks: z
    .array(z.any())
    .optional()
    .describe('Therapeutic frameworks applicable to this case'),
  recommendations: z.array(z.any()).optional().describe('Clinical recommendations'),
  keyPoints: z.array(z.string()).optional().describe('Key takeaways from the session').or(z.any()),
  therapeuticInsights: z.any().optional().describe('Therapeutic insights and observations'),
  patternsIdentified: z.any().optional().describe('Behavioral patterns identified'),
  actionItems: z.any().optional().describe('Action items for client'),
  moodAssessment: z.string().optional().describe('Overall mood assessment'),
  progressNotes: z.string().optional().describe('Progress notes'),
  analysisConfidence: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Overall confidence in the analysis (0-100)'),
  userDataIntegration: userDataIntegrationSchema.optional(),
  contentTierMetadata: contentTierMetadataSchema.optional(),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type ParsedAnalysis = z.infer<typeof parsedAnalysisSchema>;
export type CognitiveDistortion = z.infer<typeof cognitiveDistortionSchema>;
export type SchemaAnalysis = z.infer<typeof schemaAnalysisSchema>;
export type SessionOverview = z.infer<typeof sessionOverviewSchema>;
