import { renderHook, act } from '@testing-library/react';
import { useChatSessions } from '@/hooks/chat/use-chat-sessions';
import { apiClient } from '@/lib/api/client';

const selectSessionMock = jest.fn();

jest.mock('@/hooks/use-select-session', () => ({
  useSelectSession: () => ({ selectSession: selectSessionMock }),
}));

const sessionStore = {
  sessions: [] as Array<{ id: string; title: string; startedAt?: Date }>,
  loadSessions: jest.fn(),
  removeSession: jest.fn(),
  createSession: jest.fn(),
};

jest.mock('@/hooks/use-session-store', () => ({
  useSessionStore: () => sessionStore,
}));

describe('useChatSessions', () => {
  const loadMessages = jest.fn();
  const clearMessages = jest.fn();
  const resolveDefaultTitle = jest.fn(() => 'New Chat');

  beforeEach(() => {
    sessionStore.sessions = [];
    sessionStore.loadSessions.mockResolvedValue(undefined);
    sessionStore.removeSession.mockResolvedValue(undefined);
    sessionStore.createSession.mockResolvedValue({ id: 'generated', title: 'New Chat' });
    loadMessages.mockClear();
    loadMessages.mockResolvedValue(undefined);
    clearMessages.mockClear();
    resolveDefaultTitle.mockClear();
    selectSessionMock.mockClear();
    jest.spyOn(apiClient, 'getCurrentSession').mockResolvedValue({
      success: true,
      data: { currentSession: null },
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a session when ensuring an active session', async () => {
    const { result } = renderHook(() => useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle }));

    await act(async () => {
      const sessionId = await result.current.ensureActiveSession();
      expect(sessionId).toBe('generated');
    });

    expect(resolveDefaultTitle).toHaveBeenCalled();
    expect(sessionStore.createSession).toHaveBeenCalledTimes(1);
    expect(selectSessionMock).toHaveBeenCalledWith('generated');
    expect(loadMessages).toHaveBeenCalledWith('generated');
  });

  it('clears session state when starting a new session', async () => {
    const { result } = renderHook(() => useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle }));

    await act(async () => {
      await result.current.startNewSession();
    });

    expect(selectSessionMock).toHaveBeenCalledWith(null);
    expect(clearMessages).toHaveBeenCalled();
  });

  it('deletes the current session and refreshes sessions', async () => {
    const { result } = renderHook(() => useChatSessions({ loadMessages, clearMessages, resolveDefaultTitle }));

    await act(async () => {
      await result.current.ensureActiveSession();
    });

    await act(async () => {
      await result.current.deleteSession('generated');
    });

    expect(sessionStore.removeSession).toHaveBeenCalledWith('generated');
    expect(selectSessionMock).toHaveBeenCalledWith(null);
    expect(sessionStore.loadSessions).toHaveBeenCalled();
  });
});
