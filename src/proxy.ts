import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCSPNonce, getSecurityHeaders } from '@/lib/security/csp-nonce';
import { routing, type Locale } from '@/i18n/routing';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)',
  '/clerk-webhook(.*)',
] as const;

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES]);

/**
 * Next.js 16 Proxy (formerly middleware) for authentication and CSP headers.
 *
 * Responsibilities:
 * - Protects non-public routes via Clerk auth.protect()
 * - Adds CSP security headers to page routes (browser security)
 * - Lets Clerk handle API route responses for proper session forwarding
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Protect non-public routes FIRST (before any other logic)
  const authResult: unknown = !isPublicRoute(req) ? await auth.protect() : null;
  const authResponse: NextResponse | undefined =
    authResult instanceof Response ? (authResult as NextResponse) : undefined;

  // API routes: let Clerk handle response internally (no CSP needed for JSON)
  // This ensures Clerk's session context is properly forwarded to route handlers
  if (req.nextUrl.pathname.startsWith('/api')) {
    if (authResponse) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHENTICATED',
            details: 'Authentication required',
            suggestedAction: 'Please sign in and try again',
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (authResponse) {
    return authResponse;
  }

  // Page routes: add CSP headers for browser security
  const response = NextResponse.next();
  const nonce = generateCSPNonce();
  const isDev = process.env.NODE_ENV === 'development';

  const securityHeaders = getSecurityHeaders(nonce, isDev);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Store nonce in header for use in server components via headers()
  response.headers.set('x-csp-nonce', nonce);

  // Cache locale from cookie in header (faster than re-reading in layout)
  // Also set the cookie if missing to ensure API routes use the correct locale
  const localeCookie = req.cookies.get('NEXT_LOCALE')?.value;
  if (localeCookie && routing.locales.includes(localeCookie as Locale)) {
    response.headers.set('x-locale', localeCookie);
  } else {
    // No valid cookie - set default locale cookie to prevent API using browser's Accept-Language
    const defaultLocale = routing.defaultLocale;
    response.cookies.set('NEXT_LOCALE', defaultLocale, {
      path: '/',
      sameSite: 'lax',
      // Don't set httpOnly so JavaScript can read it if needed
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    response.headers.set('x-locale', defaultLocale);
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
