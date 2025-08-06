import { NextRequest } from 'next/server';
import { verifyAuthSession } from '@/lib/device-fingerprint';
import { isTOTPSetup } from '@/lib/totp-service';
import { isLocalhost } from '@/lib/utils';

export interface AuthValidationResult {
  isValid: boolean;
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
  const host = request.headers.get('host') || '';
  const forwardedHost = request.headers.get('x-forwarded-host');
  
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