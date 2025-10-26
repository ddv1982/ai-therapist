import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
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

/**
 * Define which routes are protected (require Clerk authentication)
 * Most application routes require authentication
 */
const isProtectedRoute = createRouteMatcher([
  '/(.*)',
]);

/**
 * Define public routes that don't require authentication
 */
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)',
]);

/**
 * Clerk middleware for Next.js App Router
 * Handles authentication and injects auth context into requests
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Protect routes if needed
  if (isProtectedRoute(request) && !isPublicRoute(request)) {
    await auth.protect();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _clientIP = getClientIP(request);

  // Skip API routes - CSRF protection handled at individual route level
  // Webhooks are handled separately
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
});

export const config = {
  // Clerk middleware needs to run on all routes
  // but will skip authentication checks for public routes
  matcher: [
    // Include everything
    '/((?!.+\\.[\\w]+$|_next).*)',
    // Re-include API routes
    '/(api|trpc)(.*)',
  ],
};
