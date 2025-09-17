import { z } from 'zod';
import { DEFAULT_MODEL_ID } from '@/features/chat/config';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  id: z.string().optional(),
  createdAt: z.string().optional(),
});

export const chatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1),
  model: z.string().default(DEFAULT_MODEL_ID),
  tools: z.array(z.string()).optional(),
  context: z.object({}).passthrough().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export function normalizeChatRequest(input: unknown): { success: true; data: ChatRequest } | { success: false; error: string } {
  try {
    const parsed = chatRequestSchema.parse(input);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') };
    }
    return { success: false, error: 'Invalid request payload' };
  }
}


