import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { DiaryHeader } from '@/features/therapy/cbt/components/diary-header';
import enMessages from '@/i18n/messages/en.json';

// Stabilize UI deps for this test
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock('lucide-react', () => ({
  ArrowLeft: (props: any) => <div data-testid="icon-arrow-left" {...props} />,
  ChevronRight: (props: any) => <div data-testid="icon-chevron-right" {...props} />,
  Brain: (props: any) => <div data-testid="icon-brain" {...props} />,
}));

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('DiaryHeader', () => {
  it('renders simplified desktop header', () => {
    const { container } = renderWithIntl(
      <DiaryHeader
        isMobile={false}
        isCBTActive={true}
        cbtCurrentStep={'emotions' as any}
        onBack={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders mobile header', () => {
    const { container } = renderWithIntl(
      <DiaryHeader
        isMobile={true}
        isCBTActive={true}
        cbtCurrentStep={'thoughts' as any}
        onBack={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
