import { getRequestConfig } from 'next-intl/server';
import type { NextRequest } from 'next/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Ensure the locale is valid, fallback to default if not
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

/**
 * Resolve locale for API routes from cookie or Accept-Language header
 * Use this in API routes where next-intl's automatic locale detection isn't available
 */
export function getApiRequestLocale(request: NextRequest): Locale {
  // Check for explicit locale cookie first
  const cookieVal = request.cookies?.get('NEXT_LOCALE')?.value;
  if (cookieVal && routing.locales.includes(cookieVal as Locale)) {
    return cookieVal as Locale;
  }

  // Fall back to Accept-Language header
  const accept = request.headers.get('accept-language') || '';
  const primary = accept.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (primary && routing.locales.includes(primary as Locale)) {
    return primary as Locale;
  }

  return routing.defaultLocale;
}
