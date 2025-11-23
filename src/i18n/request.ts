import { getRequestConfig } from 'next-intl/server';
import type { NextRequest } from 'next/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing, type Locale } from './routing';

/**
 * Converts flat JSON with dot notation to nested structure
 * Example: { "auth.title": "Sign in" } -> { auth: { title: "Sign in" } }
 * 
 * This is required because next-intl does not support dots in keys.
 * See: https://next-intl-docs.vercel.app/docs/usage/messages#structuring-messages
 */
function expandDotNotation(flatMessages: Record<string, unknown>): Record<string, unknown> {
  const nested: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(flatMessages)) {
    const parts = key.split('.');
    let current: Record<string, unknown> = nested;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (i === parts.length - 1) {
        // Last part: assign the value
        current[part] = value;
      } else {
        // Intermediate part: ensure object exists
        if (
          typeof current[part] !== 'object' ||
          current[part] === null ||
          Array.isArray(current[part])
        ) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
    }
  }
  
  return nested;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Ensure the locale is valid, fallback to default if not
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  // Load flat JSON and expand dot notation to nested structure
  const flatMessages = (await import(`./messages/${locale}.json`)).default as Record<string, unknown>;
  const nestedMessages = expandDotNotation(flatMessages) as AbstractIntlMessages;

  return {
    locale,
    messages: nestedMessages,
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
