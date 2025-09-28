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

// Query parameters schema for fetching messages
export const messagesQuerySchema = z.object({
  sessionId: z.string()
    .uuid('Invalid session ID format'),
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
});

// Session update validation schema
export const updateSessionSchema = z.object({
  title: z.string()
    .min(1, 'Session title cannot be empty')
    .max(200, 'Session title too long (max 200 characters)')
    .trim()
    .optional(),
  status: z.string()
    .min(1, 'Status cannot be empty')
    .max(50, 'Status too long')
    .optional(),
  endedAt: z.string()
    .datetime()
    .nullable()
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

// Message validation schema
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(50000, 'Message content too long'),
  sessionId: z.string()
    .uuid('Invalid session ID format'),
  modelUsed: z.string()
    .min(1, 'Model name cannot be empty')
    .max(100, 'Model name too long')
    .optional(),
});

/**
 * Validates request data against a Zod schema with comprehensive error handling
 * 
 * @template T - The expected type after validation
 * @param schema - Zod schema to validate against
 * @param data - Input data to validate (typically from request body)
 * @returns Validation result with either validated data or detailed error message
 * 
 * @example
 * ```typescript
 * const result = validateRequest(chatRequestSchema, requestBody);
 * if (result.success) {
 *   // Use result.data which is now type-safe
 *   logger.info('Validation successful', { temperature: result.data.temperature });
 * } else {
 *   // Handle validation error
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 * ```
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues && Array.isArray(error.issues)
        ? error.issues.map(err => {
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

// Simple message schema for report generation (only needs role and content)
export const reportMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(50000, 'Message content too long'),
});

// Session report generation validation schema
export const reportGenerationSchema = z.object({
  sessionId: z.string()
    .uuid('Invalid session ID format'),
  messages: z.array(reportMessageSchema)
    .min(1, 'At least one message is required')
    .max(1000, 'Too many messages (max 1000)'),
  model: z.string()
    .min(1, 'Model name required')
    .max(100, 'Model name too long')
    .optional(),
});

// API key validation schema
export const apiKeySchema = z.object({
  apiKey: z.string()
    .min(10, 'API key too short')
    .max(200, 'API key too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'API key contains invalid characters'),
});

// Model settings validation schema
export const modelSettingsSchema = z.object({
  model: z.string()
    .min(1, 'Model name required')
    .max(100, 'Model name too long'),
  temperature: z.number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2'),
  maxTokens: z.number()
    .int('Max tokens must be an integer')
    .min(256, 'Max tokens must be at least 256')
    .max(131072, 'Max tokens cannot exceed 131,072'),
  topP: z.number()
    .min(0.1, 'Top P must be between 0.1 and 1.0')
    .max(1.0, 'Top P must be between 0.1 and 1.0'),
});

// Input sanitization utilities
export const sanitizeInput = {
  /**
   * Sanitize user input by removing potentially harmful content
   */
  text: (input: string): string => {
    return input
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  },

  /**
   * Sanitize HTML content (basic protection)
   */
  html: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
};

// Type exports for validated data
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SessionIdInput = z.infer<typeof sessionIdSchema>;
export type ReportGenerationInput = z.infer<typeof reportGenerationSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
export type ModelSettingsInput = z.infer<typeof modelSettingsSchema>;