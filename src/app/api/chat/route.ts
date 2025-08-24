import { NextRequest } from 'next/server';
import { model } from "@/ai/providers";
import { streamText } from "ai";
import { THERAPY_SYSTEM_PROMPT } from '@/lib/therapy/therapy-prompts';
import { logger } from '@/lib/utils/logger';
import { withAuthAndRateLimitStreaming } from '@/lib/api/api-middleware';
import { selectModel } from '@/lib/model-utils';
import { getToolsForModel } from '@/ai/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const POST = withAuthAndRateLimitStreaming(async (req: NextRequest, context) => {
  try {
    // Parse request body with compatibility for tests/mocks
    type ApiChatMessage = { role: 'user' | 'assistant'; content: string };
    let messages: unknown;
    let fullBody: unknown = undefined;
    let bodySize = 0;
    const MAX_SIZE = Number(process.env.CHAT_INPUT_MAX_BYTES || 128 * 1024);
    const anyReq = req as unknown as { json?: () => Promise<unknown>; text?: () => Promise<string> };
    if (typeof anyReq.json === 'function') {
      const data = await anyReq.json();
      fullBody = data;
      const jsonString = JSON.stringify(data);
      bodySize = Buffer.byteLength(jsonString, 'utf8');
      ({ messages } = data as { messages?: unknown });
    } else if (typeof anyReq.text === 'function') {
      const bodyText = await anyReq.text();
      bodySize = Buffer.byteLength(bodyText, 'utf8');
      const parsed = JSON.parse(bodyText);
      fullBody = parsed;
      ({ messages } = parsed);
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Basic payload size cap (~128KB default, configurable via env)
    if (bodySize > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: "Request too large" }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Accept both legacy { role, content } and AI SDK UI message { role, parts } shapes
    const normalizeMessages = (raw: unknown): ApiChatMessage[] | null => {
      if (!Array.isArray(raw)) return null;
      const result: ApiChatMessage[] = [];
      for (const item of raw as unknown[]) {
        if (typeof item !== 'object' || item === null) return null;
        const v = item as { role?: unknown; content?: unknown; parts?: unknown };
        if (v.role !== 'user' && v.role !== 'assistant') return null;
        if (typeof v.content === 'string') {
          result.push({ role: v.role, content: v.content });
          continue;
        }
        if (Array.isArray(v.parts)) {
          const parts = v.parts as Array<{ type?: unknown; text?: unknown }>;
          const text = parts
            .map(p => (p && (p.type === 'text') && typeof p.text === 'string' ? p.text : ''))
            .join('');
          result.push({ role: v.role, content: text });
          continue;
        }
        return null;
      }
      return result;
    };

    const typedMessages = normalizeMessages(messages);
    if (!typedMessages) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const lastContent = typedMessages.length > 0 ? typedMessages[typedMessages.length - 1].content : '';
    // Respect explicit selectedModel when provided, otherwise auto-select
    const parsedSelectedModel = typeof (fullBody as { selectedModel?: unknown } | undefined)?.selectedModel === 'string'
      ? (fullBody as { selectedModel: string }).selectedModel
      : undefined;
    const webSearchEnabled = typeof (fullBody as { webSearchEnabled?: unknown } | undefined)?.webSearchEnabled === 'boolean'
      ? (fullBody as { webSearchEnabled?: boolean }).webSearchEnabled
      : false;
    const { modelId } = parsedSelectedModel ? { modelId: parsedSelectedModel } : selectModel(String(lastContent));
    const tools = getToolsForModel(modelId, webSearchEnabled);

    const result = streamText({
      model: model.languageModel(modelId),
      system: THERAPY_SYSTEM_PROMPT,
      messages: typedMessages, // AI SDK handles conversion automatically
      tools,
      experimental_telemetry: {
        isEnabled: false,
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        if (error instanceof Error && error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
        logger.error('Chat stream error', { apiEndpoint: '/api/chat', requestId: context.requestId, userId: context.userInfo.userId }, error instanceof Error ? error : new Error(String(error)));
        return "An error occurred.";
      },
    });
  } catch (error) {
    logger.apiError('/api/chat', error as Error, { apiEndpoint: '/api/chat', requestId: context.requestId });
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});