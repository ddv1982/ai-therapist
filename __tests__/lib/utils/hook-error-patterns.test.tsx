/**
 * Tests for Hook Error Patterns
 *
 * Validates error handling utilities for React hooks
 * Focuses on exported utility functions and type safety
 */

import {
  ok,
  err,
  isOk,
  isErr,
  unwrapOrThrow,
  resultToNullable,
  isRecoverableError,
  getErrorRecoveryAction,
  type EnhancedError,
} from '@/lib/utils/hook-error-patterns';

describe('Hook Error Patterns', () => {
  describe('Result utilities re-exports', () => {
    it('exports ok function', () => {
      const result = ok('test data');
      expect(result).toEqual({ success: true, data: 'test data' });
    });

    it('exports err function', () => {
      const error = new Error('test error');
      const result = err(error);
      expect(result).toEqual({ success: false, error });
    });

    it('exports isOk function', () => {
      expect(isOk(ok('data'))).toBe(true);
      expect(isOk(err(new Error('error')))).toBe(false);
    });

    it('exports isErr function', () => {
      expect(isErr(err(new Error('error')))).toBe(true);
      expect(isErr(ok('data'))).toBe(false);
    });

    it('ok handles various data types', () => {
      expect(ok(123)).toEqual({ success: true, data: 123 });
      expect(ok(null)).toEqual({ success: true, data: null });
      expect(ok({ nested: true })).toEqual({ success: true, data: { nested: true } });
      expect(ok([1, 2, 3])).toEqual({ success: true, data: [1, 2, 3] });
    });

    it('err handles various error types', () => {
      const customError = { code: 'CUSTOM', message: 'Custom error' };
      expect(err(customError)).toEqual({ success: false, error: customError });
      expect(err('string error')).toEqual({ success: false, error: 'string error' });
    });
  });

  describe('unwrapOrThrow', () => {
    it('returns data for ok result', () => {
      const result = ok('test data');
      expect(unwrapOrThrow(result)).toBe('test data');
    });

    it('throws for err result', () => {
      const error = new Error('test error');
      const result = err(error);

      expect(() => unwrapOrThrow(result)).toThrow('test error');
    });

    it('handles complex data types', () => {
      const data = { id: 1, items: [1, 2, 3] };
      expect(unwrapOrThrow(ok(data))).toEqual(data);
    });

    it('throws the exact error from err result', () => {
      const customError = new Error('custom');
      customError.name = 'CustomError';
      const result = err(customError);

      try {
        unwrapOrThrow(result);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBe(customError);
      }
    });
  });

  describe('resultToNullable', () => {
    it('returns data for ok result', () => {
      const result = ok('test data');
      expect(resultToNullable(result)).toBe('test data');
    });

    it('returns null for err result', () => {
      const result = err(new Error('error'));
      expect(resultToNullable(result)).toBeNull();
    });

    it('handles null data in ok result', () => {
      const result = ok(null);
      expect(resultToNullable(result)).toBeNull();
    });

    it('handles undefined data in ok result', () => {
      const result = ok(undefined);
      expect(resultToNullable(result)).toBeUndefined();
    });

    it('handles complex error types', () => {
      const result = err({ code: 500, message: 'Server error' });
      expect(resultToNullable(result)).toBeNull();
    });
  });

  describe('isRecoverableError', () => {
    it('returns true for retryable errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Test',
        category: 'system',
        severity: 'high',
        isRetryable: true,
        userMessage: 'Error',
      };

      expect(isRecoverableError(error)).toBe(true);
    });

    it('returns true for external_api category', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Test',
        category: 'external_api',
        severity: 'medium',
        isRetryable: false,
        userMessage: 'Error',
      };

      expect(isRecoverableError(error)).toBe(true);
    });

    it('returns false for non-recoverable validation errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Test',
        category: 'validation',
        severity: 'low',
        isRetryable: false,
        userMessage: 'Error',
      };

      expect(isRecoverableError(error)).toBe(false);
    });

    it('returns false for non-recoverable authentication errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Test',
        category: 'authentication',
        severity: 'high',
        isRetryable: false,
        userMessage: 'Error',
      };

      expect(isRecoverableError(error)).toBe(false);
    });

    it('returns true when isRetryable even if category suggests otherwise', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Test',
        category: 'validation',
        severity: 'low',
        isRetryable: true,
        userMessage: 'Error',
      };

      expect(isRecoverableError(error)).toBe(true);
    });

    it('handles database category', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Test',
        category: 'database',
        severity: 'critical',
        isRetryable: false,
        userMessage: 'Error',
      };

      expect(isRecoverableError(error)).toBe(false);
    });
  });

  describe('getErrorRecoveryAction', () => {
    it('returns login for authentication errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Unauthorized',
        category: 'authentication',
        severity: 'high',
        isRetryable: false,
        userMessage: 'Please login',
      };

      expect(getErrorRecoveryAction(error)).toBe('login');
    });

    it('returns retry for retryable errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Timeout',
        category: 'external_api',
        severity: 'medium',
        isRetryable: true,
        userMessage: 'Request timed out',
      };

      expect(getErrorRecoveryAction(error)).toBe('retry');
    });

    it('returns refresh for system errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'System error',
        category: 'system',
        severity: 'high',
        isRetryable: false,
        userMessage: 'System error',
      };

      expect(getErrorRecoveryAction(error)).toBe('refresh');
    });

    it('returns refresh for database errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Database error',
        category: 'database',
        severity: 'critical',
        isRetryable: false,
        userMessage: 'Database error',
      };

      expect(getErrorRecoveryAction(error)).toBe('refresh');
    });

    it('returns contact_support for validation errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Validation error',
        category: 'validation',
        severity: 'low',
        isRetryable: false,
        userMessage: 'Invalid input',
      };

      expect(getErrorRecoveryAction(error)).toBe('contact_support');
    });

    it('returns contact_support for permission errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Permission denied',
        category: 'permission',
        severity: 'high',
        isRetryable: false,
        userMessage: 'Access denied',
      };

      expect(getErrorRecoveryAction(error)).toBe('contact_support');
    });

    it('returns contact_support for business logic errors', () => {
      const error: EnhancedError = {
        name: 'Error',
        message: 'Business rule violation',
        category: 'business_logic',
        severity: 'medium',
        isRetryable: false,
        userMessage: 'Operation not allowed',
      };

      expect(getErrorRecoveryAction(error)).toBe('contact_support');
    });

    it('prioritizes authentication over retryable', () => {
      // Authentication errors should return 'login' even if retryable
      const error: EnhancedError = {
        name: 'Error',
        message: 'Token expired',
        category: 'authentication',
        severity: 'high',
        isRetryable: true,
        userMessage: 'Session expired',
      };

      expect(getErrorRecoveryAction(error)).toBe('login');
    });

    it('prioritizes retry over system for retryable errors', () => {
      // Retryable errors should return 'retry' even if system category
      const error: EnhancedError = {
        name: 'Error',
        message: 'Temporary failure',
        category: 'external_api',
        severity: 'high',
        isRetryable: true,
        userMessage: 'Please retry',
      };

      expect(getErrorRecoveryAction(error)).toBe('retry');
    });
  });

  describe('Type inference', () => {
    it('isOk narrows type correctly', () => {
      const result = ok({ id: 1, name: 'test' });

      if (isOk(result)) {
        // TypeScript should know result.data exists
        expect(result.data.id).toBe(1);
        expect(result.data.name).toBe('test');
      }
    });

    it('isErr narrows type correctly', () => {
      const error = new Error('test');
      const result = err(error);

      if (isErr(result)) {
        // TypeScript should know result.error exists
        expect(result.error.message).toBe('test');
      }
    });

    it('handles union results correctly', () => {
      const getResult = (success: boolean) => {
        if (success) {
          return ok({ value: 42 });
        }
        return err(new Error('failed'));
      };

      const successResult = getResult(true);
      const failResult = getResult(false);

      expect(isOk(successResult)).toBe(true);
      expect(isErr(failResult)).toBe(true);
    });
  });
});
