import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CBTForm } from '@/features/therapy/cbt/cbt-form';

describe('CBTForm', () => {
  it('renders and validates situation field', async () => {
    const onSubmit = jest.fn();
    render(<CBTForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText('Describe the situation...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'abc' } });

    const button = screen.getByRole('button', { name: /save draft/i });
    expect(button).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'A valid situation text' } });
    // Button should eventually enable once schema is satisfied
    expect(button).not.toBeDisabled();
  });
});


