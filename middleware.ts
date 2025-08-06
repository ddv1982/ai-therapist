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
  
  // Skip middleware for API routes, static files, authentication pages, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/auth/') || // Skip auth pages to prevent redirect loops
    pathname.includes('.') ||
    pathname === '/auth' ||
    pathname === '/' // Main page should handle auth internally
  ) {
    return NextResponse.next();
  }
  
  // Apply rate limiting to prevent abuse (but only for non-auth pages)
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
  
  // For now, allow all requests - authentication will be handled at component level
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