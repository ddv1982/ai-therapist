import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { DraftPanel } from '@/features/therapy/cbt/components/draft-panel';
import enMessages from '@/i18n/messages/en.json';

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('DraftPanel', () => {
  it('renders with draft found', () => {
    const { container } = renderWithIntl(
      <DraftPanel
        hasDraft
        draftLastSaved="2025-10-19T00:00:00.000Z"
        onDeleteDraft={() => {}}
        onResume={() => {}}
        onStartFresh={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders without draft (begin button)', () => {
    const { container } = renderWithIntl(
      <DraftPanel
        hasDraft={false}
        onDeleteDraft={() => {}}
        onResume={() => {}}
        onStartFresh={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
