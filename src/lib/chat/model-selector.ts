export interface ModelDecision {
  model: string;
  tools: string[];
}

import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID } from '@/features/chat/config';
import { languageModels, MODELS as REGISTERED_MODELS, type ModelID } from '@/ai/providers';
import { logger } from '@/lib/utils/logger';

const discoveredModels = Array.isArray(REGISTERED_MODELS) && REGISTERED_MODELS.length > 0
  ? REGISTERED_MODELS
  : (Object.keys(languageModels) as ModelID[]);

const AVAILABLE_MODELS = new Set<ModelID>(discoveredModels);

export function selectModelAndTools(input: { message: string; preferredModel?: string; webSearchEnabled?: boolean }): ModelDecision {
  const tools: string[] = [];
  let model: ModelID = DEFAULT_MODEL_ID;

  const requestedModel = input.preferredModel as ModelID | undefined;
  if (requestedModel) {
    if (AVAILABLE_MODELS.has(requestedModel)) {
      model = requestedModel;
    } else {
      logger.warn('Unknown preferred chat model requested, falling back to default', {
        preferredModel: input.preferredModel,
        availableModels: Array.from(AVAILABLE_MODELS),
      });
    }
  }

  if (input.webSearchEnabled) {
    tools.push('web-search');
    model = ANALYTICAL_MODEL_ID;
  }
  if (/analy(s|z)e|cbt|schema|plan|report/i.test(input.message)) {
    model = ANALYTICAL_MODEL_ID;
  }
  if (!AVAILABLE_MODELS.has(model)) {
    if (Object.prototype.hasOwnProperty.call(languageModels, model)) {
      AVAILABLE_MODELS.add(model);
    }
  }

  if (!AVAILABLE_MODELS.has(model)) {
    logger.warn('Selected chat model not available, reverting to default', {
      selectedModel: model,
      fallbackModel: DEFAULT_MODEL_ID,
    });
    model = DEFAULT_MODEL_ID;
  }
  return { model, tools };
}
