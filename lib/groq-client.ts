import Groq from 'groq-sdk';
import type { Message } from '@/types/chat';

// Simplified message type for report generation (only needs role and content)
export interface ReportMessage {
  role: 'user' | 'assistant';
  content: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const createTherapyCompletion = async (messages: Message[], systemPrompt: string) => {
  const groqMessages: GroqMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...messages.map((msg): GroqMessage => ({
      role: msg.role,
      content: msg.content
    }))
  ];

  const completion = await groq.chat.completions.create({
    messages: groqMessages,
    model: 'qwen/qwen-2.5-72b-instruct',
    temperature: 0.6,
    max_tokens: 4096,
    top_p: 0.95,
    stream: true,
  });

  return completion;
};

export const generateSessionReport = async (messages: ReportMessage[], systemPrompt: string, model: string = 'openai/gpt-oss-120b') => {
  const groqMessages: GroqMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: `Please generate a therapeutic session report based on the following conversation:\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`
    }
  ];

  const completion = await groq.chat.completions.create({
    messages: groqMessages,
    model: model,
    temperature: 0.3,
    max_tokens: 2048,
    top_p: 0.9,
    stream: false,
  });

  return completion.choices[0]?.message?.content || null;
};