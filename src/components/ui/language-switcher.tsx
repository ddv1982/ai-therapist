'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { locales, type AppLocale } from '@/i18n/config';

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();

  function setLocaleCookie(next: AppLocale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  function selectLocale(next: AppLocale) {
    if (next === locale) return;
    setLocaleCookie(next);
    const segments = pathname.split('/');
    const first = segments[1] ?? '';
    const withoutLocale = (locales as readonly string[]).includes(first)
      ? `/${segments.slice(2).join('/')}`
      : pathname;
    const dest = withoutLocale === '' ? '/' : withoutLocale;
    window.location.assign(dest);
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-gray-200 p-1 dark:bg-gray-700 ${className ?? ''}`}
      role="group"
      aria-label="Language toggle"
    >
      <button
        type="button"
        className={`rounded-full px-2 py-1 text-sm transition-colors ${locale === 'en' ? 'bg-white text-gray-900 dark:text-gray-900' : 'text-gray-700 dark:text-gray-200'}`}
        aria-pressed={locale === 'en'}
        aria-label="Switch language to English"
        onClick={() => selectLocale('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`rounded-full px-2 py-1 text-sm transition-colors ${locale === 'nl' ? 'bg-white text-gray-900 dark:text-gray-900' : 'text-gray-700 dark:text-gray-200'}`}
        aria-pressed={locale === 'nl'}
        aria-label="Switch language to Nederlands"
        onClick={() => selectLocale('nl')}
      >
        NL
      </button>
    </div>
  );
}
