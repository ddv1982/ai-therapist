import { withApiMiddleware } from '@/lib/api/api-middleware';
import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID } from '@/features/chat/config';
import { getModelDisplayName, supportsWebSearch } from '@/ai/model-metadata';
import { createSuccessResponse, createServerErrorResponse } from '@/lib/api/api-response';

/**
 * Available AI models for therapeutic conversations
 */
interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  category: 'production' | 'featured';
  description: string;
}

interface ModelsResponse {
  models: ModelInfo[];
  total: number;
  note: string;
}

/**
 * GET /api/models - Returns available AI models
 * 
 * @returns {ModelsResponse} List of available models with metadata
 */
export const GET = withApiMiddleware(async (_request, context, _params) => {
  try {
    const ids = [DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID] as const;
    const availableModels: ModelInfo[] = ids.map((id) => ({
      id,
      name: supportsWebSearch(id) ? `${getModelDisplayName(id)} (Deep Analysis)` : getModelDisplayName(id),
      provider: 'OpenAI',
      maxTokens: 30000,
      category: id === ANALYTICAL_MODEL_ID ? 'featured' : 'production',
      description: id === ANALYTICAL_MODEL_ID ? 'Advanced model for CBT analysis and session reports' : 'Fast model for regular conversations'
    }));

    const response: ModelsResponse = {
      models: availableModels,
      total: availableModels.length,
      note: 'Models are now automatically selected based on content type'
    };

    return createSuccessResponse(response, { requestId: context.requestId });
  } catch (error) {
    return createServerErrorResponse(error as Error, context.requestId, { endpoint: '/api/models' });
  }
});