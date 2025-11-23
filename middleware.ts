import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCSPNonce, getSecurityHeaders } from '@/lib/security/csp-nonce';

/**
 * Public routes that should be accessible without authentication
 */
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)',
]);

/**
 * Routes that should be exempt from CSRF protection
 * Webhooks use signature verification instead of CSRF tokens
 * Note: Clerk middleware applies CSRF to all routes by default when enabled
 */
const isWebhookRoute = createRouteMatcher([
  '/api/webhook(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Generate CSP nonce for this request
  const nonce = generateCSPNonce();
  const isDev = process.env.NODE_ENV === 'development';
  
  // Allow public routes and webhooks without authentication
  // Webhooks are public and use signature verification for security
  if (isPublicRoute(req) || isWebhookRoute(req)) {
    const response = NextResponse.next();
    
    // Add security headers including CSP with nonce
    const securityHeaders = getSecurityHeaders(nonce, isDev);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Store nonce in header for use in server components via headers()
    response.headers.set('x-csp-nonce', nonce);
    
    return response;
  }
  
  // Protect all other routes (including home page)
  await auth.protect();
  
  const response = NextResponse.next();

  // Add security headers including CSP with nonce
  const securityHeaders = getSecurityHeaders(nonce, isDev);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Store nonce in header for use in server components via headers()
  response.headers.set('x-csp-nonce', nonce);
  
  return response;
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always match API routes
    '/(api|trpc)(.*)',
  ],
};
