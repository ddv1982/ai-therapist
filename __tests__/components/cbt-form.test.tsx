import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { CBTForm } from '@/features/therapy/cbt/cbt-form';

describe('CBTForm', () => {
  beforeEach(() => {
    // Reset the Redux store before each test
    store.dispatch({ type: 'cbt/clearCBTSession' });
  });

  it('renders and validates situation field', async () => {
    const onSubmit = jest.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    render(<CBTForm onSubmit={onSubmit} />, { wrapper });

    const textarea = screen.getByPlaceholderText('Describe the situation...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'abc' } });

    const button = screen.getByRole('button', { name: /save draft/i });
    expect(button).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'A valid situation text' } });
    // Button should eventually enable once schema is satisfied
    expect(button).not.toBeDisabled();
  });

  it('auto-saves to Redux on form changes', async () => {
    const onSubmit = jest.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    render(<CBTForm onSubmit={onSubmit} />, { wrapper });

    const textarea = screen.getByPlaceholderText('Describe the situation...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test situation for Redux auto-save' } });

    // Wait for auto-save debounce
    await new Promise(resolve => setTimeout(resolve, 700));

    // Check that data was saved to Redux
    const state = store.getState().cbt.sessionData;
    expect(state.situation?.situation).toBe('Test situation for Redux auto-save');
  });
});
