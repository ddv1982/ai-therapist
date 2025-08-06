import { NextRequest, NextResponse } from 'next/server';
import { generateSecureRandomString } from '@/lib/utils';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * CSRF Configuration
 */
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * CSRF Token data structure
 */
interface CSRFTokenData {
  token: string;
  timestamp: number;
  signature: string;
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const token = generateSecureRandomString(CSRF_TOKEN_LENGTH);
  const timestamp = Date.now();
  
  // Create signature to prevent token tampering
  const signature = createTokenSignature(token, timestamp);
  
  const tokenData: CSRFTokenData = {
    token,
    timestamp,
    signature,
  };
  
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

/**
 * Create signature for CSRF token to prevent tampering
 */
function createTokenSignature(token: string, timestamp: number): string {
  const secret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const data = `${token}:${timestamp}:${secret}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Verify CSRF token and check expiry
 */
export function verifyCSRFToken(providedToken: string): boolean {
  try {
    const tokenDataStr = Buffer.from(providedToken, 'base64').toString('utf8');
    const tokenData: CSRFTokenData = JSON.parse(tokenDataStr);
    
    // Check token structure
    if (!tokenData.token || !tokenData.timestamp || !tokenData.signature) {
      return false;
    }
    
    // Check if token has expired
    if (Date.now() - tokenData.timestamp > CSRF_TOKEN_EXPIRY) {
      return false;
    }
    
    // Verify signature to prevent tampering
    const expectedSignature = createTokenSignature(tokenData.token, tokenData.timestamp);
    const providedSignature = Buffer.from(tokenData.signature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (providedSignature.length !== expectedSignatureBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(providedSignature, expectedSignatureBuffer);
  } catch {
    return false;
  }
}

/**
 * Add CSRF token to response cookies
 */
export function addCSRFTokenToResponse(response: NextResponse): NextResponse {
  const token = generateCSRFToken();
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Client needs to read this for API calls
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
    path: '/',
  });
  
  return response;
}

/**
 * Middleware to validate CSRF tokens on state-changing requests
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Only validate CSRF for state-changing methods
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true; // GET, HEAD, OPTIONS don't need CSRF protection
  }
  
  // Skip CSRF validation for authentication endpoints during setup
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/auth/setup') || pathname.startsWith('/api/auth/verify')) {
    return true;
  }
  
  // Get CSRF token from header
  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
  
  if (!tokenFromHeader) {
    return false;
  }
  
  return verifyCSRFToken(tokenFromHeader);
}

/**
 * Create CSRF error response
 */
export function createCSRFErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'CSRF token validation failed', code: 'CSRF_INVALID' },
    { status: 403 }
  );
}

/**
 * Extract CSRF token from request cookies for client-side use
 */
export function getCSRFTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Generate initial CSRF response for pages
 */
export function createCSRFProtectedResponse(_request: NextRequest): NextResponse {
  const response = NextResponse.next();
  return addCSRFTokenToResponse(response);
}

/**
 * Client-side utility type for CSRF token
 */
export interface CSRFHeaders {
  'x-csrf-token': string;
}

/**
 * Helper to get CSRF headers for client-side API calls
 * This is used in the frontend to add CSRF tokens to requests
 */
export function getCSRFHeaders(): CSRFHeaders | Record<string, never> {
  if (typeof window === 'undefined') {
    return {}; // Server-side, no CSRF headers needed
  }
  
  // Get CSRF token from cookie
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith(`${CSRF_COOKIE_NAME}=`));
  
  if (!csrfCookie) {
    return {};
  }
  
  const token = csrfCookie.split('=')[1];
  return {
    'x-csrf-token': token,
  };
}