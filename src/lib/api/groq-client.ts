import { generateText, streamText } from 'ai';
import { groq } from "@ai-sdk/groq";
import { languageModels } from '@/ai/providers';

// Simplified message type for report generation (only needs role and content)
export interface ReportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const generateSessionReport = async (messages: ReportMessage[], systemPrompt: string, selectedModel: string = 'openai/gpt-oss-120b') => {
  const userPrompt = `Please generate a therapeutic session report based on the following conversation:\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`;

  const result = await generateText({
    model: languageModels[selectedModel as keyof typeof languageModels],
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
    topP: 0.9,
  });

  return result.text;
};

export const extractStructuredAnalysis = async (reportContent: string, systemPrompt: string, selectedModel: string = 'openai/gpt-oss-120b') => {
  const userPrompt = `Please extract structured analysis data from the following therapeutic report:\n\n${reportContent}`;
  
  const result = await generateText({
    model: languageModels[selectedModel as keyof typeof languageModels],
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.1, // Lower temperature for more consistent JSON output
    topP: 0.8,
  });

  return result.text;
};

// Browser search function using direct Groq integration
export const streamTextWithBrowserSearch = async (
  messages: AIMessage[],
  systemPrompt: string,
  modelId: string = 'openai/gpt-oss-120b'
) => {
  // Ensure we're using a supported model for browser search
  if (modelId !== 'openai/gpt-oss-120b') {
    throw new Error('Browser search is only supported with openai/gpt-oss-120b model');
  }

  try {
    // Use direct Groq model instance with browser search tool
    const result = streamText({
      model: languageModels[modelId as keyof typeof languageModels],
      system: systemPrompt,
      messages: messages,
      tools: {
        browser_search: groq.tools.browserSearch({}),
      },
      toolChoice: 'auto', // Let the model decide when to use web search
      experimental_telemetry: { isEnabled: false },
    });

    return result;
  } catch (error) {
    console.error('Browser search failed:', error);
    
    // Fallback: Use regular text generation without browser search
    const fallbackResult = streamText({
      model: languageModels[modelId as keyof typeof languageModels],
      system: systemPrompt,
      messages: messages,
      experimental_telemetry: { isEnabled: false },
    });
    
    return fallbackResult;
  }
};