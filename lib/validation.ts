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
  role: z.enum(['user', 'assistant']).refine((val) => val === 'user' || val === 'assistant', {
    message: "Role must be 'user' or 'assistant'"
  }),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(50000, 'Message content too long'),
  sessionId: z.string()
    .uuid('Invalid session ID format'),
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
 *   console.log(result.data.temperature);
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

// Email report validation schema
export const emailReportSchema = z.object({
  sessionId: z.string()
    .uuid('Invalid session ID format'),
  messages: z.array(messageSchema)
    .min(1, 'At least one message is required'),
  emailAddress: z.string()
    .email('Invalid email address format')
    .max(254, 'Email address too long'),
  model: z.string()
    .min(1, 'Model name required')
    .max(100, 'Model name too long')
    .optional(),
  emailConfig: z.object({
    service: z.enum(['console', 'smtp'], {
      errorMap: () => ({ message: 'Service must be either "console" or "smtp"' })
    }),
    smtpHost: z.string().min(1, 'SMTP host is required').optional(),
    smtpUser: z.string().email('Invalid SMTP user email').optional(),
    smtpPass: z.string().min(1, 'SMTP password is required').optional(),
    fromEmail: z.string()
      .min(1, 'From email is required')
      .regex(/^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|.+<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>)$/, 
        'Invalid from email format (use: email@domain.com or "Name <email@domain.com>")')
      .optional()
  }).refine((data) => {
    if (data.service === 'smtp') {
      return data.smtpHost && data.smtpUser && data.smtpPass && data.fromEmail;
    }
    return true;
  }, {
    message: 'SMTP configuration fields are required when using SMTP service'
  }).optional()
});

// Type exports for validated data
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SessionIdInput = z.infer<typeof sessionIdSchema>;
export type EmailReportInput = z.infer<typeof emailReportSchema>;