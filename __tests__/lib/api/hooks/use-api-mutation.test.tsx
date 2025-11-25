/**
 * Tests for useApiMutation hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useApiMutation,
  extractApiError,
  getUserFriendlyErrorMessage,
  type ApiMutationError,
} from '@/lib/api/hooks/use-api-mutation';
import type { ApiResponse } from '@/lib/api/api-response';
import { ApiErrorCode } from '@/lib/api/error-codes';
// Note: Using result.success directly instead of isOk/isErr for type narrowing in tests

// Mock useToast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  loading: jest.fn(),
  promise: jest.fn(),
};

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => mockToast,
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useApiMutation', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('successful mutations', () => {
    it('should return data on successful ApiResponse', async () => {
      const mockData = { id: '1', name: 'Test' };
      const response: ApiResponse<typeof mockData> = {
        success: true,
        data: mockData,
      };
      const mutationFn = jest.fn().mockResolvedValue(response);

      const { result } = renderHook(() => useApiMutation(mutationFn), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync(undefined);
      });

      // Wait for TanStack Query state to update
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = jest.fn();
      const mockData = { id: '1' };
      const response: ApiResponse<typeof mockData> = {
        success: true,
        data: mockData,
      };
      const mutationFn = jest.fn().mockResolvedValue(response);

      const { result } = renderHook(() => useApiMutation(mutationFn, { onSuccess }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(undefined);
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData, undefined);
    });

    it('should show success toast when enabled', async () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '1' },
      };
      const mutationFn = jest.fn().mockResolvedValue(response);

      const { result } = renderHook(
        () =>
          useApiMutation(mutationFn, {
            showToastOnSuccess: true,
            successMessage: 'Operation successful!',
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync(undefined);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Operation successful!');
    });

    it('should invalidate queries on success', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '1' },
      };
      const mutationFn = jest.fn().mockResolvedValue(response);

      const { result } = renderHook(
        () =>
          useApiMutation(mutationFn, {
            invalidateOnSuccess: [['sessions'], ['messages']],
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync(undefined);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['sessions'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['messages'] });
    });
  });

  describe('failed mutations', () => {
    it('should extract error from failed ApiResponse', async () => {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          message: 'Session not found',
          code: ApiErrorCode.SESSION_NOT_FOUND,
          details: 'The requested session does not exist',
        },
      };
      const mutationFn = jest.fn().mockResolvedValue(response);

      const { result } = renderHook(() => useApiMutation(mutationFn), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch {
          // Expected to throw
        }
      });

      // Wait for TanStack Query state to update
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Session not found');
    });

    it('should show error toast on failure', async () => {
      const mutationFn = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApiMutation(mutationFn), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('should use custom error message for toast', async () => {
      const mutationFn = jest.fn().mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(
        () =>
          useApiMutation(mutationFn, {
            errorMessage: 'Failed to save changes',
          }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to save changes', undefined);
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      const mutationFn = jest.fn().mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useApiMutation(mutationFn, { onError }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('should not show toast when showToastOnError is false', async () => {
      const mutationFn = jest.fn().mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useApiMutation(mutationFn, { showToastOnError: false }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch {
          // Expected to throw
        }
      });

      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  describe('execute method', () => {
    it('should return Ok result on success', async () => {
      const mockData = { id: '1' };
      const response: ApiResponse<typeof mockData> = {
        success: true,
        data: mockData,
      };
      const mutationFn = jest.fn().mockResolvedValue(response);

      const { result } = renderHook(() => useApiMutation(mutationFn), { wrapper: createWrapper() });

      let executeResult: Awaited<ReturnType<typeof result.current.execute>> | undefined;
      await act(async () => {
        executeResult = await result.current.execute(undefined);
      });

      expect(executeResult).toBeDefined();
      expect(executeResult!.success).toBe(true);
      if (executeResult && executeResult.success === true) {
        expect(executeResult.data).toEqual(mockData);
      }
    });

    it('should return Err result on failure', async () => {
      const mutationFn = jest.fn().mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useApiMutation(mutationFn, { showToastOnError: false }), {
        wrapper: createWrapper(),
      });

      let executeResult: Awaited<ReturnType<typeof result.current.execute>> | undefined;
      await act(async () => {
        executeResult = await result.current.execute(undefined);
      });

      expect(executeResult).toBeDefined();
      expect(executeResult!.success).toBe(false);
      if (executeResult && executeResult.success === false) {
        expect(executeResult.error.message).toBe('Failed');
      }
    });
  });
});

describe('extractApiError', () => {
  it('should extract from Error with status and body', () => {
    const error = new Error('Not found') as Error & {
      status: number;
      body: ApiResponse<never>;
    };
    error.status = 404;
    error.body = {
      success: false,
      error: {
        message: 'Session not found',
        code: ApiErrorCode.SESSION_NOT_FOUND,
        details: 'Details here',
        suggestedAction: 'Try again',
      },
    };

    const result = extractApiError(error);

    expect(result.message).toBe('Session not found');
    expect(result.code).toBe(ApiErrorCode.SESSION_NOT_FOUND);
    expect(result.status).toBe(404);
    expect(result.details).toBe('Details here');
    expect(result.suggestedAction).toBe('Try again');
  });

  it('should handle plain Error', () => {
    const error = new Error('Something went wrong');
    const result = extractApiError(error);

    expect(result.message).toBe('Something went wrong');
    expect(result.code).toBeUndefined();
  });

  it('should handle string errors', () => {
    const result = extractApiError('String error message');

    expect(result.message).toBe('String error message');
  });

  it('should use fallback message for unknown errors', () => {
    const result = extractApiError(null, 'Fallback message');

    expect(result.message).toBe('Fallback message');
  });

  it('should detect retryable server errors', () => {
    const error = new Error('Server error') as Error & {
      status: number;
      code: string;
    };
    error.status = 500;
    error.code = ApiErrorCode.INTERNAL_SERVER_ERROR;

    const result = extractApiError(error);

    expect(result.isRetryable).toBe(true);
  });
});

describe('getUserFriendlyErrorMessage', () => {
  it('should return description for known error codes', () => {
    const error: ApiMutationError = new Error('Test');
    error.code = ApiErrorCode.SESSION_NOT_FOUND;

    const message = getUserFriendlyErrorMessage(error);

    expect(message).toBe('The requested session was not found');
  });

  it('should return suggestedAction if available', () => {
    const error: ApiMutationError = new Error('Test');
    error.suggestedAction = 'Please try again later';

    const message = getUserFriendlyErrorMessage(error);

    expect(message).toBe('Please try again later');
  });

  it('should fallback to error message', () => {
    const error: ApiMutationError = new Error('Custom error message');

    const message = getUserFriendlyErrorMessage(error);

    expect(message).toBe('Custom error message');
  });
});
