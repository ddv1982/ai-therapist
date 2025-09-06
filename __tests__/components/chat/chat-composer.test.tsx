import React, { createRef } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { ComponentTestUtils } from '__tests__/utils/test-utilities';
import { ChatComposer } from '@/features/chat/components/chat-composer';

describe('ChatComposer', () => {
  test('calls onChange and onSubmit', () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn((e) => e.preventDefault());
    const onStop = jest.fn();
    const ref = createRef<HTMLDivElement>();
    const taRef = createRef<HTMLTextAreaElement>();

    ComponentTestUtils.renderWithProviders(
      <ChatComposer
        input=""
        isLoading={false}
        isMobile={false}
        onChange={onChange}
        onKeyDown={() => {}}
        onSubmit={onSubmit}
        onStop={onStop}
        inputContainerRef={ref}
        textareaRef={taRef}
      />
    );

    const textarea = screen.getByLabelText('input.ariaLabel');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(onChange).toHaveBeenCalledWith('Hello');

    const form = textarea.closest('form');
    if (!form) throw new Error('Form not found');
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalled();
  });

  test('shows stop button while loading', () => {
    const onStop = jest.fn();
    ComponentTestUtils.renderWithProviders(
      <ChatComposer
        input=""
        isLoading={true}
        isMobile={false}
        onChange={() => {}}
        onKeyDown={() => {}}
        onSubmit={(e) => e.preventDefault()}
        onStop={onStop}
      />
    );

    const stopBtn = screen.getByLabelText('main.stopGenerating');
    fireEvent.click(stopBtn);
    expect(onStop).toHaveBeenCalled();
  });
});


