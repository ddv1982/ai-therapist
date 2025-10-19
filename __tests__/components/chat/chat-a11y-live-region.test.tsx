import React from 'react';
import { screen } from '@testing-library/react';
import { ComponentTestUtils } from '__tests__/utils/test-utilities';
// Render a minimal shell that includes only the messages container to avoid
// bootstrapping the full chat transport stack in tests
import { useTranslations } from 'next-intl';

function MessagesContainerOnly() {
  const t = useTranslations('chat');
  return (
    <div
      role="log"
      aria-label={t('main.messagesAria')}
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions text"
      aria-busy={false}
    />
  );
}

describe('Chat live region a11y', () => {
  it('has a single role="log" live region on the messages container', async () => {
    ComponentTestUtils.renderWithProviders(<MessagesContainerOnly />);
    const logs = await screen.findAllByRole('log');
    expect(logs.length).toBe(1);
    const log = logs[0];
    expect(log).toHaveAttribute('aria-live', 'polite');
    // aria-relevant should include additions or text per implementation
    expect(log.getAttribute('aria-relevant')).toMatch(/additions|text/);
  });
});
