import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { DiaryProgress } from '@/features/therapy/cbt/components/diary-progress';
import enMessages from '@/i18n/messages/en.json';

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('DiaryProgress', () => {
  it('renders desktop progress', () => {
    const { container } = renderWithIntl(
      <DiaryProgress isMobile={false} isCBTActive={true} cbtCurrentStep={'core-belief' as any} />
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render on mobile', () => {
    const { container } = renderWithIntl(
      <DiaryProgress isMobile={true} isCBTActive={true} cbtCurrentStep={'emotions' as any} />
    );
    expect(container).toMatchSnapshot();
  });
});
