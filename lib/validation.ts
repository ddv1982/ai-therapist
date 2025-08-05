import { z } from 'zod';

// Chat API validation schemas
export const chatRequestSchema = z.object({
  sessionId: z.string()
    .uuid('Invalid session ID format')
    .optional(),
  model: z.string()
    .min(1, 'Model name required')
    .max(100, 'Model name too long')
    .optional(),
  temperature: z.number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2')
    .optional(),
  maxTokens: z.number()
    .int('Max tokens must be an integer')
    .min(256, 'Max tokens must be at least 256')
    .max(131072, 'Max tokens cannot exceed 131,072')
    .optional(),
  topP: z.number()
    .min(0.1, 'Top P must be between 0.1 and 1.0')
    .max(1.0, 'Top P must be between 0.1 and 1.0')
    .optional(),
  apiKey: z.string()
    .optional(),
});

// Single message validation schema
export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long (max 10,000 characters)')
    .trim(),
});

// Session API validation schemas
export const createSessionSchema = z.object({
  title: z.string()
    .min(1, 'Session title cannot be empty')
    .max(200, 'Session title too long (max 200 characters)')
    .trim(),
});

export const sessionIdSchema = z.object({
  id: z.string()
    .uuid('Invalid session ID format'),
});

// Message validation schema
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant'], {
    errorMap: () => ({ message: "Role must be 'user' or 'assistant'" })
  }),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(50000, 'Message content too long'),
  sessionId: z.string()
    .uuid('Invalid session ID format'),
});

// Crisis detection keywords validation
export const crisisKeywordsSchema = z.array(z.string().min(1)).min(1);

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors && Array.isArray(error.errors)
        ? error.errors.map(err => {
            const path = err.path.length > 0 ? err.path.join('.') : 'root';
            return `${path}: ${err.message}`;
          }).join(', ')
        : `Zod validation failed: ${error.message || 'Invalid data format'}`;
      return { success: false, error: errorMessage };
    }
    
    const errorMsg = error instanceof Error ? error.message : 'Validation failed: Unknown error';
    return { success: false, error: errorMsg };
  }
}

// Type exports for validated data
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SessionIdInput = z.infer<typeof sessionIdSchema>;