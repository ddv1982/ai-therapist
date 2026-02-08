import { NextRequest } from 'next/server';
import { convertToModelMessages, tool } from 'ai';
import type { UIMessage } from 'ai';
import { languageModels, ModelID } from '@/ai/providers';
import { MODEL_IDS } from '@/ai/model-metadata';
import { groq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { getTherapySystemPrompt } from '@/features/therapy/lib/therapy-prompts';
import { streamChatCompletion } from '@/features/chat/lib/streaming';
import { normalizeChatRequest, buildForwardedMessages } from '@/features/chat/lib/chat-request';
import { selectModelAndTools } from '@/features/chat/lib/model-selector';
import { extractBYOKKey, BYOK_OPENAI_MODEL } from '@/features/chat/lib/byok-helper';
import { logger } from '@/lib/utils/logger';
import {
  withAuthAndRateLimitStreaming,
  type AuthenticatedRequestContext,
} from '@/lib/api/api-middleware';
import { createErrorResponse } from '@/lib/api/api-response';
import { env } from '@/config/env';
import { ChatError, MessageValidationError, getChatErrorResponse } from '@/lib/errors/chat-errors';

import type { ConvexHttpClient } from 'convex/browser';
import { getAuthenticatedConvexClient, anyApi } from '@/lib/convex/http-client';
import { verifySessionOwnership } from '@/lib/repositories/session-repository';
import { recordModelUsage } from '@/lib/metrics/metrics';
import {
  appendWithLimit as appendWithLimitUtil,
  teeAndPersistStream as teeAndPersistStreamUtil,
  persistFromClonedStream as persistFromClonedStreamUtil,
  attachResponseHeadersRaw as attachResponseHeadersRawUtil,
} from '@/features/chat/lib/stream-utils';
import { AssistantResponseCollector } from '@/features/chat/lib/assistant-response-collector';
import { readJsonBody } from '@/lib/api/request';
import type { SessionOwnershipResult, SessionWithMessages } from '@/types/database';
import type { ConvexMessage } from '@/types/convex';

type ApiChatMessage = { role: 'user' | 'assistant'; content: string; id?: string };
const MAX_ASSISTANT_RESPONSE_CHARS = env.CHAT_RESPONSE_MAX_CHARS;

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type SessionOwnership = SessionOwnershipResult;

// Stream types and helpers are imported from stream-utils

// moved AssistantResponseCollector to lib/chat/assistant-response-collector

export const POST = withAuthAndRateLimitStreaming(async (req: NextRequest, context) => {
  try {
    const convex = getAuthenticatedConvexClient(context.jwtToken);
    // Validate Content-Type header
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: 'Content-Type must be application/json',
          requestId: context.requestId,
        }),
        {
          status: 415,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const parsedBody = await readJsonBody(req);
    const maxSize = env.CHAT_INPUT_MAX_BYTES;
    if (parsedBody.size > maxSize)
      return createErrorResponse('Request too large', 413, { requestId: context.requestId });

    const input = parsedBody.body;
    const raw = input as {
      sessionId?: string;
      messages?: Array<{
        role?: string;
        content?: unknown;
        parts?: Array<{ type?: string; text?: unknown }>;
      }>;
      message?: unknown;
      selectedModel?: string;
      webSearchEnabled?: boolean;
      byokKey?: string;
    };
    const firstUser = Array.isArray(raw?.messages)
      ? raw.messages.find((m) => m?.role === 'user')
      : undefined;
    const normalized = normalizeChatRequest({
      sessionId: raw?.sessionId,
      message:
        typeof raw?.message === 'string' && raw.message.length > 0
          ? raw.message
          : typeof firstUser?.content === 'string'
            ? firstUser.content
            : Array.isArray(firstUser?.parts)
              ? firstUser!.parts
                  .map((p) => (p && p.type === 'text' && typeof p.text === 'string' ? p.text : ''))
                  .join('')
              : '',
      model: raw?.selectedModel,
      context: undefined,
      tools: undefined,
    });
    if (!normalized.success) {
      const validationError = new MessageValidationError(normalized.error, {
        endpoint: '/api/chat',
        requestId: context.requestId,
      });
      const errorResponse = getChatErrorResponse(validationError);
      return createErrorResponse(errorResponse.message, errorResponse.statusCode, {
        code: errorResponse.code,
        details: errorResponse.details,
        suggestedAction: errorResponse.suggestedAction,
        requestId: context.requestId,
      });
    }

    const providedSessionId = normalized.data.sessionId;
    const ownership = await resolveSessionOwnership(
      providedSessionId,
      context.principal.clerkId,
      convex
    );
    const history =
      providedSessionId && ownership.valid
        ? await loadSessionHistory(providedSessionId, ownership, convex)
        : [];
    // Prefer forwarding original payload messages (with ids) when available; otherwise build from normalized
    const payloadMessages = Array.isArray(raw?.messages) ? raw.messages : null;
    const forwarded = buildForwardedMessages(payloadMessages, normalized.data.message);

    // Check if user has provided their own API key (BYOK) - check early to affect model selection
    const byokApiKey = extractBYOKKey(req.headers);

    logger.info('BYOK header check', {
      apiEndpoint: '/api/chat',
      requestId: context.requestId,
      hasByokKey: Boolean(byokApiKey),
    });

    // When BYOK is active, we override the model and disable web search (Groq-specific feature)
    const webSearchRequested = Boolean(raw?.webSearchEnabled);
    const effectiveWebSearch = byokApiKey ? false : webSearchRequested;

    const decision = selectModelAndTools({
      message: normalized.data.message,
      preferredModel: normalized.data.model,
      webSearchEnabled: effectiveWebSearch,
    });

    // Determine which model to use
    let effectiveModelId: string;
    let modelToUse;
    let hasWebSearch: boolean;
    let toolChoiceHeader: string;

    if (byokApiKey) {
      // BYOK mode: Use user's OpenAI key
      const userOpenAI = createOpenAI({ apiKey: byokApiKey });
      modelToUse = userOpenAI(BYOK_OPENAI_MODEL);
      effectiveModelId = MODEL_IDS.byok;
      hasWebSearch = false; // Web search is Groq-specific, not available with BYOK
      toolChoiceHeader = 'none';

      logger.info('BYOK mode active', {
        apiEndpoint: '/api/chat',
        requestId: context.requestId,
        effectiveModelId,
        webSearchDisabled: webSearchRequested, // Log if user wanted web search but it was disabled
      });
    } else {
      // Standard mode: Use system models
      const modelId = decision.model;
      effectiveModelId = modelId;
      modelToUse = languageModels[modelId as ModelID];
      hasWebSearch = decision.tools.includes('web-search');
      toolChoiceHeader = hasWebSearch ? 'auto' : 'none';
    }

    logger.info('Model selection for chat request', {
      apiEndpoint: '/api/chat',
      requestId: context.requestId,
      modelId: effectiveModelId,
      toolChoice: toolChoiceHeader,
      webSearchEnabled: hasWebSearch,
      byokActive: Boolean(byokApiKey),
    });

    const systemPrompt = await buildSystemPrompt(req, hasWebSearch);
    try {
      recordModelUsage(effectiveModelId, toolChoiceHeader);
    } catch {}
    const toUiMessages = (messages: ApiChatMessage[]): Array<Omit<UIMessage, 'id'>> =>
      messages.map((message) => ({
        role: message.role,
        parts: [{ type: 'text', text: message.content }],
      }));

    const uiMessages: Array<Omit<UIMessage, 'id'>> = [
      ...toUiMessages(history),
      ...toUiMessages(forwarded),
    ];

    const modelMessages = await convertToModelMessages(uiMessages);

    const streamResultPromise = streamChatCompletion({
      model: modelToUse,
      system: systemPrompt,
      messages: modelMessages,
      telemetry: { metadata: { requestId: context.requestId } },
      ...(hasWebSearch
        ? {
            tools: {
              browser_search: tool({
                ...groq.tools.browserSearch({}),
                strict: true,
              }),
            },
            toolChoice: 'auto' as const,
          }
        : {}),
    });

    const collector = new AssistantResponseCollector(
      providedSessionId,
      ownership,
      effectiveModelId,
      context.requestId,
      MAX_ASSISTANT_RESPONSE_CHARS,
      appendWithLimitUtil,
      convex
    );
    const streamResult = await streamResultPromise;

    let resolvedModelId = effectiveModelId;
    const updateResolvedModel = (candidate?: string) => {
      if (typeof candidate !== 'string' || candidate.length === 0) return;
      if (candidate === resolvedModelId) return;
      resolvedModelId = candidate;
      collector.setModelId(candidate);
    };

    const uiResponse = streamResult.toUIMessageStreamResponse({
      onError: createStreamErrorHandler({
        context,
        systemPrompt,
        modelId: effectiveModelId,
        webSearchEnabled: hasWebSearch,
      }),
      messageMetadata: ({ part }) => {
        const partType = (part as { type?: string }).type;
        if (partType === 'response-metadata') {
          const metadataPart = part as unknown as { type: 'response-metadata'; modelId?: string };
          updateResolvedModel(metadataPart.modelId);
          return { modelId: resolvedModelId };
        }
        if (partType === 'start' || partType === 'finish') {
          return { modelId: resolvedModelId };
        }
        return undefined;
      },
    });

    // AI SDK v6: streamResult.response may be a Promise or direct value depending on stream state.
    // Wrapping with Promise.resolve() ensures consistent async handling for both cases.
    Promise.resolve(streamResult.response)
      .then((responseMeta) => {
        updateResolvedModel(responseMeta?.modelId);
      })
      .catch((error: unknown) => {
        logger.warn('Failed to resolve final model metadata for stream', {
          apiEndpoint: '/api/chat',
          requestId: context.requestId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    if (!normalized.data.sessionId) {
      attachResponseHeaders(
        uiResponse as Response,
        context.requestId,
        effectiveModelId,
        toolChoiceHeader
      );
      return uiResponse as Response;
    }

    // Abort handling: if client disconnects, reader will error; we also hook into "abort" events
    if (
      'body' in uiResponse &&
      (uiResponse as Response).body &&
      typeof (uiResponse as Response).body!.tee === 'function'
    ) {
      const responseWithHeaders = await teeAndPersistStreamUtil(
        uiResponse as Response,
        collector,
        context.requestId,
        effectiveModelId,
        toolChoiceHeader
      );
      if (responseWithHeaders) return responseWithHeaders;
    }

    await persistFromClonedStreamUtil(uiResponse as Response, collector);
    attachResponseHeaders(
      uiResponse as Response,
      context.requestId,
      effectiveModelId,
      toolChoiceHeader
    );
    return uiResponse as Response;
  } catch (error) {
    // Use ChatError response system for consistent error handling
    const chatErrorResponse = getChatErrorResponse(error);

    // Log with full context
    if (error instanceof ChatError) {
      logger.error('Chat error occurred', {
        apiEndpoint: '/api/chat',
        requestId: context.requestId,
        errorCode: error.code,
        errorName: error.name,
        userMessage: error.userMessage,
        context: error.context,
      });
    } else {
      logger.apiError('/api/chat', error as Error, {
        apiEndpoint: '/api/chat',
        requestId: context.requestId,
      });
    }

    return createErrorResponse(chatErrorResponse.message, chatErrorResponse.statusCode, {
      code: chatErrorResponse.code,
      details: chatErrorResponse.details,
      suggestedAction: chatErrorResponse.suggestedAction,
      requestId: context.requestId,
    });
  }
});

async function resolveSessionOwnership(
  sessionId: string | undefined,
  userId: string,
  client: ConvexHttpClient
) {
  if (!sessionId) return { valid: false } as SessionOwnership;
  return verifySessionOwnership(sessionId, userId, { includeMessages: true }, client);
}

async function loadSessionHistory(
  sessionId: string,
  ownership: SessionOwnership,
  client: ConvexHttpClient
): Promise<ApiChatMessage[]> {
  const HISTORY_LIMIT = 30;
  const sessionWithMessages: SessionWithMessages | undefined =
    ownership.session && 'messages' in ownership.session
      ? (ownership.session as SessionWithMessages)
      : undefined;

  const sessionMessagesRaw =
    sessionWithMessages?.messages ??
    (await (async () => {
      const all = (await client.query(anyApi.messages.listBySession, {
        sessionId,
      })) as ConvexMessage[];
      return Array.isArray(all) ? all : [];
    })());

  const sessionMessages = sessionMessagesRaw
    .map((message) => ({
      id: 'id' in message ? ((message as { id?: string }).id ?? message._id) : message._id,
      role: message.role,
      content: message.content,
      timestamp: new Date(
        typeof message.timestamp === 'number'
          ? message.timestamp
          : new Date(message.timestamp).getTime()
      ),
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-HISTORY_LIMIT);

  const { safeDecryptMessages } = await import('@/features/chat/lib/message-encryption');
  const decrypted = safeDecryptMessages(
    sessionMessages.map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    }))
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
  const directive =
    locale === 'nl'
      ? 'TAALBELEID: Antwoord uitsluitend in natuurlijk Nederlands. Als de app‑taal wijzigt of de gebruiker daarom vraagt, schakel direct over en ga verder in die taal; bevestig de wijziging éénmaal.'
      : 'LANGUAGE POLICY: Respond exclusively in natural English. If the app locale changes or the user requests a language change, switch immediately and continue in that language; acknowledge the change once.';
  return `${directive}\n\n${base}`;
}

function createStreamErrorHandler(params: {
  context: Pick<AuthenticatedRequestContext, 'requestId' | 'principal'>;
  systemPrompt: string;
  modelId: string;
  webSearchEnabled: boolean;
}) {
  const { context, systemPrompt, modelId, webSearchEnabled } = params;
  return (error: unknown) => {
    const errorContext = {
      apiEndpoint: '/api/chat',
      requestId: context.requestId,
      userId: context.principal.clerkId,
      webSearchEnabled,
      modelId,
    };

    // Handle rate limit errors
    if (error instanceof Error && error.message.includes('Rate limit')) {
      logger.warn('Rate limit exceeded in chat stream', {
        ...errorContext,
        errorType: 'rate_limit',
      });
      return 'I received too many requests. Please wait a moment and try again.';
    }

    // Handle tool choice conflicts (web search configuration issues)
    if (error instanceof Error) {
      const lower = error.message.toLowerCase();

      if (
        lower.includes('tool choice is none, but model called a tool') ||
        lower.includes('tool choice is required, but model did not call a tool')
      ) {
        logger.error('Tool choice conflict in chat stream', {
          ...errorContext,
          errorMessage: error.message,
          promptIncludes: systemPrompt.includes('WEB SEARCH CAPABILITIES ACTIVE'),
          errorType: 'tool_choice_conflict',
        });
        return 'I encountered a configuration issue. Let me try again without additional tools.';
      }

      // Handle web search/tool errors
      if (
        lower.includes('browser_search') ||
        lower.includes('web search') ||
        lower.includes('tool')
      ) {
        logger.error('Web search tool error in chat stream', {
          ...errorContext,
          errorMessage: error.message,
          errorType: 'web_search_error',
        });
        return 'I encountered an issue with web search functionality. Let me help you with the information I have available.';
      }

      // Handle AI service errors
      if (lower.includes('unavailable') || lower.includes('timeout') || lower.includes('service')) {
        logger.error('AI service error in chat stream', {
          ...errorContext,
          errorMessage: error.message,
          errorType: 'ai_service_error',
        });
        return 'The AI service is temporarily unavailable. Please try again in a few moments.';
      }
    }

    // Fallback error handling
    try {
      const detail =
        typeof error === 'object'
          ? JSON.stringify(error as Record<string, unknown>)
          : String(error);
      logger.error('Unhandled chat stream error', { ...errorContext, detail });
    } catch {
      logger.error(
        'Unhandled chat stream error',
        errorContext,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
  };
}

function attachResponseHeaders(
  response: Response,
  requestId: string,
  modelId: string,
  toolChoice: string
) {
  try {
    attachResponseHeadersRawUtil(response.headers, requestId, modelId, toolChoice);
  } catch {
    // ignore header failures
  }
}
