export const MODEL_IDS = {
  default: 'openai/gpt-oss-20b',
  analytical: 'openai/gpt-oss-120b',
  local: 'ollama/llama3.1:8b',
} as const;

export type ModelIdentifier = typeof MODEL_IDS[keyof typeof MODEL_IDS];

export interface ModelMetadata {
  displayName: string;
  description: string;
  supportsWebSearch: boolean;
}

const metadata: Record<ModelIdentifier, ModelMetadata> = {
  [MODEL_IDS.default]: {
    displayName: 'GPT OSS 20B',
    description: 'Fast model for regular conversation',
    supportsWebSearch: false,
  },
  [MODEL_IDS.analytical]: {
    displayName: 'GPT OSS 120B',
    description: 'Advanced model with web search and deep reasoning',
    supportsWebSearch: true,
  },
  [MODEL_IDS.local]: {
    displayName: 'Local Llama 3.1 8B',
    description: 'Local, private incognito mode via Ollama',
    supportsWebSearch: false,
  },
};

export const MODEL_METADATA = metadata;

export const MODEL_METADATA_KEYS = Object.keys(MODEL_METADATA) as ModelIdentifier[];

const MODEL_ALIAS_MAP: Record<string, ModelIdentifier> = (() => {
  const map: Record<string, ModelIdentifier> = {};
  for (const key of MODEL_METADATA_KEYS) {
    const lower = key.toLowerCase();
    map[lower] = key;
    const suffixIndex = lower.lastIndexOf('/');
    const suffix = suffixIndex >= 0 ? lower.slice(suffixIndex + 1) : lower;
    map[suffix] = key;
  }
  // Manual aliases for common shorthand variations
  map['llama3.1-8b'] = MODEL_IDS.local;
  map['llama3-8b'] = MODEL_IDS.local;
  map['llama3.1:8b'] = MODEL_IDS.local;
  map['ollama/llama3.1-8b'] = MODEL_IDS.local;
  map['ollama/llama3-8b'] = MODEL_IDS.local;
  map['ollama/llama3.1:8b'] = MODEL_IDS.local;
  // Legacy aliases for previous local models
  map['gemma3:4b'] = MODEL_IDS.local;
  map['gemma3-4b'] = MODEL_IDS.local;
  map['ollama/gemma3-4b'] = MODEL_IDS.local;
  map['ollama/gemma3:4b'] = MODEL_IDS.local;
  return map;
})();

export function resolveModelIdentifier(modelId: string | null | undefined): ModelIdentifier | undefined {
  if (!modelId) return undefined;
  const lower = modelId.toLowerCase();
  return MODEL_ALIAS_MAP[lower] ?? MODEL_ALIAS_MAP[lower.replace(/^[^/]+\//, '')];
}

export function isKnownModelId(modelId: string): modelId is ModelIdentifier {
  return Object.prototype.hasOwnProperty.call(MODEL_METADATA, modelId);
}

export function getModelDisplayName(modelId: string): string {
  const resolved = resolveModelIdentifier(modelId);
  if (resolved) return MODEL_METADATA[resolved].displayName;
  const trimmed = modelId.includes('/') ? modelId.split('/').pop() ?? modelId : modelId;
  return trimmed;
}

export function getModelDescription(modelId: string): string {
  const resolved = resolveModelIdentifier(modelId);
  return resolved ? MODEL_METADATA[resolved].description : '';
}

export function supportsWebSearch(modelId: string): boolean {
  const resolved = resolveModelIdentifier(modelId);
  return resolved ? MODEL_METADATA[resolved].supportsWebSearch : false;
}

export function getContextWindow(_modelId: string): number | undefined {
  return undefined;
}
