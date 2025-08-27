import { NextRequest, NextResponse } from 'next/server';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/config';

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

const handleI18n = createMiddleware({
  locales,
  defaultLocale,
  // Do not prefix locale in the URL; rely on cookie/headers only
  localePrefix: 'never',
  localeDetection: true
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  
  // Skip API routes - CSRF protection handled at individual route level
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Let next-intl handle locale-prefixing for non-API/static paths
  const i18nResponse = handleI18n(request);
  if (i18nResponse) return i18nResponse;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
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
  matcher: ['/((?!api|_next|static|.*\\..*).*)'],
};