/**
 * Tests for API Retry Logic
 */

import {
  withRetry,
  withRetryResult,
  withRetryDetailed,
  isRetryableError,
  isNetworkError,
  isRateLimitError,
  isTransientServerError,
  calculateRetryDelay,
  DEFAULT_RETRY_OPTIONS,
  AGGRESSIVE_RETRY,
  CONSERVATIVE_RETRY,
  FAST_RETRY,
} from '@/lib/api/retry';
import { ApiErrorCode } from '@/lib/api/error-codes';
import { isOk, isErr } from '@/lib/utils/result';

describe('API Retry Logic', () => {
  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Connection timeout'))).toBe(true);
      expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isNetworkError(new Error('Socket hang up'))).toBe(true);
      expect(isNetworkError(new Error('ETIMEDOUT'))).toBe(true);
    });

    it('should not identify non-network errors as network errors', () => {
      expect(isNetworkError(new Error('Validation failed'))).toBe(false);
      expect(isNetworkError(new Error('User not found'))).toBe(false);
      expect(isNetworkError(new Error('Invalid input'))).toBe(false);
      expect(isNetworkError('string error')).toBe(false);
      expect(isNetworkError(null)).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('should identify rate limit errors by status code', () => {
      const error = new Error('Too many requests') as Error & { status: number };
      error.status = 429;
      expect(isRateLimitError(error)).toBe(true);
    });

    it('should identify rate limit errors by error code', () => {
      const error = new Error('Rate limited') as Error & { code: string };
      error.code = ApiErrorCode.RATE_LIMIT_EXCEEDED;
      expect(isRateLimitError(error)).toBe(true);
    });

    it('should identify rate limit errors by message', () => {
      expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isRateLimitError(new Error('Too many requests'))).toBe(true);
    });

    it('should not identify other errors as rate limit errors', () => {
      expect(isRateLimitError(new Error('Server error'))).toBe(false);
      const error = new Error('Not found') as Error & { status: number };
      error.status = 404;
      expect(isRateLimitError(error)).toBe(false);
    });
  });

  describe('isTransientServerError', () => {
    it('should identify 5xx errors as transient', () => {
      const create5xxError = (status: number) => {
        const error = new Error('Server error') as Error & { status: number };
        error.status = status;
        return error;
      };

      expect(isTransientServerError(create5xxError(500))).toBe(true);
      expect(isTransientServerError(create5xxError(502))).toBe(true);
      expect(isTransientServerError(create5xxError(503))).toBe(true);
      expect(isTransientServerError(create5xxError(504))).toBe(true);
    });

    it('should not identify 4xx errors as transient', () => {
      const error = new Error('Bad request') as Error & { status: number };
      error.status = 400;
      expect(isTransientServerError(error)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should respect explicit isRetryable property', () => {
      const retryable = new Error('Retryable') as Error & { isRetryable: boolean };
      retryable.isRetryable = true;
      expect(isRetryableError(retryable)).toBe(true);

      const nonRetryable = new Error('Non-retryable') as Error & { isRetryable: boolean };
      nonRetryable.isRetryable = false;
      expect(isRetryableError(nonRetryable)).toBe(false);
    });

    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new Error('Failed to fetch'))).toBe(true);
      expect(isRetryableError(new Error('Connection refused'))).toBe(true);
    });

    it('should identify validation errors as non-retryable', () => {
      expect(isRetryableError(new Error('Validation failed'))).toBe(false);
      expect(isRetryableError(new Error('Invalid input'))).toBe(false);
    });

    it('should identify auth errors as non-retryable', () => {
      expect(isRetryableError(new Error('Unauthorized'))).toBe(false);
      expect(isRetryableError(new Error('Authentication failed'))).toBe(false);
    });

    it('should use custom retryable status codes', () => {
      const error = new Error('Custom error') as Error & { status: number };
      error.status = 418; // I'm a teapot

      expect(isRetryableError(error)).toBe(false);
      expect(isRetryableError(error, { retryableStatusCodes: [418] })).toBe(true);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const options = { ...DEFAULT_RETRY_OPTIONS, jitter: false };

      expect(calculateRetryDelay(1, options)).toBe(1000);
      expect(calculateRetryDelay(2, options)).toBe(2000);
      expect(calculateRetryDelay(3, options)).toBe(4000);
    });

    it('should cap at max delay', () => {
      const options = {
        ...DEFAULT_RETRY_OPTIONS,
        jitter: false,
        maxDelay: 5000,
      };

      expect(calculateRetryDelay(10, options)).toBe(5000);
    });

    it('should add jitter when enabled', () => {
      const options = { ...DEFAULT_RETRY_OPTIONS, jitter: true };
      const delays = Array.from({ length: 10 }, () => calculateRetryDelay(1, options));

      // With jitter, delays should vary (not all identical)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('withRetry', () => {
    // Use real timers for all retry tests to avoid async timing issues
    it('should return immediately on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, {
        maxAttempts: 3,
        initialDelay: 10, // Short delay for test speed
        jitter: false,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Validation failed'));

      await expect(withRetry(operation, { maxAttempts: 3 })).rejects.toThrow('Validation failed');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const networkError = new Error('Failed to fetch');
      const operation = jest.fn().mockRejectedValue(networkError);

      await expect(
        withRetry(operation, {
          maxAttempts: 2,
          initialDelay: 10, // Short delay for test speed
          jitter: false,
        })
      ).rejects.toThrow('Failed to fetch');

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await withRetry(operation, {
        maxAttempts: 2,
        initialDelay: 10,
        jitter: false,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 10);
    });

    it('should support abort signal', async () => {
      const controller = new AbortController();
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));

      const promise = withRetry(operation, {
        maxAttempts: 5,
        initialDelay: 1000,
        signal: controller.signal,
      });

      // Abort after first failure
      setTimeout(() => controller.abort(), 50);

      await expect(promise).rejects.toThrow('Retry aborted');
    });
  });

  describe('withRetryResult', () => {
    it('should return Ok on success', async () => {
      const operation = jest.fn().mockResolvedValue('data');

      const result = await withRetryResult(operation);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe('data');
      }
    });

    it('should return Err on failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Validation error'));

      const result = await withRetryResult(operation);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('Validation error');
      }
    });
  });

  describe('withRetryDetailed', () => {
    it('should return detailed success result', async () => {
      const operation = jest.fn().mockResolvedValue('data');

      const result = await withRetryDetailed(operation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('data');
      expect(result.attempts).toBe(1);
      expect(result.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should return detailed failure result', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Auth failed'));

      const result = await withRetryDetailed(operation, { maxAttempts: 2 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Auth failed');
      expect(result.attempts).toBe(1); // Non-retryable, so only 1 attempt
    });

    it('should track retry attempts', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('data');

      const result = await withRetryDetailed(operation, {
        maxAttempts: 3,
        initialDelay: 10, // Short delay for test speed
        jitter: false,
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });

  describe('Retry presets', () => {
    it('should have aggressive preset with more attempts', () => {
      expect(AGGRESSIVE_RETRY.maxAttempts).toBe(5);
      expect(AGGRESSIVE_RETRY.initialDelay).toBe(500);
    });

    it('should have conservative preset with fewer attempts', () => {
      expect(CONSERVATIVE_RETRY.maxAttempts).toBe(2);
      expect(CONSERVATIVE_RETRY.initialDelay).toBe(2000);
    });

    it('should have fast preset with short delays', () => {
      expect(FAST_RETRY.maxAttempts).toBe(3);
      expect(FAST_RETRY.initialDelay).toBe(100);
      expect(FAST_RETRY.jitter).toBe(false);
    });
  });
});
