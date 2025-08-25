// Utility functions for determining web search capabilities
// Note: Web search is now handled natively by the AI SDK's Groq provider
// using groq.tools.browserSearch() in the API route

// Helper to determine if a model supports web search
export function supportsWebSearch(modelId: string): boolean {
  // Currently only the 120B model supports browser search via Groq
  return modelId === "openai/gpt-oss-120b";
}

// Helper to determine if web search should be enabled for a request
export function shouldEnableWebSearch(modelId: string, webSearchEnabled: boolean = false): boolean {
  return supportsWebSearch(modelId) && webSearchEnabled;
}