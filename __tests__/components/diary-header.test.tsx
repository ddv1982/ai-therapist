import React from 'react';
import { render } from '@testing-library/react';
import { DiaryHeader } from '@/features/therapy/cbt/components/diary-header';

// Stabilize UI deps for this test
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}));
jest.mock('lucide-react', () => ({
  ArrowLeft: (props: any) => <div data-testid="icon-arrow-left" {...props} />,
  ChevronRight: (props: any) => <div data-testid="icon-chevron-right" {...props} />,
  Brain: (props: any) => <div data-testid="icon-brain" {...props} />,
}));

describe('DiaryHeader', () => {
  it('renders simplified desktop header', () => {
    const { container } = render(
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
    const { container } = render(
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
