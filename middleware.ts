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
  '/api/webhook(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Generate CSP nonce for this request
  const nonce = generateCSPNonce();
  const isDev = process.env.NODE_ENV === 'development';
  
  // Get the response from Clerk
  let response: NextResponse;
  
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    response = NextResponse.next();
  } else {
    // Protect all other routes (including home page)
    await auth.protect();
    response = NextResponse.next();
  }

  // Add security headers including CSP with nonce
  const securityHeaders = getSecurityHeaders(nonce, isDev);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Store nonce in header for potential use in pages/components
  // (though Next.js doesn't easily expose this to React components)
  response.headers.set('x-csp-nonce', nonce);
  
  return response;
}, {
  // Enable CSRF protection for all authenticated requests
  // This protects against cross-site request forgery attacks
  enableCSRFProtection: true,
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always match API routes
    '/(api|trpc)(.*)',
  ],
};
