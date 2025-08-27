export const locales = ['en', 'nl'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'en';
