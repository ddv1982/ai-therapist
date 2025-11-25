/**
 * Tests for ChatContainer component
 */

import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { ChatContainer } from '@/features/chat/components/chat-container';
import type { ChatState } from '@/features/chat/hooks/use-chat-state';

// Mock the child components
jest.mock('@/features/chat/components/system-banner', () => ({
  SystemBanner: () => <div data-testid="system-banner">System Banner</div>,
}));

jest.mock('@/features/chat/components/dashboard/chat-empty-state', () => ({
  ChatEmptyState: () => <div data-testid="empty-state">Empty State</div>,
}));

jest.mock('@/features/chat/components/virtualized-message-list', () => ({
  VirtualizedMessageList: () => <div data-testid="message-list">Message List</div>,
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

  const defaultProps = {
    chatState: createMockChatState(),
    onObsessionsCompulsionsComplete: jest.fn(),
    onUpdateMessageMetadata: jest.fn(),
    onManageMemory: jest.fn(),
    onScrollToBottom: jest.fn(),
    translate: jest.fn((key) => key),
  };

  it('should render empty state when no messages', () => {
    render(<ChatContainer {...defaultProps} />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('message-list')).not.toBeInTheDocument();
  });

  it('should render message list when messages exist', () => {
    const chatState = createMockChatState({
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
      ],
    });

    render(<ChatContainer {...defaultProps} chatState={chatState} />);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('should render system banner', () => {
    render(<ChatContainer {...defaultProps} />);

    expect(screen.getByTestId('system-banner')).toBeInTheDocument();
  });

  it('should show scroll-to-bottom button when not near bottom', () => {
    const chatState = createMockChatState({
      isNearBottom: false,
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
      ],
    });

    const translate = jest.fn((key) => key);
    render(<ChatContainer {...defaultProps} chatState={chatState} translate={translate} />);

    expect(screen.getByRole('button', { name: 'main.jumpToLatest' })).toBeInTheDocument();
  });

  it('should hide scroll-to-bottom button when near bottom', () => {
    const chatState = createMockChatState({
      isNearBottom: true,
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
      ],
    });

    render(<ChatContainer {...defaultProps} chatState={chatState} />);

    expect(screen.queryByRole('button', { name: 'main.jumpToLatest' })).not.toBeInTheDocument();
  });

  it('should apply mobile styles when isMobile is true', () => {
    const chatState = createMockChatState({
      isMobile: true,
      messages: [],
    });

    const { container } = render(<ChatContainer {...defaultProps} chatState={chatState} />);

    const messagesContainer = container.querySelector('[role="log"]');
    expect(messagesContainer).toHaveClass('prevent-bounce');
  });

  it('should set aria-busy when loading', () => {
    const chatState = createMockChatState({
      isLoading: true,
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
      ],
    });

    const { container } = render(<ChatContainer {...defaultProps} chatState={chatState} />);

    const messagesContainer = container.querySelector('[role="log"]');
    expect(messagesContainer).toHaveAttribute('aria-busy', 'true');
  });
});
