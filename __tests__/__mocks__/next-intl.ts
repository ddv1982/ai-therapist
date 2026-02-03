import type { ReactNode } from 'react';

// Mock for next-intl to avoid ESM issues in tests while still providing sensible translations
const defaultMessages = require('../../src/i18n/messages/en.json') as Record<string, unknown>;

function resolveMessage(namespace: string | undefined, key: string): unknown {
  const fullKey = namespace ? `${namespace}.${key}` : key;
  if (Object.prototype.hasOwnProperty.call(defaultMessages, fullKey)) {
    return defaultMessages[fullKey];
  }

  const segments = fullKey.split('.');
  return segments.reduce(
    (acc: any, segment) => (acc && acc[segment] !== undefined ? acc[segment] : undefined),
    defaultMessages
  );
}

function interpolate(message: unknown, values: Record<string, string | number> = {}) {
  if (typeof message !== 'string') return message;
  return message.replace(/\{(\w+)\}/g, (_, token) => String(values[token] ?? `{${token}}`));
}

function useTranslations(namespace?: string) {
  const translate = (key: string, values?: Record<string, string | number>) => {
    const message = resolveMessage(namespace, key);
    if (message === undefined) {
      if (values && Object.keys(values).length > 0) {
        const fallbackTemplate = namespace ? `${namespace}.${key}` : key;
        return interpolate(fallbackTemplate, values);
      }
      return undefined;
    }

    if (Array.isArray(message) || typeof message === 'object') {
      return message;
    }

    return interpolate(message, values);
  };

  (translate as any).raw = (key: string) => resolveMessage(namespace, key);
  (translate as any).rich = translate;

  return translate;
}

function useFormatter() {
  return {
    dateTime: (value: unknown) => value,
    number: (value: unknown) => value,
    relativeTime: (value: unknown) => value,
  };
}

function useLocale() {
  return 'en';
}

function NextIntlClientProvider({ children }: { children: ReactNode }) {
  return children;
}

// Mock for defineRouting from next-intl/routing
function defineRouting<T>(config: T): T {
  return config;
}

const nextIntlMock = {
  useTranslations,
  useFormatter,
  useLocale,
  NextIntlClientProvider,
  defineRouting,
};

export default nextIntlMock;
export { useTranslations, useFormatter, useLocale, NextIntlClientProvider, defineRouting };
