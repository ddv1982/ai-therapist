/**
 * Chat Service Types Tests
 *
 * Tests for shared chat service types and helper functions.
 */

import { ok, err, type Result } from '@/features/chat/lib/types';

describe('Chat Service Types', () => {
  // ============================================================================
  // RESULT TYPE HELPERS
  // ============================================================================

  describe('ok()', () => {
    it('creates a successful Result', () => {
      const result = ok({ id: 'msg1', content: 'Hello' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 'msg1', content: 'Hello' });
      }
    });

    it('creates ok Result with primitive value', () => {
      const result = ok('message-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('message-id');
      }
    });

    it('creates ok Result with null', () => {
      const result = ok(null);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('creates ok Result with array', () => {
      const messages = [{ id: 'msg1' }, { id: 'msg2' }];
      const result = ok(messages);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe('err()', () => {
    it('creates a failed Result with Error', () => {
      const error = new Error('Failed to save message');
      const result = err(error);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });

    it('creates err Result with custom error object', () => {
      const customError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid message format',
      };
      const result = err(customError);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toEqual({
          code: 'VALIDATION_ERROR',
          message: 'Invalid message format',
        });
      }
    });

    it('creates err Result with string error', () => {
      const result = err('Network error');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Network error');
      }
    });
  });

  // ============================================================================
  // TYPE NARROWING
  // ============================================================================

  describe('Type narrowing', () => {
    it('narrows ok Result type correctly', () => {
      const result: Result<{ name: string }, Error> = ok({ name: 'Test' });

      if (result.success) {
        // TypeScript should know result.data is available
        expect(result.data.name).toBe('Test');
      }
    });

    it('narrows err Result type correctly', () => {
      const error = new Error('Test error');
      const result: Result<string, Error> = err(error);

      if (!result.success) {
        // TypeScript should know result.error is available
        expect(result.error.message).toBe('Test error');
      }
    });

    it('handles Result in conditional logic', () => {
      const processResult = (result: Result<number, string>): string => {
        if (result.success) {
          return `Value: ${result.data}`;
        }
        return `Error: ${result.error}`;
      };

      expect(processResult(ok(42))).toBe('Value: 42');
      expect(processResult(err('Failed'))).toBe('Error: Failed');
    });
  });

  // ============================================================================
  // RESULT USAGE PATTERNS
  // ============================================================================

  describe('Common usage patterns', () => {
    it('handles async function returning Result', async () => {
      const saveMessage = async (content: string): Promise<Result<string, Error>> => {
        if (content.length === 0) {
          return err(new Error('Content cannot be empty'));
        }
        return ok(`saved-${content}`);
      };

      const successResult = await saveMessage('Hello');
      expect(successResult.success).toBe(true);
      if (successResult.success) {
        expect(successResult.data).toBe('saved-Hello');
      }

      const errorResult = await saveMessage('');
      expect(errorResult.success).toBe(false);
      if (!errorResult.success) {
        expect(errorResult.error.message).toBe('Content cannot be empty');
      }
    });

    it('chains Result operations', () => {
      const parse = (input: string): Result<number, string> => {
        const num = parseInt(input, 10);
        if (isNaN(num)) {
          return err('Invalid number');
        }
        return ok(num);
      };

      const double = (num: number): Result<number, string> => {
        return ok(num * 2);
      };

      const parseResult = parse('5');
      if (parseResult.success) {
        const doubleResult = double(parseResult.data);
        expect(doubleResult.success).toBe(true);
        if (doubleResult.success) {
          expect(doubleResult.data).toBe(10);
        }
      }

      const invalidResult = parse('abc');
      expect(invalidResult.success).toBe(false);
    });

    it('collects multiple Results', () => {
      const results: Result<number, string>[] = [ok(1), ok(2), ok(3)];

      const allSuccessful = results.every((r) => r.success);
      expect(allSuccessful).toBe(true);

      const values = results
        .filter((r): r is { success: true; data: number } => r.success)
        .map((r) => r.data);
      expect(values).toEqual([1, 2, 3]);
    });

    it('handles mixed success/failure Results', () => {
      const results: Result<number, string>[] = [ok(1), err('failed'), ok(3)];

      const firstError = results.find((r) => !r.success);
      expect(firstError).toBeDefined();
      if (firstError && !firstError.success) {
        expect(firstError.error).toBe('failed');
      }
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge cases', () => {
    it('handles undefined data in ok Result', () => {
      const result = ok(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('handles empty object in ok Result', () => {
      const result = ok({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it('handles empty array in ok Result', () => {
      const result = ok([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('handles zero in ok Result', () => {
      const result = ok(0);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });

    it('handles false in ok Result', () => {
      const result = ok(false);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('handles complex nested error objects', () => {
      const complexError = {
        code: 'API_ERROR',
        details: {
          endpoint: '/api/messages',
          statusCode: 500,
          retryAfter: 30,
        },
        timestamp: new Date().toISOString(),
      };
      const result = err(complexError);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details.statusCode).toBe(500);
      }
    });
  });
});
