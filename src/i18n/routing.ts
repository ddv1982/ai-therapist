import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'nl'],
  defaultLocale: 'en',
  // Use 'never' to keep URLs clean without locale prefixes
  // This matches your current setup where you handle locale via cookie
  localePrefix: 'never',
});

// Export types for backwards compatibility with existing code
export type Locale = (typeof routing.locales)[number];
