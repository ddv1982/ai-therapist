import { generateText, Output, convertToModelMessages, streamText } from 'ai';
import type { UIMessage, LanguageModel } from 'ai';
import { groq } from '@ai-sdk/groq';
import { languageModels, type ModelID } from '@/ai/providers';
import { supportsWebSearch } from '@/ai/model-metadata';
import { z } from 'zod';
import { ANALYTICAL_MODEL_ID } from '@/features/chat/config';

// Zod schemas inlined from analysis-schema
const copingStrategiesSchema = z.object({
  adaptive: z.array(z.string()).describe('Healthy coping mechanisms used by client'),
  maladaptive: z.array(z.string()).describe('Unhealthy coping mechanisms to address'),
});

const schemaAnalysisSchema = z.object({
  activeModes: z.array(z.any()).optional().describe('Active schema modes identified in session'),
  triggeredSchemas: z
    .array(z.any())
    .optional()
    .describe('Core schemas that were triggered during conversation'),
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

const sessionOverviewSchema = z.object({
  themes: z.array(z.string()).optional().describe('Main themes discussed in session'),
  emotionalTone: z.string().optional().describe('Overall emotional tone of session'),
  engagement: z.string().optional().describe('Client engagement level during session'),
});

const cognitiveDistortionSchema = z.object({
  name: z.string().describe('Name of cognitive distortion'),
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
  examples: z.array(z.string()).optional().describe('Examples from conversation'),
});

const userDataIntegrationSchema = z.object({
  userRatingsUsed: z.boolean().optional().describe('Whether user provided emotion ratings'),
  userAssessmentCount: z.number().optional().describe('Number of user assessments included'),
  userInsightsPrioritized: z
    .boolean()
    .optional()
    .describe('Whether user insights were prioritized'),
});

const contentTierMetadataSchema = z.object({
  tier: z.string().optional().describe('Content tier (e.g., structured-cbt, conversational)'),
  analysisScope: z.string().optional().describe('Scope of analysis (e.g., comprehensive, basic)'),
  userDataReliability: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Reliability score for user-provided data'),
  dataSource: z.string().optional().describe('Source of data (e.g., parsed, inferred)'),
});

export const parsedAnalysisSchema = z.object({
  sessionOverview: sessionOverviewSchema.optional(),
  cognitiveDistortions: z
    .array(cognitiveDistortionSchema)
    .optional()
    .describe('Cognitive distortions identified in session'),
  schemaAnalysis: schemaAnalysisSchema.optional(),
  therapeuticFrameworks: z
    .array(z.any())
    .optional()
    .describe('Therapeutic frameworks applicable to this case'),
  recommendations: z.array(z.any()).optional().describe('Clinical recommendations'),
  keyPoints: z.array(z.string()).optional().describe('Key takeaways from session').or(z.any()),
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
    .describe('Overall confidence in analysis (0-100)'),
  userDataIntegration: userDataIntegrationSchema.optional(),
  contentTierMetadata: contentTierMetadataSchema.optional(),
});

export type ParsedAnalysis = z.infer<typeof parsedAnalysisSchema>;
export type CognitiveDistortion = z.infer<typeof cognitiveDistortionSchema>;
export type SchemaAnalysis = z.infer<typeof schemaAnalysisSchema>;
export type SessionOverview = z.infer<typeof sessionOverviewSchema>;

// Simplified message type for report generation (only needs role and content)
export interface ReportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerationOptions {
  temperature?: number;
  topP?: number;
}

/**
 * Generate a therapeutic session report using any LanguageModel instance.
 * Accepts either a model instance directly or falls back to model ID lookup.
 *
 * @param options - Optional temperature/topP settings (omit for reasoning models)
 */
export const generateSessionReport = async (
  messages: ReportMessage[],
  systemPrompt: string,
  modelOrId: LanguageModel | string = ANALYTICAL_MODEL_ID,
  options?: GenerationOptions
) => {
  const userPrompt = `Please generate a therapeutic session report based on the following conversation:\n\n${messages.map((m) => `${m.role}: ${m.content}`).join('\n\n')}`;

  // Support both model instance and model ID
  const model =
    typeof modelOrId === 'string'
      ? languageModels[modelOrId as keyof typeof languageModels]
      : modelOrId;

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    // Only include temperature/topP if provided (reasoning models don't support them)
    ...options,
  });

  return result.text;
};

/**
 * Extract structured analysis using generateText with Output.object() for type-safe outputs.
 * Uses AI SDK v6 pattern for structured object generation with Zod schema validation.
 * Accepts either a model instance directly or falls back to model ID lookup.
 *
 * @param options - Optional temperature settings (omit for reasoning models)
 */
export const extractStructuredAnalysis = async (
  reportContent: string,
  systemPrompt: string,
  modelOrId: LanguageModel | string = ANALYTICAL_MODEL_ID,
  options?: GenerationOptions
): Promise<ParsedAnalysis> => {
  const userPrompt = `Please extract structured analysis data from the following therapeutic report:\n\n${reportContent}`;

  // Support both model instance and model ID
  const model =
    typeof modelOrId === 'string'
      ? languageModels[modelOrId as keyof typeof languageModels]
      : modelOrId;

  const result = await generateText({
    model,
    output: Output.object({
      schema: parsedAnalysisSchema,
    }),
    system: systemPrompt,
    prompt: userPrompt,
    // Only include temperature if provided (reasoning models don't support it)
    ...(options?.temperature !== undefined && { temperature: options.temperature }),
  });

  return result.output;
};

// Browser search function using direct Groq integration
export const streamTextWithBrowserSearch = async (
  messages: AIMessage[],
  systemPrompt: string,
  modelId: string = ANALYTICAL_MODEL_ID
) => {
  // Ensure we're using a supported model for browser search
  const isModelID = (m: string): m is ModelID =>
    Object.prototype.hasOwnProperty.call(languageModels, m);
  if (!isModelID(modelId) || !supportsWebSearch(modelId)) {
    throw new Error('Browser search is only supported for models with web search capability');
  }

  const uiMessages: Array<Omit<UIMessage, 'id'>> = messages.map((message) => ({
    role: message.role,
    parts: [{ type: 'text', text: message.content }],
  }));

  try {
    // Use direct Groq model instance with browser search tool
    const modelMessages = await convertToModelMessages(uiMessages);

    const result = streamText({
      model: languageModels[modelId],
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        browser_search: groq.tools.browserSearch({}),
      },
      toolChoice: 'auto', // Let the model decide when to use web search
    });

    return result;
  } catch (error) {
    // Use structured logger; avoid console noise
    try {
      const { logger } = await import('@/lib/utils/logger');
      logger.error('Browser search failed', { module: 'groq-client' }, error as Error);
    } catch {}

    // Fallback: Use regular text generation without browser search
    const fallbackResult = streamText({
      model: languageModels[modelId],
      system: systemPrompt,
      messages: await convertToModelMessages(uiMessages),
    });

    return fallbackResult;
  }
};
