import { NextRequest } from 'next/server';
import { generateTOTPSetup, saveTOTPConfig, isTOTPSetup } from '@/lib/auth/totp-service';
import { getOrCreateDevice, createAuthSession } from '@/lib/auth/device-fingerprint';
import { getClientIP } from '@/lib/auth/auth-middleware';
import { handleApiError } from '@/lib/utils/error-utils';
import { withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// GET /api/auth/setup - Get setup data (QR code, backup codes)
export const GET = withAuthAndRateLimit(async () => {
  try {
    // Check if TOTP is already set up
    const isSetup = await isTOTPSetup();
    if (isSetup) {
      return createErrorResponse('TOTP already configured', 400);
    }

    // Generate TOTP setup data
    const setupData = await generateTOTPSetup();
    
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
export const POST = withAuthAndRateLimit(async (request: NextRequest) => {
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