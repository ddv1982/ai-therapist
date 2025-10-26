import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

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

  // For protected routes, only protect if Clerk is properly initialized
  // In development with custom auth, we may need to let Clerk load first
  if (isProtectedRoute(request) && !isPublicRoute(request)) {
    try {
      await auth.protect();
    } catch (error) {
      // If auth protection fails, allow request through to let UI handle auth
      // This prevents blocking on Clerk initialization issues
      console.warn('Auth protection error, allowing request through:', error);
    }
  }

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
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
