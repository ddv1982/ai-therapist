import { NextRequest } from 'next/server';
import { withApiMiddleware } from '@/lib/api/api-middleware';
import { createSuccessResponse, createForbiddenErrorResponse } from '@/lib/api/api-response';
import { resetTOTPConfig } from '@/lib/auth/totp-service';

// POST /api/auth/setup/reset - Development-only endpoint to reset TOTP setup and sessions
export const POST = withApiMiddleware(async (request: NextRequest, context) => {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return createForbiddenErrorResponse('Reset allowed only in development environment', context.requestId);
  }

  // Restrict to localhost access
  const headerHost = request.headers.get('host') || '';
  const forwardedHost = request.headers.get('x-forwarded-host') || '';
  const host = headerHost.split(':')[0];
  const fwd = forwardedHost.split(':')[0];
  const isLocal = (h: string) => h === 'localhost' || h === '127.0.0.1' || h === '';

  if (!isLocal(host) || (forwardedHost && !isLocal(fwd))) {
    return createForbiddenErrorResponse('Reset endpoint is restricted to localhost access', context.requestId);
  }

  await resetTOTPConfig();

  return createSuccessResponse({ reset: true }, { requestId: context.requestId });
});
