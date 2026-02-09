import { NextRequest } from 'next/server';
import { normalizeChatRequest } from '@/features/chat/lib/chat-request';
import { readJsonBody } from '@/lib/api/request';
import { createErrorResponse } from '@/lib/api/api-response';
import { MessageValidationError, getChatErrorResponse } from '@/lib/errors/chat-errors';
import { ErrorCode } from '@/lib/errors/error-codes';
import { env } from '@/config/env';
import type { AuthenticatedRequestContext } from '@/lib/api/api-middleware';

type RawPayloadMessage = {
  role?: string;
  content?: unknown;
  parts?: Array<{ type?: string; text?: unknown }>;
  id?: unknown;
};

interface RawChatPayload {
  sessionId?: string;
  messages?: RawPayloadMessage[];
  message?: unknown;
  selectedModel?: string;
  webSearchEnabled?: boolean;
  byokKey?: string;
}

export interface ParsedChatRequest {
  raw: RawChatPayload;
  payloadMessages: RawPayloadMessage[] | null;
  providedSessionId?: string;
  webSearchRequested: boolean;
  normalized: {
    sessionId?: string;
    message: string;
    model: string;
  };
}

export async function parseAndValidateChatRequest(
  request: NextRequest,
  context: Pick<AuthenticatedRequestContext, 'requestId'>
): Promise<{ response: Response } | { parsed: ParsedChatRequest }> {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {
      response: createErrorResponse('Content-Type must be application/json', 415, {
        code: ErrorCode.INVALID_INPUT,
        details: 'Expected request header content-type: application/json',
        suggestedAction: 'Set Content-Type to application/json and retry',
        requestId: context.requestId,
      }),
    };
  }

  const parsedBody = await readJsonBody(request);
  if (parsedBody.size > env.CHAT_INPUT_MAX_BYTES) {
    return {
      response: createErrorResponse('Request too large', 413, {
        requestId: context.requestId,
      }),
    };
  }

  const raw = (parsedBody.body ?? {}) as RawChatPayload;
  const firstUser = Array.isArray(raw.messages)
    ? raw.messages.find((message) => message?.role === 'user')
    : undefined;

  const normalized = normalizeChatRequest({
    sessionId: raw.sessionId,
    message:
      typeof raw.message === 'string' && raw.message.length > 0
        ? raw.message
        : typeof firstUser?.content === 'string'
          ? firstUser.content
          : Array.isArray(firstUser?.parts)
            ? firstUser.parts
                .map((part) =>
                  part && part.type === 'text' && typeof part.text === 'string' ? part.text : ''
                )
                .join('')
            : '',
    model: raw.selectedModel,
    context: undefined,
    tools: undefined,
  });

  if (!normalized.success) {
    const validationError = new MessageValidationError(normalized.error, {
      endpoint: '/api/chat',
      requestId: context.requestId,
    });
    const errorResponse = getChatErrorResponse(validationError);
    return {
      response: createErrorResponse(errorResponse.message, errorResponse.statusCode, {
        code: errorResponse.code,
        details: errorResponse.details,
        suggestedAction: errorResponse.suggestedAction,
        requestId: context.requestId,
      }),
    };
  }

  return {
    parsed: {
      raw,
      payloadMessages: Array.isArray(raw.messages) ? raw.messages : null,
      providedSessionId: normalized.data.sessionId,
      webSearchRequested: Boolean(raw.webSearchEnabled),
      normalized: {
        sessionId: normalized.data.sessionId,
        message: normalized.data.message,
        model: normalized.data.model,
      },
    },
  };
}
