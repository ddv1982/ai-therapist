import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MessageData } from '@/features/chat/messages/message';
import { ChatProvider, useChat } from '@/features/chat/context/chat-context';

const mockGenerateReportDetailed = jest.fn();
const mockPostMessage = jest.fn();
const mockShowToast = jest.fn();
const mockSetIsGeneratingReport = jest.fn();
const mockSetMessages = jest.fn();
const mockLoadSessions = jest.fn();

const therapyChatState: { messages: MessageData[] } = { messages: [] };
const sessionState: { currentSession: string | null; phase: 'idle' | 'validating' } = {
  currentSession: 'sess-1',
  phase: 'idle',
};

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    generateReportDetailed: (...args: unknown[]) => mockGenerateReportDetailed(...args),
    postMessage: (...args: unknown[]) => mockPostMessage(...args),
    patchMessageMetadata: jest.fn(),
  },
}));

jest.mock('@/hooks/chat/use-therapy-chat', () => ({
  useTherapyChat: () => ({
    messages: therapyChatState.messages,
    input: '',
    isLoading: false,
    error: undefined,
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    setInput: jest.fn(),
    setMessages: (...args: unknown[]) => mockSetMessages(...args),
    reload: jest.fn(),
    stop: jest.fn(),
    clearSession: jest.fn(),
    loadSessionMessages: jest.fn().mockResolvedValue(undefined),
    append: jest.fn(),
  }),
}));

jest.mock('@/hooks/chat/use-chat-ui', () => ({
  useChatUI: () => ({
    state: {
      showSidebar: false,
      isGeneratingReport: false,
      isMobile: false,
      viewportHeight: '100vh',
    },
    refs: {
      textareaRef: { current: null },
      messagesContainerRef: { current: null },
      inputContainerRef: { current: null },
    },
    actions: {
      setShowSidebar: jest.fn(),
      setIsGeneratingReport: (...args: unknown[]) => mockSetIsGeneratingReport(...args),
      scheduleFocus: jest.fn(),
    },
  }),
}));

jest.mock('@/features/chat/hooks/use-chat-modals', () => ({
  useChatModals: () => ({
    modals: {},
    actions: {
      openApiKeysPanel: jest.fn(),
    },
  }),
}));

jest.mock('@/hooks/chat/use-chat-sessions', () => ({
  useChatSessions: () => ({
    sessions: [],
    currentSession: sessionState.currentSession,
    loadSessions: (...args: unknown[]) => mockLoadSessions(...args),
    ensureActiveSession: jest.fn(),
    startNewSession: jest.fn(),
    deleteSession: jest.fn(),
    setCurrentSessionAndLoad: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-scroll-to-bottom', () => ({
  useScrollToBottom: () => ({
    scrollToBottom: jest.fn(),
    isNearBottom: true,
  }),
}));

jest.mock('@/hooks/use-memory-context', () => ({
  useMemoryContext: () => ({
    memoryContext: {
      hasMemory: false,
      reportCount: 0,
      lastReportDate: undefined,
    },
    setMemoryContext: jest.fn(),
  }),
}));

jest.mock('@/contexts/chat-settings-context', () => ({
  useChatSettings: () => ({
    settings: {
      model: 'openai/gpt-oss-120b',
      webSearchEnabled: false,
    },
    updateSettings: jest.fn(),
  }),
}));

jest.mock('@/contexts/session-context', () => ({
  useSession: () => ({
    currentSessionId: sessionState.currentSession,
    selectionStatus: {
      phase: sessionState.phase,
      sessionId: sessionState.currentSession,
    },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    showToast: (...args: unknown[]) => mockShowToast(...args),
  }),
}));

jest.mock('@/hooks/use-api-keys', () => ({
  useApiKeys: () => ({
    keys: { openai: null },
    isActive: false,
    setActive: jest.fn(),
  }),
}));

function Probe() {
  const { controller, state } = useChat();
  return (
    <div>
      <button onClick={() => void controller.generateReport()} type="button">
        generate
      </button>
      <span data-testid="ready-state">{state.isSessionReadyForReport ? 'ready' : 'not-ready'}</span>
    </div>
  );
}

describe('ChatProvider report generation flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    therapyChatState.messages = [];
    sessionState.currentSession = 'sess-1';
    sessionState.phase = 'idle';
    mockGenerateReportDetailed.mockResolvedValue({
      success: true,
      data: { reportContent: 'analysis' },
    });
    mockPostMessage.mockResolvedValue({ success: true });
    mockLoadSessions.mockResolvedValue(undefined);
  });

  it('uses server-authoritative generate endpoint without client messages payload', async () => {
    render(
      <ChatProvider>
        <Probe />
      </ChatProvider>
    );

    fireEvent.click(screen.getByText('generate'));

    await waitFor(() => {
      expect(mockGenerateReportDetailed).toHaveBeenCalledWith({
        sessionId: 'sess-1',
        model: 'openai/gpt-oss-120b',
      });
    });
    expect(mockGenerateReportDetailed.mock.calls[0][0]).not.toHaveProperty('messages');
    expect(mockSetMessages).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalled();
    expect(mockSetIsGeneratingReport).toHaveBeenCalledWith(true);
    expect(mockSetIsGeneratingReport).toHaveBeenCalledWith(false);
  });

  it('shows info toast for NO_REPORTABLE_MESSAGES and does not append/persist message', async () => {
    mockGenerateReportDetailed.mockRejectedValueOnce(
      Object.assign(new Error('No reportable messages found'), {
        status: 422,
        body: { error: { code: 'NO_REPORTABLE_MESSAGES' } },
      })
    );

    render(
      <ChatProvider>
        <Probe />
      </ChatProvider>
    );

    fireEvent.click(screen.getByText('generate'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
        })
      );
    });
    expect(mockSetMessages).not.toHaveBeenCalled();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('exposes non-ready report state while session selection is not idle', async () => {
    sessionState.phase = 'validating';

    render(
      <ChatProvider>
        <Probe />
      </ChatProvider>
    );

    expect(screen.getByTestId('ready-state')).toHaveTextContent('not-ready');
    fireEvent.click(screen.getByText('generate'));
    expect(mockGenerateReportDetailed).not.toHaveBeenCalled();
  });
});
