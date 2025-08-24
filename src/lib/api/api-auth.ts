import { NextRequest } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/device-fingerprint';
import { isTOTPSetup } from '@/lib/auth/totp-service';
import { isLocalhost } from '@/lib/utils/utils';

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  sessionData?: {
    sessionToken: string;
    expiresAt: Date;
    deviceId: string;
  };
  deviceInfo?: {
    deviceId: string;
    name: string;
    fingerprint: string;
  };
  error?: string;
}

/**
 * Validate authentication for API routes
 * Returns true for localhost during development, otherwise checks TOTP and session
 */
export async function validateApiAuth(request: NextRequest): Promise<AuthValidationResult> {
  // Robust host detection for localhost allowance in tests and local runs
  const headerHost = request.headers.get('host') || '';
  const forwardedHost = request.headers.get('x-forwarded-host');
  let host = headerHost;
  try {
    // Fallback to URL parsing when host header is unavailable in test mocks
    if (!host) {
      const url = (request as unknown as { url?: string; nextUrl?: URL }).nextUrl?.host ||
                  (request as unknown as { url?: string }).url ? new URL((request as unknown as { url?: string }).url as string).host : '';
      host = url || '';
    }
  } catch {}
  
  // Always allow localhost access during development
  if (isLocalhost(host) && (!forwardedHost || isLocalhost(forwardedHost))) {
    return { isValid: true };
  }
  
  // Check if TOTP is set up
  const isSetup = await isTOTPSetup();
  if (!isSetup) {
    return { 
      isValid: false, 
      error: 'Authentication not configured' 
    };
  }
  
  // Check for valid session token
  const sessionToken = request.cookies.get('auth-session-token')?.value;
  if (!sessionToken) {
    return { 
      isValid: false, 
      error: 'No authentication token' 
    };
  }
  
  // Verify the session
  const deviceInfo = await verifyAuthSession(sessionToken);
  if (!deviceInfo) {
    return { 
      isValid: false, 
      error: 'Invalid or expired authentication token' 
    };
  }
  
  return {
    isValid: true,
    deviceInfo: {
      deviceId: deviceInfo.deviceId,
      name: deviceInfo.name,
      fingerprint: deviceInfo.fingerprint,
    },
  };
}

/**
 * Create a standardized error response for authentication failures
 */
export function createAuthErrorResponse(error: string, status: number = 401) {
  return Response.json({ error }, { status });
}