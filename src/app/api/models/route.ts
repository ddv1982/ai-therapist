import { NextRequest } from 'next/server';
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
export const GET = async (_request: NextRequest) => {
  try {
    const availableModels: ModelInfo[] = [
      {
        id: 'openai/gpt-oss-20b',
        name: 'GPT OSS 20B (Fast)',
        provider: 'OpenAI',
        maxTokens: 30000,
        category: 'production',
        description: 'Fast model for regular conversations'
      },
      {
        id: 'openai/gpt-oss-120b',
        name: 'GPT OSS 120B (Deep Analysis)',
        provider: 'OpenAI',
        maxTokens: 30000,
        category: 'featured',
        description: 'Advanced model for CBT analysis and session reports'
      }
    ];

    const response: ModelsResponse = {
      models: availableModels,
      total: availableModels.length,
      note: 'Models are now automatically selected based on content type'
    };

    return createSuccessResponse(response, { requestId: 'models-request' });
  } catch (error) {
    return createServerErrorResponse(
      error as Error,
      'models-request',
      { endpoint: '/api/models' }
    );
  }
};