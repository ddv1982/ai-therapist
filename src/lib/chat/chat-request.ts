import { z } from 'zod';
import { DEFAULT_MODEL_ID } from '@/features/chat/config';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  id: z.string().optional(),
  createdAt: z.string().optional(),
});

export const chatRequestSchema = z.object({
  // Accept Convex document IDs (non-UUID). Keep loose string validation.
  sessionId: z.string().min(1).optional(),
  message: z.string().min(1).transform(val => val.trim()).refine(val => val.length > 0, {
    message: 'Message cannot be empty or contain only whitespace'
  }),
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

type RawPart = { type?: string; text?: unknown } | null | undefined;
type RawMsg = { role?: string; content?: unknown; parts?: RawPart[]; id?: unknown } | null | undefined;

export function buildForwardedMessages(rawMessages: unknown, fallbackMessage: string): Array<{ role: 'user' | 'assistant'; content: string; id?: string }> {
  const isForwardable = (m: RawMsg): m is { role: 'user' | 'assistant'; content?: unknown; parts?: RawPart[]; id?: unknown } => !!m && (m.role === 'user' || m.role === 'assistant');
  if (!Array.isArray(rawMessages)) {
    return [{ role: 'user', content: fallbackMessage }];
  }
  const coerceText = (m: { content?: unknown; parts?: RawPart[] }): string => {
    if (typeof m.content === 'string') return m.content;
    if (Array.isArray(m.parts)) {
      return m.parts.map(p => (p && p.type === 'text' && typeof p.text === 'string' ? p.text : '')).join('');
    }
    return '';
  };
  return (rawMessages as RawMsg[])
    .filter(isForwardable)
    .map((m) => ({
      role: m!.role as 'user' | 'assistant',
      id: typeof m!.id === 'string' ? (m!.id as string) : undefined,
      content: coerceText(m as { content?: unknown; parts?: RawPart[] }),
    }));
}


