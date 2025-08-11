import { tool } from "ai";
import { z } from "zod";

// Browser search tool for Groq models that support it
export const browserSearchTool = tool({
  description: "Search the web for current information to help answer questions. Use this when you need recent data, current events, or information not in your training data.",
  inputSchema: z.object({
    query: z.string().describe("The search query to find relevant information"),
  }),
  execute: async ({ query }) => {
    // This tool is handled by the Groq API when using models that support browser search
    // The actual search is performed server-side by Groq
    return {
      query,
      note: "Browser search executed by Groq API"
    };
  },
});

// Collection of all available tools
export const therapeuticTools = {
  browserSearch: browserSearchTool,
};

// Helper to get tools based on model capabilities
export function getToolsForModel(modelId: string, webSearchEnabled: boolean = false) {
  const tools: Record<string, typeof browserSearchTool> = {};
  
  // Only add browser search for 120B model when web search is enabled
  if (modelId === "openai/gpt-oss-120b" && webSearchEnabled) {
    tools.browserSearch = browserSearchTool;
  }
  
  return tools;
}