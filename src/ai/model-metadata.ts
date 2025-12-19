export const MODEL_IDS = {
  // System models (Groq-based)
  default: 'openai/gpt-oss-20b',
  analytical: 'openai/gpt-oss-120b',
  local: 'ollama/gemma3:4b',
  // BYOK model (user's own OpenAI key)
  byok: 'openai/gpt-5-mini',
} as const;

export type ModelIdentifier = (typeof MODEL_IDS)[keyof typeof MODEL_IDS];

/** System model keys (excluding BYOK) */
export const SYSTEM_MODEL_KEYS = ['default', 'analytical', 'local'] as const;

/** BYOK model key */
export const BYOK_MODEL_KEY = 'byok' as const;

/** Type for system model keys */
export type SystemModelKey = (typeof SYSTEM_MODEL_KEYS)[number];

/** Type for system model identifiers (values) */
export type SystemModelIdentifier = (typeof MODEL_IDS)[SystemModelKey];

/**
 * Check if a model ID is the BYOK model
 */
export function isBYOKModel(modelId: string): boolean {
  return modelId === MODEL_IDS.byok;
}

/**
 * Get the provider name for a given model ID
 */
export function getProviderForModel(modelId: string): string | null {
  if (modelId.startsWith('openai/')) return 'openai';
  if (modelId.startsWith('ollama/')) return 'ollama';
  return null;
}

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  [MODEL_IDS.default]: 'GPT OSS 20B',
  [MODEL_IDS.analytical]: 'GPT OSS 120B',
  [MODEL_IDS.local]: 'Local Gemma 3 4B',
  [MODEL_IDS.byok]: 'GPT-5 Mini',
};

const WEB_SEARCH_MODELS = new Set<ModelIdentifier>([MODEL_IDS.analytical]);

export function getModelDisplayName(modelId: string): string {
  return MODEL_DISPLAY_NAMES[modelId] ?? modelId.split('/').pop() ?? modelId;
}

export function supportsWebSearch(modelId: string): boolean {
  return WEB_SEARCH_MODELS.has(modelId as ModelIdentifier);
}
