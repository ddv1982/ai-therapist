import { NextRequest, NextResponse } from 'next/server';
import { getClientIPFromRequest } from '@/lib/api/middleware/request-utils';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

// Use shared helper for consistent IP extraction across the app
const getClientIP = getClientIPFromRequest;

const handleI18n = createMiddleware({
  locales,
  defaultLocale,
  // Do not prefix locale in the URL; rely on cookie/headers only
  localePrefix: 'never',
  localeDetection: true
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _clientIP = getClientIP(request);
  
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
  
  // Continue to main application pages
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|.*\\..*).*)'],
};
