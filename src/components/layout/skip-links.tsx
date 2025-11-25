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
    <div className="fixed top-4 left-4 z-[9999]" role="navigation" aria-label={t('skipLinksLabel')}>
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground focus:ring-ring sr-only rounded-md px-4 py-2 text-sm font-semibold shadow-lg transition-all focus:not-sr-only focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        {t('skipToMainContent')}
      </a>
      <a
        href="#navigation"
        className="bg-primary text-primary-foreground focus:ring-ring sr-only ml-2 rounded-md px-4 py-2 text-sm font-semibold shadow-lg transition-all focus:not-sr-only focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        {t('skipToNavigation')}
      </a>
    </div>
  );
}
