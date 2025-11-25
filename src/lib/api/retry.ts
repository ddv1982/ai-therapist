/**
 * API Retry Logic
 *
 * Provides retry functionality with exponential backoff for transient failures.
 * Includes error classification to determine which errors should be retried.
 *
 * @module retry
 * @fileoverview Configurable retry logic for API operations
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const result = await withRetry(() => apiClient.fetchData());
 *
 * // With custom options
 * const result = await withRetry(
 *   () => apiClient.fetchData(),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 500,
 *     maxDelay: 30000,
 *     backoffMultiplier: 2,
 *     onRetry: (error, attempt) => {
 *       console.log(`Retry ${attempt} after error: ${error.message}`);
 *     },
 *   }
 * );
 *
 * // Check if an error is retryable
 * try {
 *   await apiClient.fetchData();
 * } catch (error) {
 *   if (isRetryableError(error)) {
 *     // Implement retry logic
 *   } else {
 *     // Don't retry, handle error
 *   }
 * }
 * ```
 */

import { logger } from '@/lib/utils/logger';
import { ApiErrorCode, isServerError, isClientError } from '@/lib/api/error-codes';
import type { Result } from '@/lib/utils/result';
import { ok, err } from '@/lib/utils/result';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts (not including initial attempt)
   * @default 3
   */
  maxAttempts: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelay: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 30000
   */
  maxDelay: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier: number;

  /**
   * Add random jitter to delay (helps prevent thundering herd)
   * @default true
   */
  jitter: boolean;

  /**
   * Custom function to determine if an error should be retried
   * If not provided, uses default isRetryableError logic
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;

  /**
   * Callback invoked before each retry attempt
   * Useful for logging or updating UI state
   */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;

  /**
   * HTTP status codes that should trigger a retry
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryableStatusCodes?: number[];

  /**
   * Error codes from ApiErrorCode that should trigger a retry
   */
  retryableErrorCodes?: ApiErrorCode[];

  /**
   * AbortSignal to cancel retry operation
   */
  signal?: AbortSignal;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** The result data if successful */
  data?: T;
  /** The final error if all retries failed */
  error?: Error;
  /** Number of attempts made (including initial attempt) */
  attempts: number;
  /** Total time elapsed in milliseconds */
  totalTime: number;
  /** Whether the operation ultimately succeeded */
  success: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Network-related error messages that indicate transient failures
 */
const NETWORK_ERROR_PATTERNS = [
  'fetch',
  'network',
  'timeout',
  'timed out',
  'aborted',
  'econnrefused',
  'econnreset',
  'enotfound',
  'socket hang up',
  'connection refused',
  'dns',
  'unreachable',
  'etimedout',
  'epipe',
  'econnaborted',
  'enetunreach',
  'ehostunreach',
] as const;

/**
 * Error messages that indicate non-retryable errors
 */
const NON_RETRYABLE_PATTERNS = [
  'invalid',
  'unauthorized',
  'forbidden',
  'not found',
  'validation',
  'authentication',
  'permission',
  'bad request',
  'conflict',
] as const;

/**
 * Determine if an error is a network-related error that should be retried
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

/**
 * Determine if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorWithStatus = error as Error & { status?: number; code?: string };

  // Check HTTP status
  if (errorWithStatus.status === 429) return true;

  // Check error code
  if (
    errorWithStatus.code === ApiErrorCode.RATE_LIMIT_EXCEEDED ||
    errorWithStatus.code === ApiErrorCode.TOO_MANY_REQUESTS
  ) {
    return true;
  }

  // Check message
  const message = error.message.toLowerCase();
  return message.includes('rate limit') || message.includes('too many requests');
}

/**
 * Determine if an error is a server error that might be temporary
 */
export function isTransientServerError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorWithStatus = error as Error & { status?: number; code?: string };

  // Check HTTP status (5xx errors)
  if (errorWithStatus.status && errorWithStatus.status >= 500 && errorWithStatus.status < 600) {
    return true;
  }

  // Check error code
  if (errorWithStatus.code) {
    const code = errorWithStatus.code as ApiErrorCode;
    if (Object.values(ApiErrorCode).includes(code)) {
      return isServerError(code);
    }
  }

  return false;
}

/**
 * Determine if an error should be retried
 *
 * Retryable errors include:
 * - Network errors (connection issues, timeouts)
 * - Rate limit errors (429)
 * - Server errors (5xx) that are transient
 * - Specific error codes marked as retryable
 *
 * Non-retryable errors include:
 * - Client errors (4xx except rate limit)
 * - Authentication errors
 * - Validation errors
 * - Business logic errors
 */
export function isRetryableError(error: unknown, options: Partial<RetryOptions> = {}): boolean {
  if (!(error instanceof Error)) return false;

  const errorWithStatus = error as Error & {
    status?: number;
    code?: string;
    isRetryable?: boolean;
  };

  // If explicitly marked as retryable/non-retryable, use that
  if (typeof errorWithStatus.isRetryable === 'boolean') {
    return errorWithStatus.isRetryable;
  }

  // Check custom retryable status codes
  if (options.retryableStatusCodes && errorWithStatus.status) {
    if (options.retryableStatusCodes.includes(errorWithStatus.status)) {
      return true;
    }
  }

  // Check custom retryable error codes
  if (options.retryableErrorCodes && errorWithStatus.code) {
    if (options.retryableErrorCodes.includes(errorWithStatus.code as ApiErrorCode)) {
      return true;
    }
  }

  // Network errors are retryable
  if (isNetworkError(error)) return true;

  // Rate limit errors are retryable (with appropriate backoff)
  if (isRateLimitError(error)) return true;

  // Transient server errors are retryable
  if (isTransientServerError(error)) return true;

  // Check for non-retryable patterns in message
  const message = error.message.toLowerCase();
  if (NON_RETRYABLE_PATTERNS.some((pattern) => message.includes(pattern))) {
    return false;
  }

  // Check if it's a client error (4xx)
  if (errorWithStatus.status && errorWithStatus.status >= 400 && errorWithStatus.status < 500) {
    return false;
  }

  // Check error code for client errors
  if (errorWithStatus.code) {
    const code = errorWithStatus.code as ApiErrorCode;
    if (Object.values(ApiErrorCode).includes(code) && isClientError(code)) {
      return false;
    }
  }

  // Default to not retrying for unknown errors
  return false;
}

// ============================================================================
// Delay Calculation
// ============================================================================

/**
 * Calculate delay for a retry attempt using exponential backoff
 */
export function calculateRetryDelay(attempt: number, options: RetryOptions): number {
  // Calculate base delay with exponential backoff
  let delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);

  // Cap at max delay
  delay = Math.min(delay, options.maxDelay);

  // Add jitter if enabled (±25% of delay)
  if (options.jitter) {
    const jitterFactor = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
    delay = Math.floor(delay * jitterFactor);
  }

  return delay;
}

/**
 * Get retry delay from rate limit headers if available
 */
export function getRetryAfterDelay(error: unknown): number | null {
  const errorWithHeaders = error as Error & {
    headers?: { get?: (key: string) => string | null };
    retryAfter?: number | string;
  };

  // Check retryAfter property
  if (errorWithHeaders.retryAfter) {
    const retryAfter = errorWithHeaders.retryAfter;
    if (typeof retryAfter === 'number') return retryAfter * 1000;
    const parsed = parseInt(retryAfter, 10);
    if (!isNaN(parsed)) return parsed * 1000;
  }

  // Check headers
  if (errorWithHeaders.headers?.get) {
    const retryAfterHeader = errorWithHeaders.headers.get('retry-after');
    if (retryAfterHeader) {
      const parsed = parseInt(retryAfterHeader, 10);
      if (!isNaN(parsed)) return parsed * 1000;
    }
  }

  return null;
}

// ============================================================================
// Sleep Utility
// ============================================================================

/**
 * Promise-based sleep utility that supports abort signal
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Retry aborted'));
      return;
    }

    const timeout = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new Error('Retry aborted'));
    });
  });
}

// ============================================================================
// Main Retry Function
// ============================================================================

/**
 * Execute an operation with automatic retry on transient failures
 *
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retries fail
 *
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   {
 *     maxAttempts: 3,
 *     onRetry: (error, attempt) => console.log(`Retry ${attempt}...`),
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const { maxAttempts, signal, onRetry } = config;

  let lastError: Error;
  let attempt = 0;

  while (attempt <= maxAttempts) {
    // Check for abort
    if (signal?.aborted) {
      throw new Error('Retry operation aborted');
    }

    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      // If we've exhausted all retries, throw
      if (attempt > maxAttempts) {
        logger.warn('Retry exhausted', {
          attempts: attempt,
          maxAttempts,
          finalError: lastError.message,
        });
        throw lastError;
      }

      // Check if we should retry this error
      const shouldRetryFn = config.shouldRetry ?? ((e) => isRetryableError(e, config));
      if (!shouldRetryFn(lastError, attempt)) {
        logger.debug('Error not retryable', {
          attempt,
          error: lastError.message,
        });
        throw lastError;
      }

      // Calculate delay (check for retry-after header first)
      let delay = getRetryAfterDelay(lastError) ?? calculateRetryDelay(attempt, config);

      // Log retry attempt
      logger.debug('Retrying operation', {
        attempt,
        maxAttempts,
        delay,
        error: lastError.message,
      });

      // Call onRetry callback if provided
      onRetry?.(lastError, attempt, delay);

      // Wait before retrying
      await sleep(delay, signal);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Execute an operation with retry, returning a Result instead of throwing
 *
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns A Result containing the data or error
 *
 * @example
 * ```typescript
 * const result = await withRetryResult(() => apiClient.fetchData());
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function withRetryResult<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<Result<T, Error>> {
  try {
    const data = await withRetry(operation, options);
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Execute an operation with retry, returning detailed result information
 *
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns Detailed retry result with attempts, timing, and success status
 *
 * @example
 * ```typescript
 * const result = await withRetryDetailed(() => apiClient.fetchData());
 * console.log(`Completed in ${result.attempts} attempts, ${result.totalTime}ms`);
 * ```
 */
export async function withRetryDetailed<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let attempts = 0;

  const trackingOptions: Partial<RetryOptions> = {
    ...options,
    onRetry: (error, attempt, delay) => {
      attempts = attempt;
      options.onRetry?.(error, attempt, delay);
    },
  };

  try {
    const data = await withRetry(operation, trackingOptions);
    return {
      data,
      attempts: attempts + 1, // +1 for successful attempt
      totalTime: Date.now() - startTime,
      success: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      attempts: attempts + 1,
      totalTime: Date.now() - startTime,
      success: false,
    };
  }
}

// ============================================================================
// Retry Policy Presets
// ============================================================================

/**
 * Aggressive retry policy for critical operations
 */
export const AGGRESSIVE_RETRY: Partial<RetryOptions> = {
  maxAttempts: 5,
  initialDelay: 500,
  maxDelay: 60000,
  backoffMultiplier: 2,
};

/**
 * Conservative retry policy for less critical operations
 */
export const CONSERVATIVE_RETRY: Partial<RetryOptions> = {
  maxAttempts: 2,
  initialDelay: 2000,
  maxDelay: 10000,
  backoffMultiplier: 1.5,
};

/**
 * Fast retry policy for quick operations
 */
export const FAST_RETRY: Partial<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 1000,
  backoffMultiplier: 2,
  jitter: false,
};

/**
 * Rate limit aware retry policy
 */
export const RATE_LIMIT_RETRY: Partial<RetryOptions> = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 120000,
  backoffMultiplier: 3,
  retryableStatusCodes: [429],
};
