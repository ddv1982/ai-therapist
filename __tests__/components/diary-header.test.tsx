import React from 'react';
import { render } from '@testing-library/react';
import DiaryHeader from '@/features/therapy/cbt/components/diary-header';

describe('DiaryHeader', () => {
  it('renders desktop header with progress info', () => {
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
