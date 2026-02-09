import { NextRequest } from 'next/server';
import { MODEL_IDS } from '@/ai/model-metadata';
import { buildForwardedMessages } from '@/features/chat/lib/chat-request';
import { logger } from '@/lib/utils/logger';
import type { AuthenticatedRequestContext } from '@/lib/api/api-middleware';
import { createErrorResponse } from '@/lib/api/api-response';
import { ChatError, getChatErrorResponse } from '@/lib/errors/chat-errors';
import { getAuthenticatedConvexClient } from '@/lib/convex/http-client';
import { parseAndValidateChatRequest } from '@/server/application/chat/parse-and-validate-chat-request';
import { resolveChatModel } from '@/server/application/chat/resolve-chat-model';
import {
  resolveSessionOwnership,
  loadSessionHistory,
} from '@/server/application/chat/load-chat-history';
import { buildChatStreamResponse } from '@/server/application/chat/build-chat-stream';

export async function handleChatPost(
  request: NextRequest,
  context: AuthenticatedRequestContext
): Promise<Response> {
  try {
    const convex = getAuthenticatedConvexClient(context.jwtToken);

    const parseResult = await parseAndValidateChatRequest(request, context);
    if ('response' in parseResult) {
      return parseResult.response;
    }

    const { parsed } = parseResult;

    const ownership = await resolveSessionOwnership(
      parsed.providedSessionId,
      context.principal.clerkId,
      convex
    );

    const history =
      parsed.providedSessionId && ownership.valid
        ? await loadSessionHistory(parsed.providedSessionId, ownership, convex)
        : [];

    const forwarded = buildForwardedMessages(parsed.payloadMessages, parsed.normalized.message);

    const resolvedModel = resolveChatModel({
      request,
      requestId: context.requestId,
      message: parsed.normalized.message,
      preferredModel: parsed.normalized.model,
      webSearchRequested: parsed.webSearchRequested,
    });

    logger.info('Model selection for chat request', {
      apiEndpoint: '/api/chat',
      requestId: context.requestId,
      modelId: resolvedModel.effectiveModelId,
      toolChoice: resolvedModel.toolChoiceHeader,
      webSearchEnabled: resolvedModel.hasWebSearch,
      byokActive: resolvedModel.effectiveModelId === MODEL_IDS.byok,
    });

    return await buildChatStreamResponse({
      request,
      context,
      convex,
      providedSessionId: parsed.providedSessionId,
      ownership,
      history,
      forwarded,
      modelToUse: resolvedModel.modelToUse,
      effectiveModelId: resolvedModel.effectiveModelId,
      hasWebSearch: resolvedModel.hasWebSearch,
      toolChoiceHeader: resolvedModel.toolChoiceHeader,
    });
  } catch (error) {
    const chatErrorResponse = getChatErrorResponse(error);

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
}
