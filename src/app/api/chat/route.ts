import { NextRequest } from 'next/server';
import { z } from 'zod';
import { languageModels, ModelID } from "@/ai/providers";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { THERAPY_SYSTEM_PROMPT } from '@/lib/therapy/therapy-prompts';
import { logger } from '@/lib/utils/logger';
import { withAuthAndRateLimitStreaming } from '@/lib/api/api-middleware';

import { prisma } from '@/lib/database/db';
import { verifySessionOwnership } from '@/lib/database/queries';
import { encryptMessage } from '@/lib/chat/message-encryption';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const POST = withAuthAndRateLimitStreaming(async (req: NextRequest, context) => {
  try {
    type ApiChatMessage = { role: 'user' | 'assistant'; content: string; id?: string };
    const chatRequestSchema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(50000).optional(),
        parts: z.array(z.object({ type: z.string().optional(), text: z.string().optional() })).optional(),
        id: z.string().optional(),
      })).min(1),
      // Tests provide non-UUID session ids; accept any non-empty string
      sessionId: z.string().min(1).optional(),
      selectedModel: z.string().optional(),
      webSearchEnabled: z.boolean().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(256).max(131072).optional(),
      topP: z.number().min(0.1).max(1.0).optional(),
    });

    let fullBody: unknown = undefined;
    let bodySize = 0;
    const MAX_SIZE = Number(process.env.CHAT_INPUT_MAX_BYTES || 128 * 1024);
    const anyReq = req as unknown as { json?: () => Promise<unknown>; text?: () => Promise<string> };
    if (typeof anyReq.json === 'function') {
      const data = await anyReq.json();
      fullBody = data;
      const jsonString = JSON.stringify(data);
      bodySize = Buffer.byteLength(jsonString, 'utf8');
    } else if (typeof anyReq.text === 'function') {
      const bodyText = await anyReq.text();
      bodySize = Buffer.byteLength(bodyText, 'utf8');
      const parsed = JSON.parse(bodyText);
      fullBody = parsed;
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported request body" }),
        { status: 400, headers: { "Content-Type": "application/json", "X-Request-Id": context.requestId } }
      );
    }

    // Basic payload size cap (~128KB default, configurable via env)
    if (bodySize > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: "Request too large" }),
        { status: 413, headers: { "Content-Type": "application/json", "X-Request-Id": context.requestId } }
      );
    }

    const parsedInput = chatRequestSchema.safeParse(fullBody);
    if (!parsedInput.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: parsedInput.error.message }),
        { status: 400, headers: { "Content-Type": "application/json", "X-Request-Id": context.requestId } }
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

    const typedMessages = normalizeMessages(parsedInput.data.messages);
    if (!typedMessages) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { "Content-Type": "application/json", "X-Request-Id": context.requestId } }
      );
    }
    // Extract sessionId for server-side persistence of assistant messages
    const sessionId = parsedInput.data.sessionId;
    // Respect explicit selectedModel when provided, otherwise auto-select
    const parsedSelectedModel = parsedInput.data.selectedModel;
    const webSearchEnabled = parsedInput.data.webSearchEnabled ?? false;
    
    // Simple toggle-based model selection: 120B for web search, 20B for fast responses
    const modelId = webSearchEnabled ? 'openai/gpt-oss-120b' : (parsedSelectedModel || 'openai/gpt-oss-20b');
    const hasWebSearch = webSearchEnabled;
    
    if (hasWebSearch) {
      logger.info('Browser search ACTIVE - will search web', { 
        apiEndpoint: '/api/chat', 
        requestId: context.requestId, 
        modelId,
        webSearchEnabled,
        toolChoice: 'required'
      });
    }

    // Locale directive for response language
    const { getApiRequestLocale } = await import('@/i18n/request');
    const locale = getApiRequestLocale(req);
    const languageDirective = process.env.NODE_ENV === 'test'
      ? ''
      : (
        locale === 'nl'
          ? `LANGUAGE REQUIREMENT:
Provide all responses in Dutch (Nederlands). Use natural Dutch phrasing. Preserve any code blocks, special markers (e.g., "CBT_SUMMARY_CARD"), and JSON keys exactly as-is.`
          : `LANGUAGE REQUIREMENT:
Provide all responses in English. Preserve any code blocks, special markers (e.g., "CBT_SUMMARY_CARD"), and JSON keys exactly as-is.`
      );

    // Build system prompt for use in streamText and error handling
    const basePrompt = hasWebSearch 
      ? THERAPY_SYSTEM_PROMPT + `

**WEB SEARCH CAPABILITIES ACTIVE:**
You have access to browser search tools. When users ask for current information, research, or resources that would support their therapeutic journey, USE the browser search tool actively to provide helpful, up-to-date information. Web searches can enhance therapy by finding evidence-based resources, current research, mindfulness videos, support groups, or practical tools. After searching, integrate the findings therapeutically and relate them back to the client's needs and goals.`
      : THERAPY_SYSTEM_PROMPT;

    const systemPrompt = languageDirective
      ? `${basePrompt}

${languageDirective}`
      : basePrompt;

    // Single streamText call with conditional properties
    const result = streamText({
      model: languageModels[modelId as ModelID],
      system: systemPrompt,
      messages: typedMessages,
      ...(hasWebSearch && { tools: { browser_search: groq.tools.browserSearch({}) } }),
      toolChoice: hasWebSearch ? 'required' : 'none',
      experimental_telemetry: { isEnabled: false },
    });

    const uiResponse = result.toUIMessageStreamResponse({
      onError: (error) => {
        if (error instanceof Error && error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
        
        // Handle tool choice conflicts and web search specific errors
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          
          // Handle tool choice conflicts specifically
          if (errorMessage.includes("tool choice is none, but model called a tool") ||
              errorMessage.includes("tool choice is required, but model did not call a tool")) {
            logger.error('Tool choice conflict detected', { 
              apiEndpoint: '/api/chat', 
              requestId: context.requestId, 
              userId: context.userInfo.userId,
              webSearchEnabled,
              modelId,
              errorMessage: error.message,
              promptIncludes: systemPrompt.includes('WEB SEARCH CAPABILITIES ACTIVE'),
              errorType: 'tool_choice_conflict'
            });
            return "I encountered a configuration issue. Let me try again without additional tools.";
          }
          
          // Handle other web search related errors
          if (errorMessage.includes("browser_search") || 
              errorMessage.includes("web search") || 
              errorMessage.includes("tool")) {
            logger.error('Web search tool error detected', { 
              apiEndpoint: '/api/chat', 
              requestId: context.requestId, 
              userId: context.userInfo.userId,
              webSearchEnabled,
              modelId,
              errorMessage: error.message,
              errorType: 'web_search_error'
            });
            return "I encountered an issue with web search functionality. Let me help you with the information I have available.";
          }
        }
        
        // Improve error detail logging for provider/tool issues
        try {
          const serialized = typeof error === 'object' ? JSON.stringify(error as unknown as Record<string, unknown>) : String(error);
          logger.error('Chat stream error', { apiEndpoint: '/api/chat', requestId: context.requestId, userId: context.userInfo.userId, detail: serialized });
        } catch {
          logger.error('Chat stream error', { apiEndpoint: '/api/chat', requestId: context.requestId, userId: context.userInfo.userId }, error instanceof Error ? error : new Error(String(error)));
        }
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
    if (!sessionId) {
      try { (uiResponse as Response).headers.set('X-Request-Id', context.requestId); } catch {}
      return uiResponse as Response;
    }

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
        const headers = new Headers((uiResponse as Response).headers);
        try { headers.set('X-Request-Id', context.requestId); } catch {}
        return new Response(clientStream, { status: (uiResponse as Response).status, headers });
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
    try { (uiResponse as Response).headers.set('X-Request-Id', context.requestId); } catch {}
    return uiResponse as Response;
  } catch (error) {
    logger.apiError('/api/chat', error as Error, { apiEndpoint: '/api/chat', requestId: context.requestId });
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json", "X-Request-Id": context.requestId } }
    );
  }
});