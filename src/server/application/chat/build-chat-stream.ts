import { NextRequest } from 'next/server';
import { convertToModelMessages, tool } from 'ai';
import type { UIMessage } from 'ai';
import { groq } from '@ai-sdk/groq';
import type { ConvexHttpClient } from 'convex/browser';
import { getTherapySystemPrompt } from '@/features/therapy/lib/therapy-prompts';
import { streamChatCompletion } from '@/features/chat/lib/streaming';
import {
  appendWithLimit as appendWithLimitUtil,
  teeAndPersistStream as teeAndPersistStreamUtil,
  persistFromClonedStream as persistFromClonedStreamUtil,
  attachResponseHeadersRaw as attachResponseHeadersRawUtil,
} from '@/features/chat/lib/stream-utils';
import { AssistantResponseCollector } from '@/features/chat/lib/assistant-response-collector';
import { recordModelUsage } from '@/lib/metrics/metrics';
import { logger } from '@/lib/utils/logger';
import { env } from '@/config/env';
import type { AuthenticatedRequestContext } from '@/lib/api/api-middleware';
import type { ApiChatMessage, SessionOwnership } from '@/server/application/chat/load-chat-history';

const MAX_ASSISTANT_RESPONSE_CHARS = env.CHAT_RESPONSE_MAX_CHARS;

type ChatStreamModel = Parameters<typeof streamChatCompletion>[0]['model'];

interface BuildChatStreamParams {
  request: NextRequest;
  context: AuthenticatedRequestContext;
  convex: ConvexHttpClient;
  providedSessionId?: string;
  ownership: SessionOwnership;
  history: ApiChatMessage[];
  forwarded: ApiChatMessage[];
  modelToUse: ChatStreamModel;
  effectiveModelId: string;
  hasWebSearch: boolean;
  toolChoiceHeader: 'auto' | 'none';
}

export async function buildChatStreamResponse(params: BuildChatStreamParams): Promise<Response> {
  const {
    request,
    context,
    convex,
    providedSessionId,
    ownership,
    history,
    forwarded,
    modelToUse,
    effectiveModelId,
    hasWebSearch,
    toolChoiceHeader,
  } = params;

  const systemPrompt = await buildSystemPrompt(request, hasWebSearch);
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

  const streamResult = await streamChatCompletion({
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

  if (!providedSessionId) {
    attachResponseHeaders(
      uiResponse as Response,
      context.requestId,
      effectiveModelId,
      toolChoiceHeader
    );
    return uiResponse as Response;
  }

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
}

async function buildSystemPrompt(request: NextRequest, hasWebSearch: boolean): Promise<string> {
  const { getApiRequestLocale } = await import('@/i18n/request');
  const locale = getApiRequestLocale(request);
  const base = getTherapySystemPrompt(locale, { webSearch: hasWebSearch });
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

    if (error instanceof Error && error.message.includes('Rate limit')) {
      logger.warn('Rate limit exceeded in chat stream', {
        ...errorContext,
        errorType: 'rate_limit',
      });
      return 'I received too many requests. Please wait a moment and try again.';
    }

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

      if (lower.includes('unavailable') || lower.includes('timeout') || lower.includes('service')) {
        logger.error('AI service error in chat stream', {
          ...errorContext,
          errorMessage: error.message,
          errorType: 'ai_service_error',
        });
        return 'The AI service is temporarily unavailable. Please try again in a few moments.';
      }
    }

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
): void {
  try {
    attachResponseHeadersRawUtil(response.headers, requestId, modelId, toolChoice);
  } catch {
    // ignore header failures
  }
}
