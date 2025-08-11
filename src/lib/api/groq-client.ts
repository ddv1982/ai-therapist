import { generateText } from 'ai';
import { model } from '@/ai/providers';

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
    model: model.languageModel(selectedModel),
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
    model: model.languageModel(selectedModel),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.1, // Lower temperature for more consistent JSON output
    topP: 0.8,
  });

  return result.text;
};