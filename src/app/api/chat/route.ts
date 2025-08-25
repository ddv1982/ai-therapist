import { NextRequest } from 'next/server';
import { model } from "@/ai/providers";
import { streamText } from "ai";
import { THERAPY_SYSTEM_PROMPT } from '@/lib/therapy/therapy-prompts';
import { logger } from '@/lib/utils/logger';
import { withAuthAndRateLimitStreaming } from '@/lib/api/api-middleware';
import { selectModel } from '@/lib/model-utils';
import { getToolsForModel } from '@/ai/tools';
import { prisma } from '@/lib/database/db';
import { verifySessionOwnership } from '@/lib/database/queries';
import { encryptMessage } from '@/lib/chat/message-encryption';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const POST = withAuthAndRateLimitStreaming(async (req: NextRequest, context) => {
  try {
    // Parse request body with compatibility for tests/mocks
    type ApiChatMessage = { role: 'user' | 'assistant'; content: string; id?: string };
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
        const v = item as { role?: unknown; content?: unknown; parts?: unknown; id?: unknown };
        if (v.role !== 'user' && v.role !== 'assistant') return null;
        if (typeof v.content === 'string') {
          result.push({ role: v.role, content: v.content, id: typeof v.id === 'string' ? v.id : undefined });
          continue;
        }
        if (Array.isArray(v.parts)) {
          const parts = v.parts as Array<{ type?: unknown; text?: unknown }>;
          const text = parts
            .map(p => (p && (p.type === 'text') && typeof p.text === 'string' ? p.text : ''))
            .join('');
          result.push({ role: v.role, content: text, id: typeof v.id === 'string' ? v.id : undefined });
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
    // Extract sessionId for server-side persistence of assistant messages
    const sessionId = typeof (fullBody as { sessionId?: unknown } | undefined)?.sessionId === 'string'
      ? (fullBody as { sessionId: string }).sessionId
      : undefined;
    // Respect explicit selectedModel when provided, otherwise auto-select
    const parsedSelectedModel = typeof (fullBody as { selectedModel?: unknown } | undefined)?.selectedModel === 'string'
      ? (fullBody as { selectedModel: string }).selectedModel
      : undefined;
    const webSearchEnabled = typeof (fullBody as { webSearchEnabled?: unknown } | undefined)?.webSearchEnabled === 'boolean'
      ? (fullBody as { webSearchEnabled?: boolean }).webSearchEnabled
      : false;
    const { modelId } = parsedSelectedModel ? { modelId: parsedSelectedModel } : selectModel(String(lastContent));
    const tools = getToolsForModel(modelId, webSearchEnabled);

    const streamParams: Record<string, unknown> = {
      model: model.languageModel(modelId),
      system: THERAPY_SYSTEM_PROMPT,
      messages: typedMessages, // AI SDK handles conversion automatically
      experimental_telemetry: {
        isEnabled: false,
      },
    };
    if (tools && Object.keys(tools).length > 0) {
      streamParams.tools = tools;
    }
    const result = streamText(streamParams as unknown as Parameters<typeof streamText>[0]);

    const uiResponse = result.toUIMessageStreamResponse({
      onError: (error) => {
        if (error instanceof Error && error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
        logger.error('Chat stream error', { apiEndpoint: '/api/chat', requestId: context.requestId, userId: context.userInfo.userId }, error instanceof Error ? error : new Error(String(error)));
        return "An error occurred.";
      },
    });

    // Helper to persist from a full SSE text payload
    const persistFromSseText = async (sseText: string) => {
      try {
        const { valid } = await verifySessionOwnership(sessionId!, context.userInfo.userId);
        if (!valid) return;
        let accumulated = '';
        for (const rawLine of sseText.split('\n')) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          try {
            const obj = JSON.parse(payload);
            if (typeof obj?.text === 'string') {
              accumulated += obj.text;
            } else if (Array.isArray(obj?.parts)) {
              for (const part of obj.parts) {
                if (part && part.type === 'text' && typeof part.text === 'string') {
                  accumulated += part.text;
                }
              }
            } else if (typeof obj?.delta?.text === 'string') {
              accumulated += obj.delta.text;
            }
          } catch {
            // ignore parse errors
          }
        }
        if (accumulated) {
          const encrypted = encryptMessage({ role: 'assistant', content: accumulated, timestamp: new Date() });
          await prisma.message.create({
            data: {
              sessionId: sessionId!,
              role: encrypted.role,
              content: encrypted.content,
              timestamp: encrypted.timestamp,
              modelUsed: parsedSelectedModel,
            },
          });
          logger.info('Assistant message persisted after stream', { apiEndpoint: '/api/chat', requestId: context.requestId, sessionId });
        }
      } catch (persistError) {
        logger.error('Failed to persist assistant message after stream', { apiEndpoint: '/api/chat', requestId: context.requestId, sessionId }, persistError instanceof Error ? persistError : new Error(String(persistError)));
      }
    };

    // If no session, just return the UI response
    if (!sessionId) return uiResponse as Response;

    // Prefer streaming tee when available
    if ('body' in uiResponse && (uiResponse as Response).body && typeof (uiResponse as Response).body!.tee === 'function') {
      try {
        const [clientStream, serverStream] = (uiResponse as Response).body!.tee();
        const consumeAndPersist = async () => {
          const reader = serverStream.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let accumulated = '';
          const processBuffer = () => {
            let newlineIndex = buffer.indexOf('\n');
            while (newlineIndex !== -1) {
              const line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 1);
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const payload = trimmed.slice(5).trim();
                try {
                  const obj = JSON.parse(payload);
                  if (typeof obj?.text === 'string') {
                    accumulated += obj.text;
                  } else if (Array.isArray(obj?.parts)) {
                    for (const part of obj.parts) {
                      if (part && part.type === 'text' && typeof part.text === 'string') {
                        accumulated += part.text;
                      }
                    }
                  } else if (typeof obj?.delta?.text === 'string') {
                    accumulated += obj.delta.text;
                  }
                } catch {
                  // ignore parse errors
                }
              }
              newlineIndex = buffer.indexOf('\n');
            }
          };
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            processBuffer();
          }
          if (buffer.length > 0) processBuffer();
          if (accumulated) {
            const encrypted = encryptMessage({ role: 'assistant', content: accumulated, timestamp: new Date() });
            await prisma.message.create({
              data: {
                sessionId,
                role: encrypted.role,
                content: encrypted.content,
                timestamp: encrypted.timestamp,
                modelUsed: parsedSelectedModel,
              },
            });
            logger.info('Assistant message persisted after stream', { apiEndpoint: '/api/chat', requestId: context.requestId, sessionId });
          }
        };

        if (process.env.NODE_ENV === 'test') {
          await consumeAndPersist();
        } else {
          void consumeAndPersist();
        }
        return new Response(clientStream, { status: (uiResponse as Response).status, headers: (uiResponse as Response).headers });
      } catch {
        // fall through to non-streaming fallback
      }
    }

    // Fallback: if tee or web streams unavailable, clone and read full text
    try {
      const clone = (uiResponse as Response).clone?.() ?? uiResponse;
      const sseText = await (clone as Response).text?.();
      if (typeof sseText === 'string') {
        if (process.env.NODE_ENV === 'test') {
          // In tests, await to ensure deterministic persistence
          await persistFromSseText(sseText);
        } else {
          // Fire-and-forget so we don't delay the response
          void persistFromSseText(sseText);
        }
      }
    } catch {
      // ignore
    }
    return uiResponse as Response;
  } catch (error) {
    logger.apiError('/api/chat', error as Error, { apiEndpoint: '/api/chat', requestId: context.requestId });
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});