/**
 * Tests for ChatContainer component
 */

import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { ChatContainer } from '@/features/chat/components/chat-container';
import type { ChatState } from '@/features/chat/context/chat-context';
import { useChat } from '@/features/chat/context/chat-context';

// Mock the context
jest.mock('@/features/chat/context/chat-context', () => ({
  useChat: jest.fn(),
}));

// Mock translations
jest.mock('next-intl', () => ({
  useTranslations: () => jest.fn((key) => key),
  useLocale: () => 'en',
}));

// Mock the child components
jest.mock('@/features/chat/components/system-banner', () => ({
  SystemBanner: () => <div data-testid="system-banner">System Banner</div>,
}));

jest.mock('@/features/chat/components/dashboard/chat-empty-state', () => ({
  ChatEmptyState: () => <div data-testid="empty-state">Empty State</div>,
}));

jest.mock('@/features/chat/components/chat-message-list/chat-message-list', () => ({
  ChatMessageList: () => <div data-testid="message-list">Message List</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('lucide-react', () => ({
  ArrowDown: () => <div>ArrowDown</div>,
}));

describe('ChatContainer', () => {
  const createMockChatState = (overrides?: Partial<ChatState>): ChatState => ({
    messages: [],
    sessions: [],
    currentSession: 'session-1',
    input: '',
    isLoading: false,
    isMobile: false,
    viewportHeight: '100vh',
    isGeneratingReport: false,
    memoryContext: {
      hasMemory: false,
      reportCount: 0,
      lastReportDate: undefined,
    },
    textareaRef: createRef(),
    messagesContainerRef: createRef(),
    inputContainerRef: createRef(),
    isNearBottom: true,
    showSidebar: false,
    ...overrides,
  });

  const mockActions = {
    handleObsessionsCompulsionsComplete: jest.fn(),
    scrollToBottom: jest.fn(),
  };

  const mockModalActions = {
    openMemoryModal: jest.fn(),
  };

  const mockController = {
    updateMessageMetadata: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState(),
      actions: mockActions,
      modalActions: mockModalActions,
      controller: mockController,
    });
  });

  it('should render empty state when no messages', () => {
    render(<ChatContainer />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('message-list')).not.toBeInTheDocument();
  });

  it('should render message list when messages exist', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
      }),
      actions: mockActions,
      modalActions: mockModalActions,
      controller: mockController,
    });

    render(<ChatContainer />);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('should render system banner', () => {
    render(<ChatContainer />);

    expect(screen.getByTestId('system-banner')).toBeInTheDocument();
  });

  it('should show scroll-to-bottom button when not near bottom', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        isNearBottom: false,
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
      }),
      actions: mockActions,
      modalActions: mockModalActions,
      controller: mockController,
    });

    render(<ChatContainer />);

    expect(screen.getByRole('button', { name: 'main.jumpToLatest' })).toBeInTheDocument();
  });

  it('should hide scroll-to-bottom button when near bottom', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        isNearBottom: true,
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
      }),
      actions: mockActions,
      modalActions: mockModalActions,
      controller: mockController,
    });

    render(<ChatContainer />);

    expect(screen.queryByRole('button', { name: 'main.jumpToLatest' })).not.toBeInTheDocument();
  });

  it('should apply mobile styles when isMobile is true', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        isMobile: true,
        messages: [],
      }),
      actions: mockActions,
      modalActions: mockModalActions,
      controller: mockController,
    });

    const { container } = render(<ChatContainer />);

    const messagesContainer = container.querySelector('[role="log"]');
    expect(messagesContainer).toHaveClass('prevent-bounce');
  });

  it('should set aria-busy when loading', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        isLoading: true,
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
      }),
      actions: mockActions,
      modalActions: mockModalActions,
      controller: mockController,
    });

    const { container } = render(<ChatContainer />);

    const messagesContainer = container.querySelector('[role="log"]');
    expect(messagesContainer).toHaveAttribute('aria-busy', 'true');
  });
});
