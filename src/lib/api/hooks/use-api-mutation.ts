/**
 * Unified API Mutation Hook
 *
 * Provides consistent error handling for API mutations using TanStack Query.
 * Automatically extracts errors from ApiResponse and shows toast notifications.
 *
 * @module useApiMutation
 * @fileoverview Type-safe API mutation wrapper with error handling
 *
 * @example
 * ```typescript
 * // Basic usage
 * const createSession = useApiMutation(
 *   (body: CreateSessionRequest) => apiClient.createSession(body),
 *   {
 *     onSuccess: (data) => {
 *       router.push(`/chat/${data.id}`);
 *     },
 *   }
 * );
 *
 * // With custom error handling
 * const deleteSession = useApiMutation(
 *   (sessionId: string) => apiClient.deleteSession(sessionId),
 *   {
 *     errorMessage: 'Failed to delete session',
 *     showToastOnError: true,
 *     onError: (error) => {
 *       console.error('Delete failed:', error);
 *     },
 *   }
 * );
 *
 * // Usage in component
 * <button
 *   onClick={() => createSession.mutate({ title: 'New Session' })}
 *   disabled={createSession.isPending}
 * >
 *   {createSession.isPending ? 'Creating...' : 'Create Session'}
 * </button>
 * ```
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseMutationResult, QueryKey } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/api-response';
import { isApiResponse } from '@/lib/api/api-response';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/utils/logger';
import { ApiErrorCode, getErrorDetails, isServerError } from '@/lib/api/error-codes';
import type { Result } from '@/lib/utils/result';
import { ok, err } from '@/lib/utils/result';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended error type for API errors with additional context
 */
export interface ApiMutationError extends Error {
  /** API error code from error-codes.ts */
  code?: ApiErrorCode | string;
  /** HTTP status code */
  status?: number;
  /** Additional error details */
  details?: string;
  /** Suggested action for the user */
  suggestedAction?: string;
  /** Whether this error is retryable */
  isRetryable?: boolean;
  /** Original API response */
  response?: ApiResponse<unknown>;
}

/**
 * Options for useApiMutation hook
 */
export interface UseApiMutationOptions<TData, TVariables> {
  /** Show toast notification on error (default: true) */
  showToastOnError?: boolean;
  /** Show toast notification on success (default: false) */
  showToastOnSuccess?: boolean;
  /** Custom error message to show in toast */
  errorMessage?: string;
  /** Custom success message to show in toast */
  successMessage?: string;
  /** Query keys to invalidate on success */
  invalidateOnSuccess?: QueryKey[];
  /** Called when mutation succeeds with transformed data */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Called when mutation fails with typed error */
  onError?: (error: ApiMutationError, variables: TVariables) => void;
  /** Called when mutation completes (success or error) */
  onSettled?: (
    data: TData | undefined,
    error: ApiMutationError | null,
    variables: TVariables
  ) => void;
  /** TanStack Query mutation options */
  mutationOptions?: Omit<
    UseMutationOptions<TData, ApiMutationError, TVariables>,
    'mutationFn' | 'onSuccess' | 'onError' | 'onSettled'
  >;
}

/**
 * Return type for useApiMutation hook with Result-based execute method
 */
export type UseApiMutationReturn<TData, TVariables> = UseMutationResult<
  TData,
  ApiMutationError,
  TVariables
> & {
  /**
   * Execute the mutation and return a Result type instead of throwing
   * Useful for imperative error handling
   */
  execute: (variables: TVariables) => Promise<Result<TData, ApiMutationError>>;
};

// ============================================================================
// Error Extraction
// ============================================================================

/**
 * Extract error information from an API response or Error
 */
export function extractApiError(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred'
): ApiMutationError {
  // If it's already a fully processed ApiMutationError with isRetryable set, return as-is
  if (
    error instanceof Error &&
    'isRetryable' in error &&
    typeof (error as ApiMutationError).isRetryable === 'boolean'
  ) {
    return error as ApiMutationError;
  }

  // Create base error
  const apiError: ApiMutationError = new Error(fallbackMessage);
  apiError.isRetryable = false;

  // Extract from Error with status/body (from apiClient)
  if (error instanceof Error) {
    apiError.message = error.message || fallbackMessage;
    const errorWithExtras = error as Error & {
      status?: number;
      body?: unknown;
      code?: string;
    };
    apiError.status = errorWithExtras.status;

    // If the error has a code directly attached, use it
    if (errorWithExtras.code) {
      apiError.code = errorWithExtras.code;
    }

    // Try to extract from body if it's an ApiResponse
    if (errorWithExtras.body && isApiResponse(errorWithExtras.body)) {
      const response = errorWithExtras.body as ApiResponse<unknown>;
      apiError.response = response;
      if (response.error) {
        apiError.message = response.error.message || apiError.message;
        apiError.code = response.error.code || apiError.code;
        apiError.details = response.error.details;
        apiError.suggestedAction = response.error.suggestedAction;
      }
    }

    // Check if this error code is retryable (server errors typically are)
    if (apiError.code) {
      const codeAsEnum = apiError.code as ApiErrorCode;
      if (Object.values(ApiErrorCode).includes(codeAsEnum)) {
        apiError.isRetryable = isServerError(codeAsEnum);
      }
    }

    // Also check status code for retryability (5xx errors)
    if (apiError.status && apiError.status >= 500 && apiError.status < 600) {
      apiError.isRetryable = true;
    }

    return apiError;
  }

  // Handle ApiResponse directly
  if (isApiResponse(error)) {
    const response = error as ApiResponse<unknown>;
    apiError.response = response;
    if (!response.success && response.error) {
      apiError.message = response.error.message || fallbackMessage;
      apiError.code = response.error.code;
      apiError.details = response.error.details;
      apiError.suggestedAction = response.error.suggestedAction;
    }
    return apiError;
  }

  // Handle plain objects with error info
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === 'string') {
      apiError.message = errorObj.message;
    }
    if (typeof errorObj.code === 'string') {
      apiError.code = errorObj.code;
    }
    if (typeof errorObj.status === 'number') {
      apiError.status = errorObj.status;
    }
    return apiError;
  }

  // Handle string errors
  if (typeof error === 'string') {
    apiError.message = error;
    return apiError;
  }

  return apiError;
}

/**
 * Get user-friendly error message from error code or message
 */
export function getUserFriendlyErrorMessage(error: ApiMutationError): string {
  // First, try to get a user-friendly message from the error code
  if (error.code) {
    const codeAsEnum = error.code as ApiErrorCode;
    if (Object.values(ApiErrorCode).includes(codeAsEnum)) {
      const details = getErrorDetails(codeAsEnum);
      return details.description;
    }
  }

  // Use suggestedAction if available
  if (error.suggestedAction) {
    return error.suggestedAction;
  }

  // Fall back to error message
  return error.message;
}

// ============================================================================
// Data Extraction
// ============================================================================

/**
 * Extract data from ApiResponse, throwing if not successful
 */
function extractResponseData<TData>(response: unknown): TData {
  if (isApiResponse(response)) {
    const apiResponse = response as ApiResponse<TData>;
    if (!apiResponse.success) {
      throw extractApiError(apiResponse, 'API request failed');
    }
    return apiResponse.data as TData;
  }

  // If not an ApiResponse, return as-is (for non-wrapped responses)
  return response as TData;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Unified API Mutation Hook
 *
 * Wraps TanStack Query's useMutation with:
 * - Automatic error extraction from ApiResponse
 * - Toast notifications for errors and success
 * - Centralized error logging
 * - Query invalidation on success
 * - Result type support for imperative usage
 *
 * @param mutationFn - Function that performs the API call
 * @param options - Configuration options
 * @returns Mutation result with additional `execute` method
 */
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData> | TData>,
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationReturn<TData, TVariables> {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    showToastOnError = true,
    showToastOnSuccess = false,
    errorMessage,
    successMessage,
    invalidateOnSuccess,
    onSuccess,
    onError,
    onSettled,
    mutationOptions,
  } = options;

  const mutation = useMutation<TData, ApiMutationError, TVariables>({
    ...mutationOptions,
    mutationFn: async (variables) => {
      const response = await mutationFn(variables);
      return extractResponseData<TData>(response);
    },
    onSuccess: (data, variables) => {
      // Invalidate queries if specified
      if (invalidateOnSuccess && invalidateOnSuccess.length > 0) {
        invalidateOnSuccess.forEach((queryKey) => {
          void queryClient.invalidateQueries({ queryKey });
        });
      }

      // Show success toast if enabled
      if (showToastOnSuccess && successMessage) {
        toast.success(successMessage);
      }

      // Call user's onSuccess handler
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      // Log the error with context
      logger.error('API mutation failed', {
        errorCode: error.code,
        errorMessage: error.message,
        status: error.status,
        details: error.details,
        isRetryable: error.isRetryable,
      });

      // Show error toast if enabled
      if (showToastOnError) {
        const message = errorMessage || getUserFriendlyErrorMessage(error);
        toast.error(message, error.details);
      }

      // Call user's onError handler
      onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      onSettled?.(data, error, variables);
    },
  });

  // Add execute method that returns Result instead of throwing
  const execute = async (variables: TVariables): Promise<Result<TData, ApiMutationError>> => {
    try {
      const data = await mutation.mutateAsync(variables);
      return ok(data);
    } catch (error) {
      return err(extractApiError(error));
    }
  };

  return {
    ...mutation,
    execute,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Create a mutation that automatically shows loading toast
 */
export function useApiMutationWithProgress<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData> | TData>,
  options: UseApiMutationOptions<TData, TVariables> & {
    loadingMessage?: string;
  } = {}
): UseApiMutationReturn<TData, TVariables> {
  const toast = useToast();
  const { loadingMessage = 'Processing...', onSuccess, onError, ...restOptions } = options;

  return useApiMutation(mutationFn, {
    ...restOptions,
    mutationOptions: {
      ...restOptions.mutationOptions,
      onMutate: () => {
        toast.loading(loadingMessage);
      },
    },
    onSuccess: (data, variables) => {
      // Toast will be replaced by success/error toast
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      onError?.(error, variables);
    },
  });
}
