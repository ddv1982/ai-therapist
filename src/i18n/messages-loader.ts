import type { AbstractIntlMessages } from 'next-intl';
import type { AppLocale } from '@/i18n/config';

type FlatMessages = Record<string, unknown>;

const cache = new Map<AppLocale, AbstractIntlMessages>();

function expandDotNotation(flatMessages: FlatMessages): Record<string, unknown> {
  const nested: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flatMessages)) {
    const parts = key.split('.');
    let current: Record<string, unknown> = nested;
    for (let i = 0; i < parts.length; i += 1) {
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

async function loadFlatMessages(locale: AppLocale): Promise<FlatMessages> {
  if (locale === 'nl') {
    return (await import('@/i18n/messages/nl.json')).default as FlatMessages;
  }
  return (await import('@/i18n/messages/en.json')).default as FlatMessages;
}

export async function getMessagesForLocale(locale: AppLocale): Promise<AbstractIntlMessages> {
  if (cache.has(locale)) {
    return cache.get(locale)!;
  }
  const flat = await loadFlatMessages(locale);
  const nested = expandDotNotation(flat) as AbstractIntlMessages;
  cache.set(locale, nested);
  return nested;
}
