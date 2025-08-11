import { groq } from "@ai-sdk/groq";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

export const languageModels = {
  "openai/gpt-oss-20b": groq("openai/gpt-oss-20b"),
  "openai/gpt-oss-120b": groq("openai/gpt-oss-120b"),
};

export const models = {
  "openai/gpt-oss-20b": { displayName: "GPT OSS 20B" },
  "openai/gpt-oss-120b": { displayName: "GPT OSS 120B" },
};

export const model = customProvider({
  languageModels,
});

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);

export const defaultModel: modelID = "openai/gpt-oss-20b";

export const DEFAULT_CHAT_MODEL = defaultModel;

export const myProvider = model;