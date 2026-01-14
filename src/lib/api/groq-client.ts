import { generateText, Output, convertToModelMessages, streamText } from 'ai';
import type { UIMessage, LanguageModel } from 'ai';
import { groq } from '@ai-sdk/groq';
import { languageModels, type ModelID } from '@/ai/providers';
import { supportsWebSearch } from '@/ai/model-metadata';
import { parsedAnalysisSchema, type ParsedAnalysis } from '@/features/therapy/lib/analysis-schema';
import { ANALYTICAL_MODEL_ID } from '@/features/chat/config';

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
