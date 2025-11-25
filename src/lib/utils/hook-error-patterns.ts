/**
 * Hook Error Handling Patterns
 *
 * Standardized patterns for error handling in React hooks using Result types.
 * Provides consistent error handling, logging, and user feedback patterns.
 *
 * @module hookErrorPatterns
 * @fileoverview Error handling utilities for React hooks
 *
 * ## Overview
 *
 * This module provides utilities to standardize error handling across hooks:
 *
 * 1. **Result-based returns**: Operations that can fail return Result<T, E>
 * 2. **Consistent logging**: All errors are logged with context
 * 3. **User feedback**: Toast notifications for user-facing errors
 * 4. **Error recovery**: Clear patterns for handling different error types
 *
 * ## Usage Guidelines
 *
 * ### Converting async operations to Result
 * ```typescript
 * async function fetchData(): Promise<Result<Data, Error>> {
 *   return executeWithErrorHandling(
 *     () => apiClient.getData(),
 *     {
 *       operationName: 'fetchData',
 *       showToast: true,
 *       fallbackMessage: 'Failed to load data',
 *     }
 *   );
 * }
 * ```
 *
 * ### Handling Results in components
 * ```typescript
 * const result = await fetchData();
 * if (isErr(result)) {
 *   // Error is already logged and toast shown
 *   return;
 * }
 * // Use result.data safely
 * setData(result.data);
 * ```
 *
 * ### Error recovery patterns
 * ```typescript
 * const result = await fetchData();
 * const data = match(result, {
 *   ok: (d) => d,
 *   err: (e) => getDefaultData(), // Graceful fallback
 * });
 * ```
 */

'use client';

import { useCallback, useRef } from 'react';
import type { Result } from '@/lib/utils/result';
import { ok, err, isOk, isErr, match } from '@/lib/utils/result';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/hooks/use-toast';
import {
  classifyError,
  handleClientError,
  type ErrorCategory,
  type ErrorSeverity,
} from '@/lib/utils/errors';

// Re-export Result utilities for convenience
export { ok, err, isOk, isErr, match };
export type { Result };

// ============================================================================
// Types
// ============================================================================

/**
 * Context for error handling operations
 */
export interface ErrorHandlingContext {
  /** Name of the operation for logging */
  operationName: string;
  /** Show toast notification for errors (default: true) */
  showToast?: boolean;
  /** Custom error message for toast */
  fallbackMessage?: string;
  /** Additional context to include in logs */
  logContext?: Record<string, unknown>;
  /** Called when an error occurs (after logging/toast) */
  onError?: (error: Error) => void;
}

/**
 * Enhanced error with additional context
 */
export interface EnhancedError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
  userMessage: string;
  originalError?: Error;
}

/**
 * Options for the useErrorHandler hook
 */
export interface UseErrorHandlerOptions {
  /** Default operation name for logging */
  defaultOperationName?: string;
  /** Default setting for showing toasts */
  defaultShowToast?: boolean;
}

// ============================================================================
// Error Enhancement
// ============================================================================

/**
 * Enhance an error with additional context
 */
export function enhanceError(error: unknown, context: ErrorHandlingContext): EnhancedError {
  const actualError = error instanceof Error ? error : new Error(String(error));
  const classification = classifyError(actualError);
  const clientErrorResult = handleClientError(actualError, {
    operation: context.operationName,
    fallbackMessage: context.fallbackMessage,
  });

  const enhanced: EnhancedError = Object.assign(new Error(actualError.message), {
    name: actualError.name,
    stack: actualError.stack,
    category: classification.category,
    severity: classification.severity,
    isRetryable: classification.isRetryable,
    userMessage: clientErrorResult.userMessage,
    originalError: actualError,
  });

  return enhanced;
}

// ============================================================================
// Core Execution Function
// ============================================================================

/**
 * Execute an async operation with consistent error handling
 *
 * @param operation - Async function to execute
 * @param context - Error handling context
 * @param toast - Toast instance for notifications
 * @returns Result containing data or enhanced error
 *
 * @example
 * ```typescript
 * const result = await executeWithErrorHandling(
 *   () => apiClient.saveMessage(content),
 *   {
 *     operationName: 'saveMessage',
 *     showToast: true,
 *     fallbackMessage: 'Failed to save message',
 *   },
 *   toast
 * );
 * ```
 */
export async function executeWithErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorHandlingContext,
  toast?: ReturnType<typeof useToast>
): Promise<Result<T, EnhancedError>> {
  try {
    const data = await operation();
    return ok(data);
  } catch (error) {
    const enhanced = enhanceError(error, context);

    // Log the error with context
    logger.error(`Hook operation failed: ${context.operationName}`, {
      errorMessage: enhanced.message,
      category: enhanced.category,
      severity: enhanced.severity,
      isRetryable: enhanced.isRetryable,
      ...context.logContext,
    });

    // Show toast if enabled
    if (context.showToast !== false && toast) {
      toast.error(enhanced.userMessage);
    }

    // Call error callback if provided
    context.onError?.(enhanced);

    return err(enhanced);
  }
}

/**
 * Execute a sync operation with consistent error handling
 */
export function executeWithErrorHandlingSync<T>(
  operation: () => T,
  context: ErrorHandlingContext,
  toast?: ReturnType<typeof useToast>
): Result<T, EnhancedError> {
  try {
    const data = operation();
    return ok(data);
  } catch (error) {
    const enhanced = enhanceError(error, context);

    logger.error(`Hook operation failed: ${context.operationName}`, {
      errorMessage: enhanced.message,
      category: enhanced.category,
      severity: enhanced.severity,
      ...context.logContext,
    });

    if (context.showToast !== false && toast) {
      toast.error(enhanced.userMessage);
    }

    context.onError?.(enhanced);

    return err(enhanced);
  }
}

// ============================================================================
// Hook: useErrorHandler
// ============================================================================

/**
 * Hook providing error handling utilities with consistent patterns
 *
 * @example
 * ```typescript
 * function useMyFeature() {
 *   const { execute, handleError } = useErrorHandler({
 *     defaultOperationName: 'MyFeature',
 *   });
 *
 *   const saveData = useCallback(async (data: Data) => {
 *     const result = await execute(
 *       () => apiClient.save(data),
 *       { operationName: 'saveData', showToast: true }
 *     );
 *
 *     if (isErr(result)) {
 *       // Already logged and toast shown
 *       return;
 *     }
 *
 *     // Success - use result.data
 *   }, [execute]);
 *
 *   return { saveData };
 * }
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const toast = useToast();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /**
   * Execute an async operation with error handling
   */
  const execute = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context: Partial<ErrorHandlingContext> = {}
    ): Promise<Result<T, EnhancedError>> => {
      const fullContext: ErrorHandlingContext = {
        operationName:
          context.operationName || optionsRef.current.defaultOperationName || 'unknown',
        showToast: context.showToast ?? optionsRef.current.defaultShowToast ?? true,
        fallbackMessage: context.fallbackMessage,
        logContext: context.logContext,
        onError: context.onError,
      };

      return executeWithErrorHandling(operation, fullContext, toast);
    },
    [toast]
  );

  /**
   * Execute a sync operation with error handling
   */
  const executeSync = useCallback(
    <T>(
      operation: () => T,
      context: Partial<ErrorHandlingContext> = {}
    ): Result<T, EnhancedError> => {
      const fullContext: ErrorHandlingContext = {
        operationName:
          context.operationName || optionsRef.current.defaultOperationName || 'unknown',
        showToast: context.showToast ?? optionsRef.current.defaultShowToast ?? true,
        fallbackMessage: context.fallbackMessage,
        logContext: context.logContext,
        onError: context.onError,
      };

      return executeWithErrorHandlingSync(operation, fullContext, toast);
    },
    [toast]
  );

  /**
   * Handle an error that occurred outside of execute
   */
  const handleError = useCallback(
    (error: unknown, context: Partial<ErrorHandlingContext> = {}): EnhancedError => {
      const fullContext: ErrorHandlingContext = {
        operationName:
          context.operationName || optionsRef.current.defaultOperationName || 'unknown',
        showToast: context.showToast ?? optionsRef.current.defaultShowToast ?? true,
        fallbackMessage: context.fallbackMessage,
        logContext: context.logContext,
        onError: context.onError,
      };

      const enhanced = enhanceError(error, fullContext);

      logger.error(`Error handled: ${fullContext.operationName}`, {
        errorMessage: enhanced.message,
        category: enhanced.category,
        severity: enhanced.severity,
        ...fullContext.logContext,
      });

      if (fullContext.showToast !== false) {
        toast.error(enhanced.userMessage);
      }

      fullContext.onError?.(enhanced);

      return enhanced;
    },
    [toast]
  );

  /**
   * Show success feedback
   */
  const showSuccess = useCallback(
    (message: string, description?: string) => {
      toast.success(message, description);
    },
    [toast]
  );

  return {
    execute,
    executeSync,
    handleError,
    showSuccess,
    toast,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a Result to a standard value, throwing on error
 * Use sparingly - prefer handling Results explicitly
 */
export function unwrapOrThrow<T>(result: Result<T, Error>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Convert a Result to a nullable value
 */
export function resultToNullable<T>(result: Result<T, unknown>): T | null {
  if (isOk(result)) {
    return result.data;
  }
  return null;
}

/**
 * Check if an error is recoverable (user can retry)
 */
export function isRecoverableError(error: EnhancedError): boolean {
  return error.isRetryable || error.category === 'external_api';
}

/**
 * Get appropriate action for an error
 */
export function getErrorRecoveryAction(
  error: EnhancedError
): 'retry' | 'refresh' | 'login' | 'contact_support' {
  if (error.category === 'authentication') {
    return 'login';
  }
  if (error.isRetryable) {
    return 'retry';
  }
  if (error.category === 'system' || error.category === 'database') {
    return 'refresh';
  }
  return 'contact_support';
}

// ============================================================================
// Documentation: Error Handling Patterns
// ============================================================================

/**
 * ## Error Handling Patterns for Hooks
 *
 * ### Pattern 1: Simple async operation
 * ```typescript
 * const { execute } = useErrorHandler({ defaultOperationName: 'MyHook' });
 *
 * const fetchData = async () => {
 *   const result = await execute(() => apiClient.getData(), {
 *     operationName: 'fetchData',
 *   });
 *
 *   if (isErr(result)) return; // Error handled automatically
 *   setData(result.data);
 * };
 * ```
 *
 * ### Pattern 2: With custom error handling
 * ```typescript
 * const result = await execute(() => apiClient.getData(), {
 *   operationName: 'fetchData',
 *   showToast: false, // Handle manually
 *   onError: (error) => {
 *     if (error.category === 'authentication') {
 *       router.push('/login');
 *     }
 *   },
 * });
 * ```
 *
 * ### Pattern 3: With retry support
 * ```typescript
 * import { withRetry } from '@/lib/api/retry';
 *
 * const result = await execute(
 *   () => withRetry(() => apiClient.getData(), { maxAttempts: 3 }),
 *   { operationName: 'fetchDataWithRetry' }
 * );
 * ```
 *
 * ### Pattern 4: Fallback values
 * ```typescript
 * const result = await execute(() => apiClient.getData(), {
 *   operationName: 'fetchData',
 *   showToast: false,
 * });
 *
 * const data = match(result, {
 *   ok: (d) => d,
 *   err: () => defaultData,
 * });
 * ```
 *
 * ### Pattern 5: Multiple operations with transaction-like behavior
 * ```typescript
 * const results = await Promise.all([
 *   execute(() => apiClient.step1(), { operationName: 'step1' }),
 *   execute(() => apiClient.step2(), { operationName: 'step2' }),
 * ]);
 *
 * if (results.some(isErr)) {
 *   // Rollback or handle partial failure
 *   return;
 * }
 *
 * // All succeeded
 * const [step1Data, step2Data] = results.map(r => (r as Ok<Data>).data);
 * ```
 */
export const ERROR_HANDLING_PATTERNS = 'See JSDoc above';
