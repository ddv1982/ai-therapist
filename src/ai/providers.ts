import { groq } from "@ai-sdk/groq";
import { customProvider } from "ai";

// Define the language models available through Groq
export const languageModels = {
  "openai/gpt-oss-20b": groq("openai/gpt-oss-20b"),
  "openai/gpt-oss-120b": groq("openai/gpt-oss-120b"),
};

// Model display names for UI
export const models = {
  "openai/gpt-oss-20b": { 
    displayName: "GPT OSS 20B", 
    description: "Fast model for regular conversation",
    contextWindow: 32768,
    supportsWebSearch: false
  },
  "openai/gpt-oss-120b": { 
    displayName: "GPT OSS 120B", 
    description: "Advanced model with web search and deep reasoning",
    contextWindow: 32768,
    supportsWebSearch: true
  },
};

// Create custom provider for therapeutic AI
export const model = customProvider({
  languageModels,
});

// TypeScript types for model IDs
export type ModelID = keyof typeof languageModels;

// Available model keys for iteration
export const MODELS = Object.keys(languageModels) as ModelID[];

// Default model for new sessions
export const defaultModel: ModelID = "openai/gpt-oss-20b";

// Legacy compatibility
export const DEFAULT_CHAT_MODEL = defaultModel;

// Helper functions for model capabilities
export function supportsWebSearch(modelId: ModelID): boolean {
  return models[modelId]?.supportsWebSearch || false;
}

export function getModelDisplayName(modelId: ModelID): string {
  return models[modelId]?.displayName || modelId;
}

export function getModelDescription(modelId: ModelID): string {
  return models[modelId]?.description || "";
}

export function getContextWindow(modelId: ModelID): number {
  return models[modelId]?.contextWindow || 32768;
}