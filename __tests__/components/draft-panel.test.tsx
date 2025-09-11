import React from 'react';
import { render } from '@testing-library/react';
import { DraftPanel } from '@/features/therapy/cbt/components/draft-panel';

describe('DraftPanel', () => {
  it('renders with draft found', () => {
    const { container } = render(
      <DraftPanel hasDraft={true} draftLastSaved={new Date().toISOString()} onDeleteDraft={() => {}} onResume={() => {}} onStartFresh={() => {}} />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders without draft (begin button)', () => {
    const { container } = render(
      <DraftPanel hasDraft={false} onDeleteDraft={() => {}} onResume={() => {}} onStartFresh={() => {}} />
    );
    expect(container).toMatchSnapshot();
  });
});

