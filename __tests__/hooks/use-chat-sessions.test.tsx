import { renderHook, act } from '@testing-library/react';
import { useChatSessions } from '@/hooks/chat/use-chat-sessions';

const selectSessionMock = jest.fn();
const mockSessionsQuery = jest.fn();
const mockCreateSessionMutation = jest.fn();
const mockDeleteSessionMutation = jest.fn();
const setCurrentSessionMock = jest.fn();
const sessionContextState: { currentSessionId: string | null } = { currentSessionId: null };

jest.mock('@/hooks/use-select-session', () => ({
  useSelectSession: () => ({ selectSession: selectSessionMock }),
}));

jest.mock('@/hooks/auth/use-auth-ready', () => ({
  useAuthReady: () => true,
}));

jest.mock('@/lib/queries/sessions', () => ({
  useSessionsQuery: (...args: unknown[]) => mockSessionsQuery(...args),
  useCreateSessionMutation: () => ({ mutateAsync: mockCreateSessionMutation }),
  useDeleteSessionMutation: () => ({ mutateAsync: mockDeleteSessionMutation }),
}));

jest.mock('@/contexts/session-context', () => ({
  useSession: () => ({
    currentSessionId: sessionContextState.currentSessionId,
    setCurrentSession: setCurrentSessionMock,
    selectionStatus: { phase: 'idle', sessionId: sessionContextState.currentSessionId },
  }),
}));

describe('useChatSessions', () => {
  const loadMessages = jest.fn();
  const clearMessages = jest.fn();
  const resolveDefaultTitle = jest.fn(() => 'New Chat');
  let refetchSessionsMock: jest.Mock;

  beforeEach(() => {
    mockSessionsQuery.mockReset();
    refetchSessionsMock = jest.fn().mockResolvedValue(undefined);
    mockSessionsQuery.mockReturnValue({ data: [], refetch: refetchSessionsMock });
    loadMessages.mockClear();
    loadMessages.mockResolvedValue(undefined);
    clearMessages.mockClear();
    resolveDefaultTitle.mockClear();
    resolveDefaultTitle.mockReturnValue('New Chat');
    selectSessionMock.mockClear();
    setCurrentSessionMock.mockReset();
    setCurrentSessionMock.mockImplementation((sessionId: string | null) => {
      sessionContextState.currentSessionId = sessionId;
    });
    mockCreateSessionMutation.mockReset();
    mockDeleteSessionMutation.mockReset();
    mockCreateSessionMutation.mockResolvedValue({
      id: 'generated',
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    });
    mockDeleteSessionMutation.mockResolvedValue({ success: true });
    sessionContextState.currentSessionId = null;
  });

  it('creates a session when ensuring an active session', async () => {
    const { result } = renderHook(() =>
      useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle })
    );

    selectSessionMock.mockClear();
    clearMessages.mockClear();

    await act(async () => {
      const sessionId = await result.current.ensureActiveSession();
      expect(sessionId).toBe('generated');
    });

    expect(resolveDefaultTitle).toHaveBeenCalled();
    expect(mockCreateSessionMutation).toHaveBeenCalledWith({ title: 'New Chat' });
    expect(selectSessionMock).toHaveBeenCalledWith('generated');
    expect(setCurrentSessionMock).toHaveBeenCalledWith('generated');
    expect(loadMessages).toHaveBeenCalledWith('generated');
    expect(refetchSessionsMock).toHaveBeenCalled();
  });

  it('clears session state when starting a new session', async () => {
    const { result } = renderHook(() =>
      useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle })
    );

    await act(async () => {
      await result.current.setCurrentSessionAndLoad('generated');
    });

    selectSessionMock.mockClear();
    clearMessages.mockClear();
    refetchSessionsMock.mockClear();

    await act(async () => {
      await result.current.startNewSession();
    });

    expect(selectSessionMock).toHaveBeenCalledWith(null);
    expect(setCurrentSessionMock).toHaveBeenCalledWith(null);
    expect(clearMessages).toHaveBeenCalled();
    expect(refetchSessionsMock).toHaveBeenCalled();
  });

  it('deletes the current session and refreshes sessions', async () => {
    const { result, rerender } = renderHook(() =>
      useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle })
    );

    await act(async () => {
      await result.current.setCurrentSessionAndLoad('generated');
    });
    sessionContextState.currentSessionId = 'generated';
    rerender();

    selectSessionMock.mockClear();
    clearMessages.mockClear();
    refetchSessionsMock.mockClear();

    await act(async () => {
      await result.current.deleteSession('generated');
    });

    expect(mockDeleteSessionMutation).toHaveBeenCalledWith('generated');
    expect(selectSessionMock).toHaveBeenCalledWith(null);
    expect(setCurrentSessionMock).toHaveBeenCalledWith(null);
    expect(clearMessages).toHaveBeenCalled();
    expect(refetchSessionsMock).toHaveBeenCalled();
  });

  it('automatically loads messages when session context changes externally', async () => {
    const { rerender } = renderHook(() =>
      useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle })
    );

    loadMessages.mockClear();
    clearMessages.mockClear();

    await act(async () => {
      sessionContextState.currentSessionId = 'external-session';
      rerender(() => useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle }));
    });

    expect(loadMessages).toHaveBeenCalledWith('external-session');

    loadMessages.mockClear();

    await act(async () => {
      sessionContextState.currentSessionId = null;
      rerender(() => useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle }));
    });

    expect(clearMessages).toHaveBeenCalled();
  });
});
