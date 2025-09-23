import { NextRequest } from 'next/server';
import { generateTOTPSetup, saveTOTPConfig, isTOTPSetup, resetTOTPConfig } from '@/lib/auth/totp-service';
import { getOrCreateDevice, createAuthSession } from '@/lib/auth/device-fingerprint';
import { getClientIP } from '@/lib/auth/auth-middleware';
import { handleApiError } from '@/lib/utils/error-utils';
import { withRateLimitUnauthenticated, withApiMiddleware } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse, createForbiddenErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';

// Type declaration for global cache
declare global {
  var totpSetupCache: {
    data: {
      qrCodeUrl: string;
      manualEntryKey: string;
      backupCodes: string[];
      secret: string;
    };
    timestamp: number;
  } | undefined;
}

// GET /api/auth/setup - Get setup data (QR code, backup codes)
// Note: This endpoint must be accessible before authentication during initial setup
export const GET = withRateLimitUnauthenticated(async () => {
  try {
    // Check if TOTP is already set up
    const isSetup = await isTOTPSetup();
    if (isSetup) {
      return createErrorResponse('TOTP already configured', 400);
    }

    // Check if we have recent setup data in memory (to prevent QR code regeneration on refresh)
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes

    // Simple in-memory cache (in production, use Redis or similar)
    if (globalThis.totpSetupCache &&
        globalThis.totpSetupCache.timestamp &&
        (Date.now() - globalThis.totpSetupCache.timestamp) < cacheExpiry) {
      logger.info('Reusing cached TOTP setup data', { endpoint: '/api/auth/setup', phase: 'cache-hit' });
      return createSuccessResponse({
        qrCodeUrl: globalThis.totpSetupCache.data.qrCodeUrl,
        manualEntryKey: globalThis.totpSetupCache.data.manualEntryKey,
        backupCodes: globalThis.totpSetupCache.data.backupCodes,
        secret: globalThis.totpSetupCache.data.secret,
      });
    }

    logger.info('Generating new TOTP setup data', { endpoint: '/api/auth/setup', timestamp: new Date().toISOString() });

    // Generate TOTP setup data
    const setupData = await generateTOTPSetup();

    // Cache the setup data
    globalThis.totpSetupCache = {
      data: setupData,
      timestamp: Date.now()
    };
    
    return createSuccessResponse({
      qrCodeUrl: setupData.qrCodeUrl,
      manualEntryKey: setupData.manualEntryKey,
      backupCodes: setupData.backupCodes,
      secret: setupData.secret,
    });
  } catch (error) {
    return handleApiError(error, {
      operation: 'totp_setup_generation',
      category: 'authentication',
      severity: 'high',
      userMessage: 'Failed to initialize authentication setup. Please try again.'
    });
  }
});

// POST /api/auth/setup - Complete TOTP setup with verification
// Note: Also accessible pre-auth; guarded by isTOTPSetup() to prevent reconfiguration
export const POST = withRateLimitUnauthenticated(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { secret, backupCodes, verificationToken } = body;

    if (!secret || !backupCodes || !verificationToken) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Check if TOTP is already set up
    const isSetup = await isTOTPSetup();
    if (isSetup) {
      return createErrorResponse('TOTP already configured', 400);
    }

    // Verify the TOTP token with the provided secret
    const speakeasy = await import('speakeasy');
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: verificationToken,
      window: 2,
    });

    if (!isValid) {
      return createErrorResponse('Invalid verification token', 400);
    }

    // Save TOTP configuration
    await saveTOTPConfig(secret, backupCodes);

    // Clear the setup cache since setup is now complete
    if (globalThis.totpSetupCache) {
      delete globalThis.totpSetupCache;
    }

    // Create device and session for immediate authentication
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = getClientIP(request);
    
    const device = await getOrCreateDevice(userAgent, ipAddress);
    const session = await createAuthSession(device.deviceId, ipAddress);

    // Return success with authentication cookie
    const response = createSuccessResponse({ authenticated: true, redirectUrl: '/' });
    response.cookies.set('auth-session-token', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (error) {
    return handleApiError(error, {
      operation: 'totp_setup_completion',
      category: 'authentication',
      severity: 'high',
      userMessage: 'Failed to complete authentication setup. Please try again.'
    });
  }
});

// DELETE /api/auth/setup - Reset TOTP setup (development only)
// Consolidates the reset functionality from /auth/setup/reset
export const DELETE = withApiMiddleware(async (request: NextRequest, context) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return createForbiddenErrorResponse('Reset allowed only in development environment', context.requestId);
    }

    // Restrict to localhost access for security
    const headerHost = request.headers.get('host') || '';
    const forwardedHost = request.headers.get('x-forwarded-host') || '';
    const host = headerHost.split(':')[0];
    const fwd = forwardedHost.split(':')[0];
    const isLocal = (h: string) => h === 'localhost' || h === '127.0.0.1' || h === '';

    if (!isLocal(host) || (forwardedHost && !isLocal(fwd))) {
      return createForbiddenErrorResponse('Reset endpoint is restricted to localhost access', context.requestId);
    }

    await resetTOTPConfig();
    // Clear in-memory setup cache to avoid stale data after reset
    if (globalThis.totpSetupCache) {
      try { delete globalThis.totpSetupCache; } catch {}
    }

    return createSuccessResponse({ reset: true }, { requestId: context.requestId });
  } catch (error) {
    return handleApiError(error, {
      operation: 'totp_setup_reset',
      category: 'authentication',
      severity: 'medium',
      userMessage: 'Failed to reset authentication setup. Please try again.'
    });
  }
});