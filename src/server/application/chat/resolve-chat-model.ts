import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { languageModels, ModelID } from '@/ai/providers';
import { MODEL_IDS } from '@/ai/model-metadata';
import { selectModelAndTools } from '@/features/chat/lib/model-selector';
import { extractBYOKKey, BYOK_OPENAI_MODEL } from '@/features/chat/lib/byok-helper';
import { streamChatCompletion } from '@/features/chat/lib/streaming';
import { logger } from '@/lib/utils/logger';

type ChatStreamModel = Parameters<typeof streamChatCompletion>[0]['model'];

export interface ResolvedChatModel {
  modelToUse: ChatStreamModel;
  effectiveModelId: string;
  hasWebSearch: boolean;
  toolChoiceHeader: 'auto' | 'none';
}

export function resolveChatModel(params: {
  request: NextRequest;
  requestId: string;
  message: string;
  preferredModel?: string;
  webSearchRequested: boolean;
}): ResolvedChatModel {
  const { request, requestId, message, preferredModel, webSearchRequested } = params;

  const byokApiKey = extractBYOKKey(request.headers);
  logger.info('BYOK header check', {
    apiEndpoint: '/api/chat',
    requestId,
    hasByokKey: Boolean(byokApiKey),
  });

  const effectiveWebSearch = byokApiKey ? false : webSearchRequested;
  const decision = selectModelAndTools({
    message,
    preferredModel,
    webSearchEnabled: effectiveWebSearch,
  });

  if (byokApiKey) {
    const userOpenAI = createOpenAI({ apiKey: byokApiKey });
    const byokModel = userOpenAI(BYOK_OPENAI_MODEL);

    logger.info('BYOK mode active', {
      apiEndpoint: '/api/chat',
      requestId,
      effectiveModelId: MODEL_IDS.byok,
      webSearchDisabled: webSearchRequested,
    });

    return {
      modelToUse: byokModel,
      effectiveModelId: MODEL_IDS.byok,
      hasWebSearch: false,
      toolChoiceHeader: 'none',
    };
  }

  const modelId = decision.model;
  const modelToUse = languageModels[modelId as ModelID];
  const hasWebSearch = decision.tools.includes('web-search');
  const toolChoiceHeader = hasWebSearch ? 'auto' : 'none';

  return {
    modelToUse,
    effectiveModelId: modelId,
    hasWebSearch,
    toolChoiceHeader,
  };
}
