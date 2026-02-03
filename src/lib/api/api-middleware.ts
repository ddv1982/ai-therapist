// Re-export all middleware functions from the simplified middleware module
export {
  withApiMiddleware,
  withAuth,
  withValidation,
  withValidationAndParams,
  withRateLimitUnauthenticated,
  withAuthAndRateLimit,
  withAuthAndRateLimitStreaming,
  type RequestContext,
  type AuthenticatedRequestContext,
} from '@/lib/api/middleware';
