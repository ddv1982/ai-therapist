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
  const forwardedHostHeader = request.headers.get('x-forwarded-host') || '';
  const forwardedHost = forwardedHostHeader.split(',')[0]?.trim();
  const hostname = request.nextUrl?.hostname || request.headers.get('host') || '';
  const ipAttribute = (request as unknown as { ip?: string | null }).ip || '';
  const remoteAddress = (request as unknown as { socket?: { remoteAddress?: string | null } }).socket?.remoteAddress || '';
  const normalizedIp = normalizeLoopback(ipAttribute) || normalizeLoopback(remoteAddress);

  const isDevEnvironment = process.env.NODE_ENV !== 'production';
  // Unified dev bypass flag (matches auth-middleware semantics)
  const localBypassEnabled = isDevEnvironment && process.env.BYPASS_AUTH === 'true';
  const hostnameIsLocal = isLocalhost(hostname || '');
  const forwardedHostIsLocal = !forwardedHost || isLocalhost(forwardedHost);
  const clientIpIsLocal = normalizedIp ? isLocalhost(normalizedIp) : false;

  if (localBypassEnabled && hostnameIsLocal && forwardedHostIsLocal && clientIpIsLocal) {
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
// Deprecated: createAuthErrorResponse has been replaced by standardized helpers in api-response.ts

function normalizeLoopback(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice('::ffff:'.length);
  }
  return trimmed;
}
