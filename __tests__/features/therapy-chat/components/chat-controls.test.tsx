/**
 * Tests for ChatControls component
 */

import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { ChatControls } from '@/features/therapy-chat/components/chat-controls';
import type { ChatState } from '@/features/therapy-chat/hooks/use-chat-state';
import type { ChatActions } from '@/features/therapy-chat/hooks/use-chat-actions';

// Mock the ChatComposer component
jest.mock('@/features/chat/components/chat-composer', () => ({
  ChatComposer: ({ input, isLoading }: { input: string; isLoading: boolean }) => (
    <div data-testid="chat-composer">
      <div data-testid="input-value">{input}</div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'idle'}</div>
    </div>
  ),
}));

describe('ChatControls', () => {
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

  const createMockChatActions = (): Pick<
    ChatActions,
    'handleInputChange' | 'handleKeyDown' | 'handleFormSubmit'
  > => ({
    handleInputChange: jest.fn(),
    handleKeyDown: jest.fn(),
    handleFormSubmit: jest.fn(),
  });

  const defaultProps = {
    chatState: createMockChatState(),
    chatActions: createMockChatActions(),
    onStop: jest.fn(),
  };

  it('should render ChatComposer', () => {
    render(<ChatControls {...defaultProps} />);

    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
  });

  it('should pass input value to ChatComposer', () => {
    const chatState = createMockChatState({
      input: 'Test input',
    });

    render(<ChatControls {...defaultProps} chatState={chatState} />);

    expect(screen.getByTestId('input-value')).toHaveTextContent('Test input');
  });

  it('should pass loading state to ChatComposer', () => {
    const chatState = createMockChatState({
      isLoading: true,
    });

    render(<ChatControls {...defaultProps} chatState={chatState} />);

    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
  });

  it('should pass idle state to ChatComposer when not loading', () => {
    const chatState = createMockChatState({
      isLoading: false,
    });

    render(<ChatControls {...defaultProps} chatState={chatState} />);

    expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
  });

  it('should render with mobile state', () => {
    const chatState = createMockChatState({
      isMobile: true,
    });

    render(<ChatControls {...defaultProps} chatState={chatState} />);

    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
  });
});
