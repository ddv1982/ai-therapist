import {getRequestConfig} from 'next-intl/server';
import type {AbstractIntlMessages} from 'next-intl';

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
  // Provide both nested and flat keys to be resilient during migration
  const messages: AbstractIntlMessages = { ...(flat as AbstractIntlMessages), ...nested };
  return {
    locale: resolved,
    messages
  };
});
