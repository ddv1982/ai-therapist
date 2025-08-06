import { NextRequest, NextResponse } from 'next/server';
import { getRateLimiter } from '@/lib/rate-limiter';

function getClientIP(request: NextRequest): string {
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  
  // Skip API routes - CSRF protection handled at individual route level
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Skip middleware for static files, authentication pages, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/auth/') || // Skip auth pages to prevent redirect loops
    pathname.includes('.') ||
    pathname === '/auth'
  ) {
    return NextResponse.next();
  }
  
  // Apply rate limiting to prevent abuse
  const rateLimiter = getRateLimiter();
  const rateLimitResult = rateLimiter.checkRateLimit(clientIP);
  
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.retryAfter || 300; // Reduced from 900 to 5 minutes
    return new Response('Rate limit exceeded. Please try again later.', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': retryAfter.toString()
      }
    });
  }
  
  // Continue to main application pages
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};