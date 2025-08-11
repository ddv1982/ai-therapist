import { model, modelID } from "@/ai/providers";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { THERAPY_SYSTEM_PROMPT } from '@/lib/therapy/therapy-prompts';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    selectedModel = "openai/gpt-oss-20b",
  }: { messages: UIMessage[]; selectedModel?: modelID } = await req.json();

  const result = streamText({
    model: model.languageModel(selectedModel),
    system: THERAPY_SYSTEM_PROMPT,
    messages: messages as any,
    experimental_telemetry: {
      isEnabled: false,
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
      }
      console.error(error);
      return "An error occurred.";
    },
  });
}