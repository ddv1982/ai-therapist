// Re-export all middleware functions from the simplified middleware module
export {
  withApiMiddleware,
  withAuth,
  withAuthStreaming,
  withValidation,
  withValidationAndParams,
  withRateLimitUnauthenticated,
  withAuthAndRateLimit,
  withAuthAndRateLimitStreaming,
  type RequestContext,
  type AuthenticatedRequestContext,
} from '@/lib/api/middleware';

// Re-export error handlers
export { errorHandlers } from '@/lib/api/middleware/error-handlers';
