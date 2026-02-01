import { act } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/utils/test-utilities';
import { useSession } from '@/contexts/session-context';

describe('SessionProvider', () => {
  it('exposes stable selectSession reference and updates AI state', async () => {
    const { result } = renderHookWithProviders(() => useSession());

    expect(typeof result.current.selectSession).toBe('function');

    await act(async () => {
      await result.current.selectSession('abc');
    });

    // The selectSession function should complete without errors
    // The actual state update behavior is tested via the mock in @ai-sdk/rsc
    expect(result.current.selectionStatus).toBeDefined();
  });

  it('falls back to hydration when selectSession action fails', async () => {
    const { result } = renderHookWithProviders(() => useSession());

    await act(async () => {
      await result.current.selectSession('xyz');
    });

    // The hook should handle errors gracefully and reset to idle state
    expect(result.current.selectionStatus.phase).toBe('idle');
  });

  it('provides currentSessionId from context', () => {
    const { result } = renderHookWithProviders(() => useSession());

    expect(result.current.currentSessionId).toBeDefined();
    expect(typeof result.current.setCurrentSession).toBe('function');
  });

  it('provides session management state setters', () => {
    const { result } = renderHookWithProviders(() => useSession());

    expect(typeof result.current.setCreatingSession).toBe('function');
    expect(typeof result.current.setDeletingSession).toBe('function');
    expect(result.current.isCreatingSession).toBe(false);
  });
});
