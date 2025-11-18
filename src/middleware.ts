import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
// i18n middleware plugin available but unused to prevent rewrites in dev
// import createMiddleware from 'next-intl/middleware';
// import { locales, defaultLocale } from '@/i18n/config';

// Note: i18n middleware disabled in Clerk-less fallback and in main flow to avoid rewrites
// const _handleI18n = createMiddleware({
//   locales,
//   defaultLocale,
//   localePrefix: 'never',
//   localeDetection: true
// });

/**
 * Define which routes are protected (require Clerk authentication)
 * Excludes public routes, API, and root page (which handles its own redirects)
 */
const isProtectedRoute = createRouteMatcher([
  '/cbt-diary(.*)',
  '/profile(.*)',
  '/reports(.*)',
  '/test(.*)',
]);

/**
 * Define public routes that don't require authentication
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)',
]);

/**
 * Clerk middleware for Next.js App Router
 * Handles authentication and injects auth context into requests
 */
// Fallback-only i18n handler (used when Clerk keys are missing)
async function handleI18nOnly(_request: NextRequest) {
  return NextResponse.next();
}

export default function middleware(request: NextRequest, event: unknown) {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  // If Clerk env is not configured, skip Clerk and run i18n only to avoid 404s
  if (!pk || !sk) {
    return handleI18nOnly(request);
  }

  const handler = async (auth: unknown, request: NextRequest) => {
    const { pathname } = request.nextUrl;
    const userId = (auth as { userId?: string | null }).userId;

    // Skip API routes - API auth is handled at individual route level via middleware
    if (pathname.startsWith('/api')) {
      return NextResponse.next();
    }

    // Skip middleware for static files and Next.js internals
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // If already signed in, avoid rendering auth pages; send to profile
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
      if (userId) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    }

    // For protected routes, check authentication
    // If not authenticated, auth.protect() will throw and should be caught by Clerk
    // to redirect to sign-in. Note: this relies on Clerk's default behavior.
    if (isProtectedRoute(request) && !isPublicRoute(request)) {
      // auth.protect() will redirect or throw if user is not authenticated
      // It's async and will handle the redirect internally
      await (auth as { protect: () => Promise<void> }).protect();
    }

    // Skip i18n middleware to avoid potential rewrites causing 404s

    // Continue to main application pages
    return NextResponse.next();
  };
  const mw = clerkMiddleware(handler);
  // @ts-expect-error: Next middleware signature includes event
  return mw(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
