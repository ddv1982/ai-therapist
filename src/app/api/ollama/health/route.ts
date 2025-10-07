import { withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { checkOllamaAvailability } from '@/ai/providers';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';

export const GET = withAuthAndRateLimit(async (_request, context) => {
  try {
    const result = await checkOllamaAvailability();

    return createSuccessResponse(result, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('Failed to check Ollama health', error as Error, {
      endpoint: '/api/ollama/health',
      requestId: context.requestId,
    });
    return createErrorResponse('Failed to verify Ollama availability', 500, {
      code: 'OLLAMA_HEALTH_ERROR',
      requestId: context.requestId,
    });
  }
});
