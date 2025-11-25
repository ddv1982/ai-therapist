import { z } from 'zod';
import {
  validateRequest,
  chatMessageSchema,
  createSessionSchema,
  updateSessionSchema,
  sessionIdSchema,
  messagesQuerySchema,
  messageSchema,
  reportGenerationSchema,
  apiKeySchema,
  modelSettingsSchema,
  chatRequestSchema,
  sanitizeInput,
} from '@/lib/utils/validation';

describe('validation', () => {
  describe('validateRequest', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    it('returns success for valid data', () => {
      const result = validateRequest(testSchema, { name: 'John', age: 30 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(30);
      }
    });

    it('returns error for invalid data', () => {
      const result = validateRequest(testSchema, { name: '', age: 30 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('name');
      }
    });

    it('returns error for missing required fields', () => {
      const result = validateRequest(testSchema, { name: 'John' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('returns error for wrong type', () => {
      const result = validateRequest(testSchema, { name: 'John', age: 'not a number' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('age');
      }
    });

    it('includes field path in error message', () => {
      const nestedSchema = z.object({
        user: z.object({
          email: z.string().email(),
        }),
      });

      const result = validateRequest(nestedSchema, { user: { email: 'invalid' } });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('user.email');
      }
    });

    it('handles multiple validation errors', () => {
      const result = validateRequest(testSchema, { name: '', age: -5 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it('handles non-ZodError exceptions', () => {
      const throwingSchema = {
        parse: () => {
          throw new Error('Custom error');
        },
      } as unknown as z.ZodSchema;

      const result = validateRequest(throwingSchema, {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Custom error');
      }
    });

    it('handles unknown error types', () => {
      const throwingSchema = {
        parse: () => {
          throw 'String error';
        },
      } as unknown as z.ZodSchema;

      const result = validateRequest(throwingSchema, {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('error');
      }
    });
  });

  describe('chatMessageSchema', () => {
    it('validates correct message', () => {
      const result = chatMessageSchema.safeParse({
        message: 'Hello, this is a test message',
      });

      expect(result.success).toBe(true);
    });

    it('trims whitespace', () => {
      const result = chatMessageSchema.safeParse({
        message: '  Hello  ',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Hello');
      }
    });

    it('rejects empty message', () => {
      const result = chatMessageSchema.safeParse({
        message: '',
      });

      expect(result.success).toBe(false);
    });

    it('rejects message too long', () => {
      const result = chatMessageSchema.safeParse({
        message: 'a'.repeat(10001),
      });

      expect(result.success).toBe(false);
    });
  });

  describe('createSessionSchema', () => {
    it('validates correct session title', () => {
      const result = createSessionSchema.safeParse({
        title: 'My Session',
      });

      expect(result.success).toBe(true);
    });

    it('trims whitespace from title', () => {
      const result = createSessionSchema.safeParse({
        title: '  Session Title  ',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Session Title');
      }
    });

    it('rejects empty title', () => {
      const result = createSessionSchema.safeParse({
        title: '',
      });

      expect(result.success).toBe(false);
    });

    it('rejects title too long', () => {
      const result = createSessionSchema.safeParse({
        title: 'a'.repeat(201),
      });

      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeInput.text', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput.text('  hello  ')).toBe('hello');
    });

    it('removes control characters', () => {
      expect(sanitizeInput.text('hello\x00world\x1F')).toBe('helloworld');
    });

    it('normalizes multiple spaces', () => {
      expect(sanitizeInput.text('hello    world')).toBe('hello world');
    });

    it('handles newlines by normalizing to single space', () => {
      expect(sanitizeInput.text('hello\n\nworld')).toBe('hello world');
    });

    it('handles empty string', () => {
      expect(sanitizeInput.text('')).toBe('');
    });
  });

  describe('sanitizeInput.html', () => {
    it('escapes < and >', () => {
      expect(sanitizeInput.html('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes quotes', () => {
      expect(sanitizeInput.html('"test"')).toBe('&quot;test&quot;');
      expect(sanitizeInput.html("'test'")).toBe('&#x27;test&#x27;');
    });

    it('escapes forward slash', () => {
      expect(sanitizeInput.html('</script>')).toBe('&lt;&#x2F;script&gt;');
    });

    it('handles complex HTML', () => {
      const input = '<div class="test">Hello</div>';
      const result = sanitizeInput.html(input);

      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  // ========================================================================
  // ADDITIONAL TESTS FOR UNCOVERED BRANCHES AND EDGE CASES
  // ========================================================================

  describe('updateSessionSchema', () => {
    it('accepts valid update with title', () => {
      const result = updateSessionSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid update with status', () => {
      const result = updateSessionSchema.safeParse({
        status: 'completed',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid update with endedAt', () => {
      const result = updateSessionSchema.safeParse({
        endedAt: '2024-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('accepts null endedAt', () => {
      const result = updateSessionSchema.safeParse({
        endedAt: null,
        title: 'Test',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty object - requires at least one field', () => {
      const result = updateSessionSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field must be provided');
      }
    });

    it('accepts multiple fields', () => {
      const result = updateSessionSchema.safeParse({
        title: 'New Title',
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title when provided', () => {
      const result = updateSessionSchema.safeParse({
        title: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects title exceeding max length', () => {
      const result = updateSessionSchema.safeParse({
        title: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid endedAt datetime format', () => {
      const result = updateSessionSchema.safeParse({
        endedAt: 'invalid-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sessionIdSchema', () => {
    it('accepts valid session ID', () => {
      const result = sessionIdSchema.safeParse({ id: 'session-123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty session ID', () => {
      const result = sessionIdSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing ID field', () => {
      const result = sessionIdSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('messagesQuerySchema', () => {
    it('accepts valid query with sessionId', () => {
      const result = messagesQuerySchema.safeParse({ sessionId: 'sess-123' });
      expect(result.success).toBe(true);
    });

    it('accepts query with page and limit', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'sess-123',
        page: 2,
        limit: 25,
      });
      expect(result.success).toBe(true);
    });

    it('coerces string page to number', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'sess-123',
        page: '3',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it('rejects page less than 1', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'sess-123',
        page: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects limit greater than 100', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'sess-123',
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty sessionId', () => {
      const result = messagesQuerySchema.safeParse({ sessionId: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('messageSchema', () => {
    it('accepts valid user message', () => {
      const result = messageSchema.safeParse({
        role: 'user',
        content: 'Hello',
        sessionId: 'sess-123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid assistant message with modelUsed', () => {
      const result = messageSchema.safeParse({
        role: 'assistant',
        content: 'Hi there!',
        sessionId: 'sess-123',
        modelUsed: 'gpt-4',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
      const result = messageSchema.safeParse({
        role: 'system',
        content: 'Test',
        sessionId: 'sess-123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty content', () => {
      const result = messageSchema.safeParse({
        role: 'user',
        content: '',
        sessionId: 'sess-123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects content exceeding max length', () => {
      const result = messageSchema.safeParse({
        role: 'user',
        content: 'x'.repeat(50001),
        sessionId: 'sess-123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('chatRequestSchema', () => {
    it('accepts empty object (all fields optional)', () => {
      const result = chatRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts valid sessionId', () => {
      const result = chatRequestSchema.safeParse({ sessionId: 'sess-123' });
      expect(result.success).toBe(true);
    });

    it('accepts valid temperature within range', () => {
      const result = chatRequestSchema.safeParse({ temperature: 0.7 });
      expect(result.success).toBe(true);
    });

    it('rejects temperature below 0', () => {
      const result = chatRequestSchema.safeParse({ temperature: -0.1 });
      expect(result.success).toBe(false);
    });

    it('rejects temperature above 2', () => {
      const result = chatRequestSchema.safeParse({ temperature: 2.1 });
      expect(result.success).toBe(false);
    });

    it('accepts valid maxTokens', () => {
      const result = chatRequestSchema.safeParse({ maxTokens: 4096 });
      expect(result.success).toBe(true);
    });

    it('rejects maxTokens below 256', () => {
      const result = chatRequestSchema.safeParse({ maxTokens: 100 });
      expect(result.success).toBe(false);
    });

    it('rejects maxTokens above 131072', () => {
      const result = chatRequestSchema.safeParse({ maxTokens: 200000 });
      expect(result.success).toBe(false);
    });

    it('accepts valid topP', () => {
      const result = chatRequestSchema.safeParse({ topP: 0.9 });
      expect(result.success).toBe(true);
    });

    it('rejects topP below 0.1', () => {
      const result = chatRequestSchema.safeParse({ topP: 0.05 });
      expect(result.success).toBe(false);
    });

    it('rejects topP above 1.0', () => {
      const result = chatRequestSchema.safeParse({ topP: 1.5 });
      expect(result.success).toBe(false);
    });
  });

  describe('reportGenerationSchema', () => {
    it('accepts valid report generation request', () => {
      const result = reportGenerationSchema.safeParse({
        sessionId: 'sess-123',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result.success).toBe(true);
    });

    it('accepts with optional model', () => {
      const result = reportGenerationSchema.safeParse({
        sessionId: 'sess-123',
        messages: [{ role: 'assistant', content: 'Hi' }],
        model: 'gpt-4',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty messages array', () => {
      const result = reportGenerationSchema.safeParse({
        sessionId: 'sess-123',
        messages: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects more than 1000 messages', () => {
      const messages = Array.from({ length: 1001 }, () => ({
        role: 'user' as const,
        content: 'Test',
      }));
      const result = reportGenerationSchema.safeParse({
        sessionId: 'sess-123',
        messages,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('apiKeySchema', () => {
    it('accepts valid API key', () => {
      const result = apiKeySchema.safeParse({ apiKey: 'sk-1234567890abcdef' });
      expect(result.success).toBe(true);
    });

    it('rejects API key too short', () => {
      const result = apiKeySchema.safeParse({ apiKey: 'short' });
      expect(result.success).toBe(false);
    });

    it('rejects API key too long', () => {
      const result = apiKeySchema.safeParse({ apiKey: 'x'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('rejects API key with invalid characters', () => {
      const result = apiKeySchema.safeParse({ apiKey: 'invalid@key#123!' });
      expect(result.success).toBe(false);
    });
  });

  describe('modelSettingsSchema', () => {
    it('accepts valid model settings', () => {
      const result = modelSettingsSchema.safeParse({
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.9,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty model name', () => {
      const result = modelSettingsSchema.safeParse({
        model: '',
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.9,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer maxTokens', () => {
      const result = modelSettingsSchema.safeParse({
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096.5,
        topP: 0.9,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateRequest with ZodError edge cases', () => {
    it('handles ZodError with empty issues array', () => {
      // Simulate a ZodError with empty issues
      const mockSchema = {
        parse: () => {
          const zodError = new z.ZodError([]);
          throw zodError;
        },
      } as unknown as z.ZodSchema<{ test: string }>;

      const result = validateRequest(mockSchema, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        // Empty issues should result in empty string joined
        expect(typeof result.error).toBe('string');
      }
    });

    it('handles path at root level (empty path)', () => {
      const schema = z.string().min(5);
      const result = validateRequest(schema, 'ab');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('root');
      }
    });

    it('handles deeply nested validation errors', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            age: z.number().min(0),
          }),
        }),
      });
      const result = validateRequest(schema, { user: { profile: { age: -1 } } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('user.profile.age');
      }
    });

    it('handles multiple validation errors in one schema', () => {
      const schema = z.object({
        a: z.string().min(1),
        b: z.number().positive(),
      });
      const result = validateRequest(schema, { a: '', b: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('a');
        expect(result.error).toContain('b');
      }
    });
  });
});
