import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/ui/toast';

function Harness() {
  const { showToast } = useToast();
  return (
    <div>
      <button
        data-testid="mk-error"
        onClick={() => showToast({ type: 'error', title: 'E', message: 'Err' })}
      >
        E
      </button>
      <button data-testid="mk-info" onClick={() => showToast({ type: 'info', message: 'Info' })}>
        I
      </button>
    </div>
  );
}

describe('Toast ARIA roles', () => {
  it('uses role=alert assertive for error and role=status polite for info', async () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('mk-error'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');

    fireEvent.click(screen.getByTestId('mk-info'));
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });
});
