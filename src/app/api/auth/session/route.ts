import { NextRequest } from 'next/server';
import { verifyAuthSession, revokeAuthSession } from '@/lib/auth/device-fingerprint';
import { isTOTPSetup } from '@/lib/auth/totp-service';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { withRateLimitUnauthenticated, withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// GET /api/auth/session - Check session status
// This endpoint must be callable before authentication to drive the initial setup flow
export const GET = withRateLimitUnauthenticated(async (request: NextRequest) => {
  try {
    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    
    if (!sessionToken) {
      return createSuccessResponse({
        isAuthenticated: false,
        needsSetup: !isSetup,
        needsVerification: isSetup
      });
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    
    if (!deviceInfo) {
      return createSuccessResponse({
        isAuthenticated: false,
        needsSetup: !isSetup,
        needsVerification: isSetup
      });
    }

    return createSuccessResponse({
      isAuthenticated: true,
      needsSetup: false,
      needsVerification: false,
      device: {
        name: deviceInfo.name,
        deviceId: deviceInfo.deviceId,
      },
    });
  } catch (error) {
    logger.apiError('/api/auth/session', error as Error, createRequestLogger(request));
    return createErrorResponse('Failed to check session', 500);
  }
});

// DELETE /api/auth/session - Logout (revoke session)
export const DELETE = withAuthAndRateLimit(async (request: NextRequest, context) => {
  try {
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    
    if (sessionToken) {
      await revokeAuthSession(sessionToken);
    }
    // createLogoutResponse returns a NextResponse, but our wrapper expects ApiResponse.
    // For API consistency, respond with success and rely on client to redirect.
    return createSuccessResponse({ success: true }, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/auth/session', error as Error, createRequestLogger(request));
    return createErrorResponse('Logout failed', 500, { requestId: context.requestId });
  }
}, { windowMs: 5 * 60 * 1000 });