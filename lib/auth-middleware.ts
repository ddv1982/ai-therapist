import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/device-fingerprint';
import { isTOTPSetup } from '@/lib/totp-service';
import { isLocalhost } from '@/lib/utils';

export interface AuthResult {
  isAuthenticated: boolean;
  needsSetup: boolean;
  needsVerification: boolean;
  response?: NextResponse;
}

/**
 * Check authentication status for a request
 */
export async function checkAuth(request: NextRequest): Promise<AuthResult> {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Always allow localhost access without authentication during development
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (isLocalhost(host) && (!forwardedHost || isLocalhost(forwardedHost))) {
    return { isAuthenticated: true, needsSetup: false, needsVerification: false };
  }
  
  // Check if TOTP is set up
  const isSetup = await isTOTPSetup();
  
  // If TOTP is not set up, redirect to setup unless already on setup page
  if (!isSetup) {
    if (pathname === '/auth/setup' || pathname.startsWith('/api/auth/setup')) {
      return { isAuthenticated: false, needsSetup: true, needsVerification: false };
    }
    
    return {
      isAuthenticated: false,
      needsSetup: true,
      needsVerification: false,
      response: NextResponse.redirect(new URL('/auth/setup', request.url)),
    };
  }
  
  // Check for valid session token
  const sessionToken = request.cookies.get('auth-session-token')?.value;
  
  if (sessionToken) {
    const deviceInfo = await verifyAuthSession(sessionToken);
    if (deviceInfo) {
      // Valid session found
      return { isAuthenticated: true, needsSetup: false, needsVerification: false };
    }
  }
  
  // No valid session, need verification unless already on verify page
  if (pathname === '/auth/verify' || pathname.startsWith('/api/auth/verify')) {
    return { isAuthenticated: false, needsSetup: false, needsVerification: true };
  }
  
  return {
    isAuthenticated: false,
    needsSetup: false,
    needsVerification: true,
    response: NextResponse.redirect(new URL('/auth/verify', request.url)),
  };
}

/**
 * Create authentication response with session cookie
 */
export function createAuthResponse(sessionToken: string, redirectUrl?: string): NextResponse {
  const response = redirectUrl 
    ? NextResponse.redirect(new URL(redirectUrl, process.env.NEXTAUTH_URL || 'http://localhost:3000'))
    : NextResponse.json({ success: true });
    
  response.cookies.set('auth-session-token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
  
  return response;
}

/**
 * Create logout response (clear session cookie)
 */
export function createLogoutResponse(redirectUrl?: string): NextResponse {
  const response = redirectUrl 
    ? NextResponse.redirect(new URL(redirectUrl, process.env.NEXTAUTH_URL || 'http://localhost:3000'))
    : NextResponse.json({ success: true });
    
  response.cookies.delete('auth-session-token');
  return response;
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

/**
 * Middleware function to protect routes
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
  const authResult = await checkAuth(request);
  
  if (authResult.response) {
    return authResult.response;
  }
  
  // If authenticated, continue to the route
  if (authResult.isAuthenticated) {
    return NextResponse.next();
  }
  
  // This shouldn't happen if checkAuth is working correctly
  return NextResponse.redirect(new URL('/auth/verify', request.url));
}