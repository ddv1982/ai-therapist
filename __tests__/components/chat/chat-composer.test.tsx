import React, { createRef } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { ChatComposer } from '../../../src/features/chat/components/chat-composer';

describe('ChatComposer', () => {
  test('calls onChange and onSubmit', () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn((e) => e.preventDefault());
    const onStop = jest.fn();
    const ref = createRef<HTMLDivElement>();
    const taRef = createRef<HTMLTextAreaElement>();

    render(
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

  test('disables send button and shows error when input is empty', () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(
      <ChatComposer
        input=""
        isLoading={false}
        isMobile={false}
        onChange={() => {}}
        onKeyDown={() => {}}
        onSubmit={onSubmit}
        onStop={() => {}}
      />
    );

    const sendBtn = screen.getByLabelText('input.send');
    expect(sendBtn).toBeDisabled();

    // Error message should be visible
    const errorMsg = screen.getByText(/Message cannot be empty/i);
    expect(errorMsg).toBeInTheDocument();
  });

  test('allows typing and enables send button', () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(
      <ChatComposer
        input="Hello"
        isLoading={false}
        isMobile={false}
        onChange={onChange}
        onKeyDown={() => {}}
        onSubmit={onSubmit}
        onStop={() => {}}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Hello');

    const sendBtn = screen.getByLabelText('input.send');
    expect(sendBtn).not.toBeDisabled();

    fireEvent.submit(sendBtn.closest('form')!);
    expect(onSubmit).toHaveBeenCalled();
  });
  test('shows stop button while loading', () => {
    const onStop = jest.fn();
    render(
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
