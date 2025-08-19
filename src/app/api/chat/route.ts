import { model } from "@/ai/providers";
import { streamText } from "ai";
import { THERAPY_SYSTEM_PROMPT } from '@/lib/therapy/therapy-prompts';
import { logger } from '@/lib/utils/logger';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, selectedModel = "openai/gpt-oss-20b" } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = streamText({
      model: model.languageModel(selectedModel),
      system: THERAPY_SYSTEM_PROMPT,
      messages: messages, // AI SDK handles conversion automatically
      experimental_telemetry: {
        isEnabled: false,
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        if (error instanceof Error && error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
        logger.error('Chat stream error', { apiEndpoint: '/api/chat' }, error instanceof Error ? error : new Error(String(error)));
        return "An error occurred.";
      },
    });
  } catch (error) {
    logger.apiError('/api/chat', error as Error, { apiEndpoint: '/api/chat' });
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}