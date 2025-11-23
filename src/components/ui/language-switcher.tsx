'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  function setLocaleCookie(next: Locale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  function selectLocale(next: Locale) {
    if (next === locale) return;
    setLocaleCookie(next);
    const segments = pathname.split('/');
    const first = segments[1] ?? '';
    const withoutLocale = routing.locales.includes(first as Locale)
      ? `/${segments.slice(2).join('/')}`
      : pathname;
    const dest = withoutLocale === '' ? '/' : withoutLocale;
    window.location.assign(dest);
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-muted/60 p-1 shadow-apple-xs backdrop-blur-sm ${className ?? ''}`}
      role="group"
      aria-label="Language toggle"
    >
      <button
        type="button"
        className={`rounded-full px-2 py-1 text-sm font-semibold transition-all duration-200 ${locale === 'en' ? 'bg-background text-foreground shadow-apple-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'}`}
        aria-pressed={locale === 'en'}
        aria-label="Switch language to English"
        onClick={() => selectLocale('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`rounded-full px-2 py-1 text-sm font-semibold transition-all duration-200 ${locale === 'nl' ? 'bg-background text-foreground shadow-apple-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'}`}
        aria-pressed={locale === 'nl'}
        aria-label="Switch language to Nederlands"
        onClick={() => selectLocale('nl')}
      >
        NL
      </button>
    </div>
  );
}
