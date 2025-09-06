import { NextRequest } from 'next/server';
import { verifyTOTPToken, verifyBackupCode, isTOTPSetup, getTOTPDiagnostics } from '@/lib/auth/totp-service';
import { getOrCreateDevice, createAuthSession } from '@/lib/auth/device-fingerprint';
import { getClientIP } from '@/lib/auth/auth-middleware';
import { generateSecureRandomString } from '@/lib/utils/utils';
import { devLog, logger, createRequestLogger } from '@/lib/utils/logger';
import { withRateLimitUnauthenticated } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// POST /api/auth/verify - Verify TOTP token or backup code
export const POST = withRateLimitUnauthenticated(async (request: NextRequest) => {
  const requestId = generateSecureRandomString(8, 'abcdefghijklmnopqrstuvwxyz0123456789');
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { token, isBackupCode = false } = body;

    // Enhanced mobile debugging - capture all relevant headers
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = getClientIP(request);
    const host = request.headers.get('host');
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    // Detect if this is a mobile device
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    devLog(`\n=== AUTH REQUEST [${requestId}] ===${ isMobile ? ' 📱 MOBILE' : ' 🖥️  DESKTOP' }`);
    devLog(`Time: ${new Date().toISOString()}`);
    devLog(`Type: ${isBackupCode ? 'Backup Code' : 'TOTP Token'}`);
    devLog(`IP: ${ipAddress}`);
    devLog(`Host: ${host}`);
    devLog(`Origin: ${origin || 'none'}`);
    devLog(`Referer: ${referer || 'none'}`);
    devLog(`X-Forwarded-For: ${forwarded || 'none'}`);
    devLog(`X-Real-IP: ${realIp || 'none'}`);
    devLog(`User-Agent: ${userAgent}`);
    devLog(`Token Length: ${token?.length || 0}`);

    if (!token) {
      devLog(`[${requestId}] ❌ ERROR: No token provided`);
      devLog(`=== AUTH REQUEST END [${requestId}] FAILED ===\n`);
      return createErrorResponse('Token is required', 400);
    }

    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      devLog(`[${requestId}] ❌ ERROR: TOTP not configured`);
      devLog(`=== AUTH REQUEST END [${requestId}] FAILED ===\n`);
      return createErrorResponse('TOTP not configured', 400);
    }

    let isValid = false;

    if (isBackupCode) {
      devLog(`[${requestId}] 🔑 Verifying backup code...`);
      isValid = await verifyBackupCode(token);
      devLog(`[${requestId}] Backup code result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    } else {
      devLog(`[${requestId}] 🔢 Verifying TOTP token...`);
      
      // Add mobile-specific diagnostics before verification
      if (isMobile) {
        try {
          const diagnostics = await getTOTPDiagnostics(token);
          devLog(`[${requestId}] 📱 Mobile TOTP Diagnostics:`);
          devLog(`  Server time: ${new Date(diagnostics.currentTime * 1000).toISOString()}`);
          devLog(`  Current valid token: ${diagnostics.currentToken}`);
          devLog(`  Provided token: ${token}`);
          devLog(`  Pre-check valid: ${diagnostics.providedTokenValid ? '✅' : '❌'}`);
        } catch (diagError) {
          devLog(`[${requestId}] ⚠️  Mobile diagnostics failed: ${diagError}`);
        }
      }
      
      isValid = await verifyTOTPToken(token);
      devLog(`[${requestId}] TOTP token result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    if (!isValid) {
      const duration = Date.now() - startTime;
      devLog(`[${requestId}] ❌ AUTHENTICATION FAILED (${duration}ms)`);
      
      if (isMobile) {
        devLog(`[${requestId}] 📱 MOBILE AUTH FAILURE - Check time sync between device and server`);
      }
      
      devLog(`=== AUTH REQUEST END [${requestId}] FAILED ===\n`);
      return createErrorResponse('Invalid token', 401, { requestId });
    }

    const duration = Date.now() - startTime;
    devLog(`[${requestId}] ✅ AUTHENTICATION SUCCESSFUL (${duration}ms)`);
    devLog(`[${requestId}] 🔧 Creating device and session...`);

    // Create device and session for authentication
    const device = await getOrCreateDevice(userAgent, ipAddress);
    const session = await createAuthSession(device.deviceId, ipAddress);

    devLog(`[${requestId}] ✅ Session created for device: ${device.name}`);
    devLog(`[${requestId}] Session token: ${session.sessionToken.substring(0, 8)}...`);
    devLog(`[${requestId}] Session expires: ${session.expiresAt.toISOString()}`);
    
    if (isMobile) {
      devLog(`[${requestId}] 📱 Mobile session created - cookie will be set for domain: ${host}`);
    }
    
    devLog(`=== AUTH REQUEST END [${requestId}] SUCCESS ===\n`);

    // Return success with authentication (no redirect, let frontend handle it)
    const response = createSuccessResponse({ 
      authenticated: true,
      redirectUrl: '/',
      deviceName: device.name
    }, { requestId });
    
    // Set the authentication cookie with stricter security
    response.cookies.set('auth-session-token', session.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.apiError('/api/auth/verify', error as Error, {
      ...createRequestLogger(request),
      requestId,
      processingTime: duration
    });
    devLog(`=== AUTH REQUEST END [${requestId}] ERROR ===\n`);
    
    return createErrorResponse('Verification failed', 500, { requestId });
  }
});
