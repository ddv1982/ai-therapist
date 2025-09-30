import { NextRequest } from 'next/server';
import { languageModels, ModelID } from "@/ai/providers";
import { groq } from "@ai-sdk/groq";
import { getTherapySystemPrompt } from '@/lib/therapy/prompts';
import { streamChatCompletion } from '@/lib/chat/streaming';
import { normalizeChatRequest } from '@/lib/chat/chat-request';
import { selectModelAndTools } from '@/lib/chat/model-selector';
// no auto-creation here; session is optional and created client-side on first send
import { logger } from '@/lib/utils/logger';
import { withAuthAndRateLimitStreaming } from '@/lib/api/api-middleware';
import { createErrorResponse } from '@/lib/api/api-response';

import { prisma } from '@/lib/database/db';
import { verifySessionOwnership } from '@/lib/database/queries';
import { recordModelUsage } from '@/lib/metrics/metrics';
import { appendWithLimit as appendWithLimitUtil, teeAndPersistStream as teeAndPersistStreamUtil, persistFromClonedStream as persistFromClonedStreamUtil, attachResponseHeadersRaw as attachResponseHeadersRawUtil } from '@/lib/chat/stream-utils';
import { AssistantResponseCollector } from '@/lib/chat/assistant-response-collector';
import { readJsonBody } from '@/lib/api/request';

type ApiChatMessage = { role: 'user' | 'assistant'; content: string; id?: string };

const DEFAULT_MAX_INPUT_BYTES = 128 * 1024;
const MAX_ASSISTANT_RESPONSE_CHARS = (() => {
  const raw = Number(process.env.CHAT_RESPONSE_MAX_CHARS ?? 100_000);
  return Number.isFinite(raw) && raw > 0 ? raw : 100_000;
})();

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type SessionOwnership = Awaited<ReturnType<typeof verifySessionOwnership>>;

// Stream types and helpers are imported from stream-utils

// moved AssistantResponseCollector to lib/chat/assistant-response-collector

export const POST = withAuthAndRateLimitStreaming(async (req: NextRequest, context) => {
  try {
    const parsedBody = await readJsonBody(req);
    const maxSize = Number(process.env.CHAT_INPUT_MAX_BYTES || DEFAULT_MAX_INPUT_BYTES);
    if (parsedBody.size > maxSize) return createErrorResponse('Request too large', 413, { requestId: context.requestId });

    const input = parsedBody.body;
    const raw = input as { sessionId?: string; messages?: Array<{ role?: string; content?: unknown; parts?: Array<{ type?: string; text?: unknown }> }>; message?: unknown; selectedModel?: string; webSearchEnabled?: boolean };
    const firstUser = Array.isArray(raw?.messages) ? raw.messages.find(m => m?.role === 'user') : undefined;
    const normalized = normalizeChatRequest({
      sessionId: raw?.sessionId,
      message: typeof raw?.message === 'string' && raw.message.length > 0
        ? raw.message
        : typeof firstUser?.content === 'string'
          ? firstUser.content
          : Array.isArray(firstUser?.parts)
            ? firstUser!.parts.map(p => (p && p.type === 'text' && typeof p.text === 'string' ? p.text : '')).join('')
            : '',
      model: raw?.selectedModel,
      context: undefined,
      tools: undefined,
    });
    if (!normalized.success) {
      return createErrorResponse('Invalid request data', 400, { requestId: context.requestId, details: normalized.error });
    }

    const providedSessionId = normalized.data.sessionId;
    const ownership = await resolveSessionOwnership(providedSessionId, context.userInfo.userId);
    const history = providedSessionId && ownership.valid ? await loadSessionHistory(providedSessionId, ownership) : [];
    // Prefer forwarding original payload messages (with ids) when available; otherwise build from normalized
    const payloadMessages = Array.isArray(raw?.messages) ? raw.messages : null;
    type RawMsg = { role?: string; content?: unknown; parts?: Array<{ type?: string; text?: unknown }>; id?: unknown };
    const isForwardable = (m: RawMsg | null | undefined): m is { role: 'user' | 'assistant'; content?: unknown; parts?: Array<{ type?: string; text?: unknown }>; id?: unknown } =>
      !!m && (m.role === 'user' || m.role === 'assistant');

    const forwarded: Array<{ role: 'user' | 'assistant'; content: string; id?: string }> = payloadMessages
      ? (payloadMessages as RawMsg[])
          .filter(isForwardable)
          .map((m) => ({
            role: m.role,
            id: typeof m.id === 'string' ? m.id : undefined,
            content: typeof m.content === 'string'
              ? m.content
              : Array.isArray(m.parts)
                ? m.parts.map((p) => (p && p.type === 'text' && typeof p.text === 'string' ? p.text : '')).join('')
                : '',
          }))
      : [{ role: 'user' as const, content: normalized.data.message }];

    const decision = selectModelAndTools({ message: normalized.data.message, preferredModel: normalized.data.model, webSearchEnabled: Boolean(raw?.webSearchEnabled) });
    const modelId = decision.model;
    const hasWebSearch = decision.tools.includes('web-search');
    const toolChoiceHeader = hasWebSearch ? 'required' : 'none';

    logger.info('Model selection for chat request', {
      apiEndpoint: '/api/chat',
      requestId: context.requestId,
      modelId,
      toolChoice: toolChoiceHeader,
      webSearchEnabled: hasWebSearch,
      selectedModelProvided: Boolean(normalized.data.model),
    });

    const systemPrompt = await buildSystemPrompt(req, hasWebSearch);
    try { recordModelUsage(modelId, toolChoiceHeader); } catch {}
    const result = streamChatCompletion({
      model: languageModels[modelId as ModelID] as unknown as string,
      system: systemPrompt,
      messages: [...history, ...forwarded],
      telemetry: { isEnabled: false },
      ...(hasWebSearch ? { tools: { browser_search: groq.tools.browserSearch({}) }, toolChoice: 'required' as const } : {}),
    });

    const collector = new AssistantResponseCollector(
      providedSessionId,
      ownership,
      modelId,
      context.requestId,
      MAX_ASSISTANT_RESPONSE_CHARS,
      appendWithLimitUtil
    );

    const uiResponse = (await result).toUIMessageStreamResponse({
      onError: createStreamErrorHandler({
        context,
        systemPrompt,
        modelId,
        webSearchEnabled: hasWebSearch,
      }),
    });

    if (!normalized.data.sessionId) {
      attachResponseHeaders(uiResponse as Response, context.requestId, modelId, toolChoiceHeader);
      return uiResponse as Response;
    }

    // Abort handling: if client disconnects, reader will error; we also hook into "abort" events
    if ('body' in uiResponse && (uiResponse as Response).body && typeof (uiResponse as Response).body!.tee === 'function') {
      const responseWithHeaders = await teeAndPersistStreamUtil(
        uiResponse as Response,
        collector,
        context.requestId,
        modelId,
        toolChoiceHeader,
      );
      if (responseWithHeaders) return responseWithHeaders;
    }

    await persistFromClonedStreamUtil(uiResponse as Response, collector);
    attachResponseHeaders(uiResponse as Response, context.requestId, modelId, toolChoiceHeader);
    return uiResponse as Response;
  } catch (error) {
    logger.apiError('/api/chat', error as Error, { apiEndpoint: '/api/chat', requestId: context.requestId });
    return createErrorResponse('Failed to process request', 500, { requestId: context.requestId });
  }
});

// moved to lib/api/request.ts as readJsonBody

// normalizeMessages inlined into normalizeChatRequest usage

async function resolveSessionOwnership(sessionId: string | undefined, userId: string) {
  if (!sessionId) return { valid: false } as SessionOwnership;
  return verifySessionOwnership(sessionId, userId, { includeMessages: true });
}

async function loadSessionHistory(sessionId: string, ownership: SessionOwnership): Promise<ApiChatMessage[]> {
  const sessionMessages = Array.isArray(ownership.session?.messages)
    ? ownership.session!.messages
    : await prisma.message.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      });

  const { safeDecryptMessages } = await import('@/lib/chat/message-encryption');
  const decrypted = safeDecryptMessages(
    sessionMessages.map(message => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    })),
  );

  return decrypted.map((message, index) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content,
    id: sessionMessages[index]?.id,
  }));
}

// superseded by selectModelAndTools

async function buildSystemPrompt(req: NextRequest, hasWebSearch: boolean): Promise<string> {
  const { getApiRequestLocale } = await import('@/i18n/request');
  const locale = getApiRequestLocale(req);
  const base = getTherapySystemPrompt(locale, { webSearch: hasWebSearch });
  // Strong, localized language directive to ensure the next response follows the current app locale
  const directive = locale === 'nl'
    ? 'TAALBELEID: Antwoord uitsluitend in natuurlijk Nederlands. Als de app‑taal wijzigt of de gebruiker daarom vraagt, schakel direct over en ga verder in die taal; bevestig de wijziging éénmaal.'
    : 'LANGUAGE POLICY: Respond exclusively in natural English. If the app locale changes or the user requests a language change, switch immediately and continue in that language; acknowledge the change once.';
  return `${directive}\n\n${base}`;
}

function createStreamErrorHandler(params: {
  context: { requestId: string; userInfo: { userId: string } };
  systemPrompt: string;
  modelId: string;
  webSearchEnabled: boolean;
}) {
  const { context, systemPrompt, modelId, webSearchEnabled } = params;
  return (error: unknown) => {
    if (error instanceof Error && error.message.includes('Rate limit')) {
      return 'Rate limit exceeded. Please try again later.';
    }

    if (error instanceof Error) {
      const lower = error.message.toLowerCase();
      if (lower.includes('tool choice is none, but model called a tool') || lower.includes('tool choice is required, but model did not call a tool')) {
        logger.error('Tool choice conflict detected', {
          apiEndpoint: '/api/chat',
          requestId: context.requestId,
          userId: context.userInfo.userId,
          webSearchEnabled,
          modelId,
          errorMessage: error.message,
          promptIncludes: systemPrompt.includes('WEB SEARCH CAPABILITIES ACTIVE'),
          errorType: 'tool_choice_conflict',
        });
        return 'I encountered a configuration issue. Let me try again without additional tools.';
      }

      if (lower.includes('browser_search') || lower.includes('web search') || lower.includes('tool')) {
        logger.error('Web search tool error detected', {
          apiEndpoint: '/api/chat',
          requestId: context.requestId,
          userId: context.userInfo.userId,
          webSearchEnabled,
          modelId,
          errorMessage: error.message,
          errorType: 'web_search_error',
        });
        return 'I encountered an issue with web search functionality. Let me help you with the information I have available.';
      }
    }

    try {
      const detail = typeof error === 'object' ? JSON.stringify(error as Record<string, unknown>) : String(error);
      logger.error('Chat stream error', { apiEndpoint: '/api/chat', requestId: context.requestId, userId: context.userInfo.userId, detail });
    } catch {
      logger.error('Chat stream error', { apiEndpoint: '/api/chat', requestId: context.requestId, userId: context.userInfo.userId }, error instanceof Error ? error : new Error(String(error)));
    }
    return 'An error occurred.';
  };
}

function attachResponseHeaders(response: Response, requestId: string, modelId: string, toolChoice: string) {
  try {
    attachResponseHeadersRawUtil(response.headers, requestId, modelId, toolChoice);
  } catch {
    // ignore header failures
  }
}
