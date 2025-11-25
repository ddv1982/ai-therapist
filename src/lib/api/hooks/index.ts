/**
 * API Hooks
 *
 * Unified hooks for API interactions with consistent error handling
 */

export {
  useApiMutation,
  useApiMutationWithProgress,
  extractApiError,
  getUserFriendlyErrorMessage,
  type ApiMutationError,
  type UseApiMutationOptions,
  type UseApiMutationReturn,
} from './use-api-mutation';
