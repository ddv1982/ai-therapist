'use client';

import React from 'react';
import {useLocale} from 'next-intl';
import {usePathname} from 'next/navigation';
import {locales, type AppLocale} from '@/i18n/config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LanguageSwitcherProps = {
  className?: string;
  placeholder?: string;
};

export function LanguageSwitcher({ className, placeholder = 'Language' }: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();

  const labels: Record<AppLocale, string> = {
    en: 'English',
    nl: 'Nederlands',
  };

  function setLocaleCookie(next: AppLocale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  function handleChange(next: string) {
    const nextLocale = next as AppLocale;
    setLocaleCookie(nextLocale);
    // We do NOT prefix the URL with the locale. Strip any existing locale segment and reload.
    const segments = pathname.split('/');
    const first = segments[1] ?? '';
    const withoutLocale = (locales as readonly string[]).includes(first)
      ? `/${segments.slice(2).join('/')}`
      : pathname;
    const dest = withoutLocale === '' ? '/' : withoutLocale;
    // Force a full page load so middleware reads NEXT_LOCALE and server messages update
    window.location.assign(dest);
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {locales.map((l) => (
          <SelectItem key={l} value={l}>
            {labels[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


