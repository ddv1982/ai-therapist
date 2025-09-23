import { NextRequest } from 'next/server';
import { verifyTOTPToken, verifyBackupCode, isTOTPSetup, getTOTPDiagnostics } from '@/lib/auth/totp-service';
import { getOrCreateDevice, createAuthSession } from '@/lib/auth/device-fingerprint';
import { getClientIP } from '@/lib/auth/auth-middleware';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { withRateLimitUnauthenticated } from '@/lib/api/api-middleware';
import { 
  createSuccessResponse, 
  createErrorResponse
} from '@/lib/api/api-response';

// POST /api/auth/verify - Verify TOTP token or backup code
export const POST = withRateLimitUnauthenticated(async (request: NextRequest, context) => {
  const requestId = context.requestId;
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
    
    logger.secureDevLog(`\n=== AUTH REQUEST [${requestId}] ===${ isMobile ? ' 📱 MOBILE' : ' 🖥️  DESKTOP' }`);
    logger.secureDevLog(`Time: ${new Date().toISOString()}`);
    logger.secureDevLog(`Type: ${isBackupCode ? 'Backup Code' : 'TOTP Token'}`);
    logger.secureDevLog('Auth request headers', { host, origin, referer, forwarded, realIp, userAgent, tokenLength: token?.length || 0 });

    if (!token) {
      logger.secureDevLog(`[${requestId}] ❌ ERROR: No token provided`);
      logger.secureDevLog(`=== AUTH REQUEST END [${requestId}] FAILED ===\n`);
      return createErrorResponse('Token is required', 400, { requestId });
    }

    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      logger.secureDevLog(`[${requestId}] ❌ ERROR: TOTP not configured`);
      logger.secureDevLog(`=== AUTH REQUEST END [${requestId}] FAILED ===\n`);
      return createErrorResponse('TOTP not configured', 400, { requestId });
    }

    let isValid = false;

    if (isBackupCode) {
      logger.secureDevLog(`[${requestId}] 🔑 Verifying backup code...`);
      isValid = await verifyBackupCode(token);
      logger.secureDevLog(`[${requestId}] Backup code result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    } else {
      logger.secureDevLog(`[${requestId}] 🔢 Verifying TOTP token...`);
      
      // Add mobile-specific diagnostics before verification
      if (isMobile) {
        try {
          const diagnostics = await getTOTPDiagnostics(token);
          logger.secureDevLog(`[${requestId}] 📱 Mobile TOTP Diagnostics:`, {
            serverTime: new Date(diagnostics.currentTime * 1000).toISOString(),
            currentToken: diagnostics.currentToken,
            providedToken: token,
            precheckValid: diagnostics.providedTokenValid ? '✅' : '❌'
          });
        } catch (diagError) {
          logger.secureDevLog(`[${requestId}] ⚠️  Mobile diagnostics failed: ${String(diagError)}`);
        }
      }
      
      isValid = await verifyTOTPToken(token);
      logger.secureDevLog(`[${requestId}] TOTP token result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    if (!isValid) {
      const duration = Date.now() - startTime;
      logger.secureDevLog(`[${requestId}] ❌ AUTHENTICATION FAILED (${duration}ms)`);
      
      if (isMobile) {
        logger.secureDevLog(`[${requestId}] 📱 MOBILE AUTH FAILURE - Check time sync between device and server`);
      }
      
      logger.secureDevLog(`=== AUTH REQUEST END [${requestId}] FAILED ===\n`);
      return createErrorResponse('Invalid token', 401, { requestId });
    }

    const duration = Date.now() - startTime;
    logger.secureDevLog(`[${requestId}] ✅ AUTHENTICATION SUCCESSFUL (${duration}ms)`);
    logger.secureDevLog(`[${requestId}] 🔧 Creating device and session...`);

    // Create device and session for authentication
    const device = await getOrCreateDevice(userAgent, ipAddress);
    const session = await createAuthSession(device.deviceId, ipAddress);

    logger.secureDevLog(`[${requestId}] ✅ Session created for device: ${device.name}`);
    logger.secureDevLog(`[${requestId}] Session token: ${session.sessionToken.substring(0, 8)}...`);
    logger.secureDevLog(`[${requestId}] Session expires: ${session.expiresAt.toISOString()}`);
    
    if (isMobile) {
      logger.secureDevLog(`[${requestId}] 📱 Mobile session created - cookie will be set for domain: ${host}`);
    }
    
    logger.secureDevLog(`=== AUTH REQUEST END [${requestId}] SUCCESS ===\n`);

    // Return success with authentication (no redirect, let frontend handle it)
    const response = createSuccessResponse({ 
      authenticated: true,
      redirectUrl: '/',
      deviceName: device.name
    }, { requestId });
    
    // Set the authentication cookie with stricter security
    const isHttps = request.nextUrl.protocol === 'https:';
    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('auth-session-token', session.sessionToken, {
      httpOnly: true,
      // In development and on LAN over http, allow non-secure cookie so auth works
      secure: isProd || isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days to align with DB session
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
    logger.secureDevLog(`=== AUTH REQUEST END [${requestId}] ERROR ===\n`);
    return createErrorResponse('Verification failed', 500, { requestId });
  }
});
