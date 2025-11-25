/**
 * Message Validation Schema Tests
 *
 * Tests for the shared validation schemas used for messages
 * between client and server.
 */

import {
  messageContentSchema,
  messageMetadataSchema,
  sendMessageSchema,
  messageSchema,
  messagesQuerySchema,
  therapeuticFrameworkSchema,
  emotionalToneSchema,
  messageRoleSchema,
  therapeuticFrameworks,
  emotionalTones,
  messageRoles,
} from '@/lib/validation/schemas/message.schema';

describe('Message Validation Schemas', () => {
  // ============================================================================
  // THERAPEUTIC FRAMEWORK ENUM
  // ============================================================================

  describe('therapeuticFrameworkSchema', () => {
    it('accepts valid therapeutic frameworks', () => {
      therapeuticFrameworks.forEach((framework) => {
        const result = therapeuticFrameworkSchema.safeParse(framework);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid frameworks', () => {
      const result = therapeuticFrameworkSchema.safeParse('InvalidFramework');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = therapeuticFrameworkSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // EMOTIONAL TONE ENUM
  // ============================================================================

  describe('emotionalToneSchema', () => {
    it('accepts valid emotional tones', () => {
      emotionalTones.forEach((tone) => {
        const result = emotionalToneSchema.safeParse(tone);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid tones', () => {
      const result = emotionalToneSchema.safeParse('happy');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // MESSAGE ROLE ENUM
  // ============================================================================

  describe('messageRoleSchema', () => {
    it('accepts valid message roles', () => {
      messageRoles.forEach((role) => {
        const result = messageRoleSchema.safeParse(role);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid roles', () => {
      const result = messageRoleSchema.safeParse('system');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // MESSAGE CONTENT SCHEMA
  // ============================================================================

  describe('messageContentSchema', () => {
    it('accepts valid message content', () => {
      const result = messageContentSchema.safeParse('Hello, how are you?');
      expect(result.success).toBe(true);
      expect(result.data).toBe('Hello, how are you?');
    });

    it('trims whitespace', () => {
      const result = messageContentSchema.safeParse('  Hello  ');
      expect(result.success).toBe(true);
      expect(result.data).toBe('Hello');
    });

    it('rejects empty string', () => {
      const result = messageContentSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Message cannot be empty');
      }
    });

    it('accepts whitespace-only string (trims to empty but min check is before transform)', () => {
      // Note: Current schema validates min length before transform
      // So '   ' passes min(1) check, then gets trimmed to ''
      // This is the actual behavior - tests document it
      const result = messageContentSchema.safeParse('   ');
      // The schema currently allows this - if this should be rejected,
      // the schema should use .refine() after .transform()
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });

    it('rejects message exceeding max length', () => {
      const longMessage = 'a'.repeat(10001);
      const result = messageContentSchema.safeParse(longMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('max 10,000 characters');
      }
    });

    it('accepts message at max length', () => {
      const maxMessage = 'a'.repeat(10000);
      const result = messageContentSchema.safeParse(maxMessage);
      expect(result.success).toBe(true);
    });

    it('handles unicode and emoji', () => {
      const unicodeMessage = '你好世界 🌍 مرحبا العالم';
      const result = messageContentSchema.safeParse(unicodeMessage);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // MESSAGE METADATA SCHEMA
  // ============================================================================

  describe('messageMetadataSchema', () => {
    it('accepts valid metadata with all fields', () => {
      const result = messageMetadataSchema.safeParse({
        therapeuticFramework: 'CBT',
        emotionalTone: 'positive',
        crisisIndicators: false,
        toolsUsed: ['journaling', 'breathing'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts undefined metadata', () => {
      const result = messageMetadataSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
      const result = messageMetadataSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts metadata with partial fields', () => {
      const result = messageMetadataSchema.safeParse({
        emotionalTone: 'neutral',
      });
      expect(result.success).toBe(true);
    });

    it('rejects metadata with extra fields (strict mode)', () => {
      const result = messageMetadataSchema.safeParse({
        therapeuticFramework: 'CBT',
        extraField: 'not allowed',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid therapeutic framework in metadata', () => {
      const result = messageMetadataSchema.safeParse({
        therapeuticFramework: 'InvalidFramework',
      });
      expect(result.success).toBe(false);
    });

    it('rejects toolsUsed array exceeding max length', () => {
      const tooManyTools = Array.from({ length: 21 }, (_, i) => `tool${i}`);
      const result = messageMetadataSchema.safeParse({
        toolsUsed: tooManyTools,
      });
      expect(result.success).toBe(false);
    });

    it('accepts toolsUsed at max length', () => {
      const maxTools = Array.from({ length: 20 }, (_, i) => `tool${i}`);
      const result = messageMetadataSchema.safeParse({
        toolsUsed: maxTools,
      });
      expect(result.success).toBe(true);
    });

    it('rejects tool name exceeding max length', () => {
      const result = messageMetadataSchema.safeParse({
        toolsUsed: ['a'.repeat(101)],
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // SEND MESSAGE SCHEMA
  // ============================================================================

  describe('sendMessageSchema', () => {
    it('accepts valid send message input', () => {
      const result = sendMessageSchema.safeParse({
        content: 'Hello',
        sessionId: 'session-123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts send message with metadata', () => {
      const result = sendMessageSchema.safeParse({
        content: 'Hello',
        sessionId: 'session-123',
        metadata: {
          therapeuticFramework: 'CBT',
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing content', () => {
      const result = sendMessageSchema.safeParse({
        sessionId: 'session-123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing sessionId', () => {
      const result = sendMessageSchema.safeParse({
        content: 'Hello',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty sessionId', () => {
      const result = sendMessageSchema.safeParse({
        content: 'Hello',
        sessionId: '',
      });
      expect(result.success).toBe(false);
    });

    it('trims content before validation', () => {
      const result = sendMessageSchema.safeParse({
        content: '  Hello  ',
        sessionId: 'session-123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Hello');
      }
    });
  });

  // ============================================================================
  // FULL MESSAGE SCHEMA
  // ============================================================================

  describe('messageSchema', () => {
    it('accepts valid full message', () => {
      const result = messageSchema.safeParse({
        role: 'user',
        content: 'Hello',
        sessionId: 'session-123',
        timestamp: Date.now(),
        createdAt: Date.now(),
      });
      expect(result.success).toBe(true);
    });

    it('accepts message with all optional fields', () => {
      const result = messageSchema.safeParse({
        role: 'assistant',
        content: 'How can I help?',
        sessionId: 'session-123',
        modelUsed: 'groq-llama-3',
        metadata: {
          therapeuticFramework: 'Schema',
          emotionalTone: 'neutral',
        },
        timestamp: Date.now(),
        createdAt: Date.now(),
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
      const result = messageSchema.safeParse({
        role: 'system',
        content: 'Hello',
        sessionId: 'session-123',
        timestamp: Date.now(),
        createdAt: Date.now(),
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative timestamp', () => {
      const result = messageSchema.safeParse({
        role: 'user',
        content: 'Hello',
        sessionId: 'session-123',
        timestamp: -1,
        createdAt: Date.now(),
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer timestamp', () => {
      const result = messageSchema.safeParse({
        role: 'user',
        content: 'Hello',
        sessionId: 'session-123',
        timestamp: 1234.5,
        createdAt: Date.now(),
      });
      expect(result.success).toBe(false);
    });

    it('rejects modelUsed exceeding max length', () => {
      const result = messageSchema.safeParse({
        role: 'assistant',
        content: 'Response',
        sessionId: 'session-123',
        modelUsed: 'a'.repeat(101),
        timestamp: Date.now(),
        createdAt: Date.now(),
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // MESSAGES QUERY SCHEMA
  // ============================================================================

  describe('messagesQuerySchema', () => {
    it('accepts valid query with all params', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'session-123',
        page: 2,
        limit: 25,
      });
      expect(result.success).toBe(true);
    });

    it('accepts query with defaults', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'session-123',
      });
      expect(result.success).toBe(true);
    });

    it('coerces string numbers to integers', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'session-123',
        page: '2',
        limit: '25',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
      }
    });

    it('rejects page less than 1', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'session-123',
        page: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects limit less than 1', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'session-123',
        limit: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects limit exceeding 100', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'session-123',
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it('accepts limit at max (100)', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: 'session-123',
        limit: 100,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty sessionId', () => {
      const result = messagesQuerySchema.safeParse({
        sessionId: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
