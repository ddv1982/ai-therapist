import { render, act } from '@testing-library/react';
import { SessionProvider, useSession } from '@/contexts/session-context';

let uiState: { currentSessionId: string | null } = { currentSessionId: null };
const setUiStateMock = jest.fn((nextState: any) => {
  if (typeof nextState === 'function') {
    uiState = nextState(uiState);
  } else {
    uiState = nextState;
  }
});
const selectSessionActionMock = jest.fn().mockResolvedValue(undefined);
const syncUiStateMock = jest.fn().mockResolvedValue(undefined);

jest.mock(
  '@ai-sdk/rsc',
  () => ({
    useUIState: () => [uiState, setUiStateMock],
    useActions: () => ({
      selectSession: selectSessionActionMock,
    }),
    useSyncUIState: () => syncUiStateMock,
    readStreamableValue: jest.fn(),
  }),
  { virtual: true }
);

describe('SessionProvider', () => {
  beforeEach(() => {
    uiState = { currentSessionId: null };
    setUiStateMock.mockClear();
    selectSessionActionMock.mockClear().mockResolvedValue(undefined);
    syncUiStateMock.mockClear().mockResolvedValue(undefined);
  });

  it('exposes stable selectSession reference and updates AI state', async () => {
    let capturedSelectSession: ((val: string | null) => Promise<void>) | undefined;

    function TestComponent({ capture }: { capture: (val: any) => void }) {
      const { selectSession } = useSession();
      capture(selectSession);
      return null;
    }

    render(
      <SessionProvider>
        <TestComponent capture={(val) => (capturedSelectSession = val)} />
      </SessionProvider>
    );

    expect(typeof capturedSelectSession).toBe('function');

    await act(async () => {
      await capturedSelectSession?.('abc');
    });

    expect(setUiStateMock).toHaveBeenCalledWith({ currentSessionId: 'abc' });
    expect(selectSessionActionMock).toHaveBeenCalledWith('abc');
  });

  it('falls back to hydration when selectSession action fails', async () => {
    selectSessionActionMock.mockRejectedValueOnce(new Error('network'));

    let capturedSelectSession: ((val: string | null) => Promise<void>) | undefined;

    function TestComponent() {
      const { selectSession } = useSession();
      capturedSelectSession = selectSession;
      return null;
    }

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    await act(async () => {
      await capturedSelectSession?.('xyz');
    });

    expect(selectSessionActionMock).toHaveBeenCalledWith('xyz');
    expect(syncUiStateMock).toHaveBeenCalled();
  });
});
