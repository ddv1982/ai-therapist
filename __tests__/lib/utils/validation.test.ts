import { z } from 'zod';
import {
  validateRequest,
  chatMessageSchema,
  createSessionSchema,
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
});
