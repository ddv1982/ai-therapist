/**
 * Skip Links Component Tests
 *
 * Tests for WCAG 2.4.1 - Bypass Blocks compliance.
 */

import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SkipLinks } from '@/components/layout/skip-links';

const messages = {
  accessibility: {
    skipLinksLabel: 'Skip navigation links',
    skipToMainContent: 'Skip to main content',
    skipToNavigation: 'Skip to navigation',
  },
};

describe('SkipLinks', () => {
  const renderWithIntl = (component: React.ReactElement) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        {component}
      </NextIntlClientProvider>
    );
  };

  it('renders skip links with correct labels', () => {
    renderWithIntl(<SkipLinks />);

    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
  });

  it('has correct href targets', () => {
    renderWithIntl(<SkipLinks />);

    const mainLink = screen.getByText('Skip to main content');
    const navLink = screen.getByText('Skip to navigation');

    expect(mainLink).toHaveAttribute('href', '#main-content');
    expect(navLink).toHaveAttribute('href', '#navigation');
  });

  it('has proper ARIA labels', () => {
    renderWithIntl(<SkipLinks />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Skip navigation links');
  });

  it('links are initially visually hidden (sr-only)', () => {
    renderWithIntl(<SkipLinks />);

    const mainLink = screen.getByText('Skip to main content');
    const navLink = screen.getByText('Skip to navigation');

    // Both should have sr-only class for screen reader only visibility
    expect(mainLink).toHaveClass('sr-only');
    expect(navLink).toHaveClass('sr-only');
  });

  it('links become visible on focus (focus:not-sr-only)', () => {
    renderWithIntl(<SkipLinks />);

    const mainLink = screen.getByText('Skip to main content');

    // Should have the focus:not-sr-only class to show on focus
    expect(mainLink).toHaveClass('focus:not-sr-only');
  });

  it('follows accessibility best practices for keyboard navigation', () => {
    renderWithIntl(<SkipLinks />);

    const mainLink = screen.getByText('Skip to main content');
    const navLink = screen.getByText('Skip to navigation');

    // Links should be tabbable (no tabindex=-1)
    expect(mainLink).not.toHaveAttribute('tabindex', '-1');
    expect(navLink).not.toHaveAttribute('tabindex', '-1');
  });
});
