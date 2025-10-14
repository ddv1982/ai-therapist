import { withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';

const ALLOWED_DEPTH = 2;
const MAX_ARRAY_ITEMS = 5;
const MAX_OBJECT_KEYS = 10;

function sanitizeValue(payload: unknown, depth = 0): unknown {
  if (depth > ALLOWED_DEPTH) return '[truncated]';
  if (payload === null || payload === undefined) return undefined;
  if (typeof payload === 'string') return payload.slice(0, 500);
  if (typeof payload === 'number' || typeof payload === 'boolean') return payload;
  if (Array.isArray(payload)) {
    return payload
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }
  if (typeof payload === 'object') {
    if (Object.prototype.toString.call(payload) !== '[object Object]') {
      return '[unsupported]';
    }
    const entries = Object.entries(payload as Record<string, unknown>)
      .slice(0, MAX_OBJECT_KEYS)
      .map(([key, value]) => [key, sanitizeValue(value, depth + 1)])
      .filter(([, value]) => value !== undefined);
    return Object.fromEntries(entries);
  }
  return undefined;
}

function normalizeErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined;
  const source = payload as Record<string, unknown>;
  return {
    message: typeof source.message === 'string' ? source.message.slice(0, 500) : undefined,
    name: typeof source.name === 'string' ? source.name.slice(0, 120) : undefined,
    stack: typeof source.stack === 'string' ? source.stack.slice(0, 2000) : undefined,
    context: sanitizeValue(source.context),
  };
}

export const POST = withAuthAndRateLimit(async (request, context) => {
  try {
    let parsedPayload: unknown;
    try {
      parsedPayload = await request.json();
    } catch {
      parsedPayload = undefined;
    }

    const errorData = normalizeErrorPayload(parsedPayload);

    logger.error('Client error report', {
      ...context,
      clientErrorData: errorData,
      apiEndpoint: '/api/errors'
    });

    return createSuccessResponse(
      { message: 'Error logged successfully' },
      { requestId: context.requestId }
    );
  } catch (error) {
    logger.apiError('/api/errors', error as Error, context);
    return createErrorResponse('Failed to log error', 500, { requestId: context.requestId });
  }
}, { maxRequests: 120, windowMs: 5 * 60 * 1000 });

export const GET = withAuthAndRateLimit(async (_request, context) => {
  return createSuccessResponse(
    {
      timestamp: new Date().toISOString(),
      status: 'ok'
    },
    { requestId: context.requestId }
  );
}, { maxRequests: 60, windowMs: 5 * 60 * 1000 });