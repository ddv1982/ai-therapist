/**
 * Skip Links Component
 *
 * Provides accessible keyboard navigation for screen reader users.
 * Implements WCAG 2.4.1 - Bypass Blocks (Level A).
 *
 * The links are visually hidden by default but become visible when focused,
 * allowing keyboard users to quickly jump to main content areas.
 */

'use client';

import { useTranslations } from 'next-intl';

export function SkipLinks() {
  const t = useTranslations('accessibility');

  return (
    <div
      className="fixed left-4 top-4 z-[9999]"
      role="navigation"
      aria-label={t('skipLinksLabel')}
    >
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-all focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {t('skipToMainContent')}
      </a>
      <a
        href="#navigation"
        className="sr-only ml-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-all focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {t('skipToNavigation')}
      </a>
    </div>
  );
}
