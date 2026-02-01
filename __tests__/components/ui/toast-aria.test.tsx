import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, ToastTestHarness } from '@tests/utils/test-utilities';

describe('Toast ARIA roles', () => {
  it('uses role=alert assertive for error and role=status polite for info', async () => {
    renderWithProviders(
      <ToastTestHarness includePersistent={false} includeCustomDuration={false} />
    );

    fireEvent.click(screen.getByTestId('show-error'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');

    fireEvent.click(screen.getByTestId('show-info'));
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });
});
