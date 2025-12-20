/**
 * Tests for ChatControls component
 */

import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { ChatControls } from '@/features/chat/components/chat-controls';
import type { ChatState } from '@/features/chat/hooks/use-chat-state';
import { useChat } from '@/features/chat/context/chat-context';

// Mock the context
jest.mock('@/features/chat/context/chat-context', () => ({
  useChat: jest.fn(),
}));

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

  const mockActions = {
    handleInputChange: jest.fn(),
    handleKeyDown: jest.fn(),
    handleFormSubmit: jest.fn(),
  };

  const mockController = {
    stopGenerating: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState(),
      actions: mockActions,
      controller: mockController,
    });
  });

  it('should render ChatComposer', () => {
    render(<ChatControls />);

    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
  });

  it('should pass input value to ChatComposer', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        input: 'Test input',
      }),
      actions: mockActions,
      controller: mockController,
    });

    render(<ChatControls />);

    expect(screen.getByTestId('input-value')).toHaveTextContent('Test input');
  });

  it('should pass loading state to ChatComposer', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        isLoading: true,
      }),
      actions: mockActions,
      controller: mockController,
    });

    render(<ChatControls />);

    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
  });

  it('should pass idle state to ChatComposer when not loading', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        isLoading: false,
      }),
      actions: mockActions,
      controller: mockController,
    });

    render(<ChatControls />);

    expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
  });

  it('should render with mobile state', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: createMockChatState({
        isMobile: true,
      }),
      actions: mockActions,
      controller: mockController,
    });

    render(<ChatControls />);

    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
  });
});
