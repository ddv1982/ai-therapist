/**
 * Routes that don't require authentication.
 * Used by proxy.ts to skip auth.protect() calls.
 */
export const PUBLIC_ROUTES = [
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)',
  '/api/webhook(.*)',
] as const;
