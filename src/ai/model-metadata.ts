export const MODEL_IDS = {
  default: 'openai/gpt-oss-20b',
  analytical: 'openai/gpt-oss-120b',
  local: 'ollama/gemma3:4b',
} as const;

export type ModelIdentifier = (typeof MODEL_IDS)[keyof typeof MODEL_IDS];

const MODEL_DISPLAY_NAMES: Record<ModelIdentifier, string> = {
  [MODEL_IDS.default]: 'GPT OSS 20B',
  [MODEL_IDS.analytical]: 'GPT OSS 120B',
  [MODEL_IDS.local]: 'Local Gemma 3 4B',
};

const WEB_SEARCH_MODELS = new Set<ModelIdentifier>([MODEL_IDS.analytical]);

export function getModelDisplayName(modelId: string): string {
  return MODEL_DISPLAY_NAMES[modelId as ModelIdentifier] ?? (modelId.split('/').pop() ?? modelId);
}

export function supportsWebSearch(modelId: string): boolean {
  return WEB_SEARCH_MODELS.has(modelId as ModelIdentifier);
}
