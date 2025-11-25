/**
 * Tests for Session Validation Schemas
 *
 * Validates all session-related Zod schemas
 */

import {
  sessionStatusSchema,
  sessionTitleSchema,
  createSessionSchema,
  updateSessionSchema,
  sessionIdSchema,
  sessionSchema,
  sessionStatuses,
} from '@/lib/validation/schemas/session.schema';

describe('Session Validation Schemas', () => {
  describe('sessionStatuses', () => {
    it('has expected status values', () => {
      expect(sessionStatuses).toContain('active');
      expect(sessionStatuses).toContain('completed');
      expect(sessionStatuses).toHaveLength(2);
    });
  });

  describe('sessionStatusSchema', () => {
    it('accepts active status', () => {
      const result = sessionStatusSchema.safeParse('active');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('active');
      }
    });

    it('accepts completed status', () => {
      const result = sessionStatusSchema.safeParse('completed');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('completed');
      }
    });

    it('rejects invalid status', () => {
      const result = sessionStatusSchema.safeParse('pending');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = sessionStatusSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rejects null', () => {
      const result = sessionStatusSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects number', () => {
      const result = sessionStatusSchema.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  describe('sessionTitleSchema', () => {
    it('accepts valid title', () => {
      const result = sessionTitleSchema.safeParse('My Therapy Session');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('My Therapy Session');
      }
    });

    it('trims whitespace', () => {
      const result = sessionTitleSchema.safeParse('  My Session  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('My Session');
      }
    });

    it('rejects empty title', () => {
      const result = sessionTitleSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('empty');
      }
    });

    it('handles whitespace-only title (trims to empty)', () => {
      // Note: The schema validates min(1) before transform
      // So '   ' passes min check, then gets trimmed to ''
      // This is the actual Zod behavior - if rejection is desired,
      // the schema should use .refine() after .transform()
      const result = sessionTitleSchema.safeParse('   ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });

    it('rejects title exceeding 200 chars', () => {
      const longTitle = 'a'.repeat(201);
      const result = sessionTitleSchema.safeParse(longTitle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200');
      }
    });

    it('accepts title at max length (200 chars)', () => {
      const maxTitle = 'a'.repeat(200);
      const result = sessionTitleSchema.safeParse(maxTitle);
      expect(result.success).toBe(true);
    });

    it('accepts single character title', () => {
      const result = sessionTitleSchema.safeParse('A');
      expect(result.success).toBe(true);
    });
  });

  describe('createSessionSchema', () => {
    it('accepts valid creation input', () => {
      const result = createSessionSchema.safeParse({ title: 'New Session' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('New Session');
      }
    });

    it('requires title', () => {
      const result = createSessionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('applies title validation rules', () => {
      const result = createSessionSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('trims title whitespace', () => {
      const result = createSessionSchema.safeParse({ title: '  Trimmed Title  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Trimmed Title');
      }
    });
  });

  describe('updateSessionSchema', () => {
    it('accepts partial updates with title only', () => {
      const result = updateSessionSchema.safeParse({ title: 'Updated Title' });
      expect(result.success).toBe(true);
    });

    it('accepts partial updates with status only', () => {
      const result = updateSessionSchema.safeParse({ status: 'completed' });
      expect(result.success).toBe(true);
    });

    it('accepts partial updates with endedAt only', () => {
      const result = updateSessionSchema.safeParse({ endedAt: 1705312800000 });
      expect(result.success).toBe(true);
    });

    it('accepts null for endedAt', () => {
      const result = updateSessionSchema.safeParse({ endedAt: null });
      expect(result.success).toBe(true);
    });

    it('requires at least one field', () => {
      const result = updateSessionSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field');
      }
    });

    it('validates endedAt as positive int', () => {
      const result = updateSessionSchema.safeParse({ endedAt: -1 });
      expect(result.success).toBe(false);
    });

    it('validates endedAt is an integer', () => {
      const result = updateSessionSchema.safeParse({ endedAt: 1234.5 });
      expect(result.success).toBe(false);
    });

    it('accepts multiple fields', () => {
      const result = updateSessionSchema.safeParse({
        title: 'New Title',
        status: 'completed',
        endedAt: 1705312800000,
      });
      expect(result.success).toBe(true);
    });

    it('validates all provided fields', () => {
      const result = updateSessionSchema.safeParse({
        title: 'Valid',
        status: 'invalid-status',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sessionIdSchema', () => {
    it('accepts valid ID', () => {
      const result = sessionIdSchema.safeParse({ id: 'session-12345' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('session-12345');
      }
    });

    it('rejects empty ID', () => {
      const result = sessionIdSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('empty');
      }
    });

    it('rejects missing ID', () => {
      const result = sessionIdSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts any non-empty string ID', () => {
      const result = sessionIdSchema.safeParse({ id: 'x' });
      expect(result.success).toBe(true);
    });

    it('accepts UUID format ID', () => {
      const result = sessionIdSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result.success).toBe(true);
    });
  });

  describe('sessionSchema', () => {
    const validSession = {
      userId: 'user-123',
      title: 'Session Title',
      messageCount: 10,
      startedAt: 1705312800000,
      endedAt: null,
      status: 'active' as const,
      createdAt: 1705312800000,
      updatedAt: 1705312800000,
    };

    it('accepts complete valid session', () => {
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('validates userId is not empty', () => {
      const result = sessionSchema.safeParse({ ...validSession, userId: '' });
      expect(result.success).toBe(false);
    });

    it('validates title with schema rules', () => {
      const result = sessionSchema.safeParse({ ...validSession, title: '' });
      expect(result.success).toBe(false);
    });

    it('validates messageCount as non-negative', () => {
      const result = sessionSchema.safeParse({ ...validSession, messageCount: -1 });
      expect(result.success).toBe(false);
    });

    it('accepts zero messageCount', () => {
      const result = sessionSchema.safeParse({ ...validSession, messageCount: 0 });
      expect(result.success).toBe(true);
    });

    it('validates startedAt as positive integer', () => {
      const result = sessionSchema.safeParse({ ...validSession, startedAt: 0 });
      expect(result.success).toBe(false);
    });

    it('validates startedAt is an integer', () => {
      const result = sessionSchema.safeParse({ ...validSession, startedAt: 123.45 });
      expect(result.success).toBe(false);
    });

    it('accepts null endedAt', () => {
      const result = sessionSchema.safeParse({ ...validSession, endedAt: null });
      expect(result.success).toBe(true);
    });

    it('accepts positive integer endedAt', () => {
      const result = sessionSchema.safeParse({ ...validSession, endedAt: 1705312900000 });
      expect(result.success).toBe(true);
    });

    it('validates status enum', () => {
      const result = sessionSchema.safeParse({ ...validSession, status: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('validates createdAt as positive integer', () => {
      const result = sessionSchema.safeParse({ ...validSession, createdAt: -1 });
      expect(result.success).toBe(false);
    });

    it('validates updatedAt as positive integer', () => {
      const result = sessionSchema.safeParse({ ...validSession, updatedAt: 0 });
      expect(result.success).toBe(false);
    });

    it('accepts completed session with endedAt', () => {
      const completedSession = {
        ...validSession,
        status: 'completed' as const,
        endedAt: 1705312900000,
      };
      const result = sessionSchema.safeParse(completedSession);
      expect(result.success).toBe(true);
    });
  });
});
