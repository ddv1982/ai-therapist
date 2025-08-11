import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTPToken, verifyBackupCode, isTOTPSetup, getTOTPDiagnostics } from '@/lib/auth/totp-service';
import { getOrCreateDevice, createAuthSession } from '@/lib/auth/device-fingerprint';
import { getClientIP } from '@/lib/auth/auth-middleware';
import { generateSecureRandomString } from '@/lib/utils/utils';
import { devLog } from '@/lib/utils/logger';

// POST /api/auth/verify - Verify TOTP token or backup code
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      devLog(`[${requestId}] ❌ ERROR: TOTP not configured`);
      devLog(`=== AUTH REQUEST END [${requestId}] FAILED ===\n`);
      return NextResponse.json({ error: 'TOTP not configured' }, { status: 400 });
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
      return NextResponse.json({ 
        error: 'Invalid token',
        debug: {
          requestId,
          isMobile,
          processingTime: duration
        }
      }, { status: 401 });
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
    const response = NextResponse.json({ 
      success: true,
      redirectUrl: '/',
      debug: {
        requestId,
        isMobile,
        sessionCreated: true,
        deviceName: device.name
      }
    });
    
    // Set the authentication cookie
    response.cookies.set('auth-session-token', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] 🚨 EXCEPTION during verification (${duration}ms):`);
    console.error(`Error: ${error}`);
    console.error(`Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    devLog(`=== AUTH REQUEST END [${requestId}] ERROR ===\n`);
    
    return NextResponse.json({ 
      error: 'Verification failed',
      debug: {
        requestId,
        processingTime: duration,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
}