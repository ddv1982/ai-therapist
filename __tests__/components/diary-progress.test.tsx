import React from 'react';
import { render } from '@testing-library/react';
import { DiaryProgress } from '@/features/therapy/cbt/components/diary-progress';

describe('DiaryProgress', () => {
  it('renders desktop progress', () => {
    const { container } = render(
      <DiaryProgress isMobile={false} isCBTActive={true} cbtCurrentStep={'core-belief' as any} />
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render on mobile', () => {
    const { container } = render(
      <DiaryProgress isMobile={true} isCBTActive={true} cbtCurrentStep={'emotions' as any} />
    );
    expect(container).toMatchSnapshot();
  });
});

