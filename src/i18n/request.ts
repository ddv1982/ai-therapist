import {getRequestConfig} from 'next-intl/server';
import type {AbstractIntlMessages} from 'next-intl';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, type AppLocale } from '@/i18n/config';

function expandDotNotation(flatMessages: Record<string, unknown>): Record<string, unknown> {
  const nested: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flatMessages)) {
    const parts = key.split('.');
    let current: Record<string, unknown> = nested;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (i === parts.length - 1) {
        current[part] = value;
      } else {
        if (typeof current[part] !== 'object' || current[part] === null || Array.isArray(current[part])) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
    }
  }
  return nested;
}

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;
  const resolved = locale ?? 'en';
  const flat = (await import(`./messages/${resolved}.json`)).default as Record<string, unknown>;
  const nested = expandDotNotation(flat) as AbstractIntlMessages;
  // Return only nested keys; dot keys are invalid in next-intl v3
  const messages: AbstractIntlMessages = nested;
  return {
    locale: resolved,
    messages
  };
});

// Resolve locale for API routes from cookie or Accept-Language header
export function getApiRequestLocale(request: NextRequest): AppLocale {
  const cookieVal = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieVal && (locales as readonly string[]).includes(cookieVal)) {
    return cookieVal as AppLocale;
  }
  const accept = request.headers.get('accept-language') || '';
  const primary = accept.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (primary && (locales as readonly string[]).includes(primary)) {
    return primary as AppLocale;
  }
  return defaultLocale;
}
