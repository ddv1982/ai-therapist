import { screen } from '@testing-library/react';
import { ComponentTestUtils } from '__tests__/utils/test-utilities';
import {
  VirtualizedMessageList,
  VIRTUAL_SCROLL_THRESHOLD,
  ESTIMATED_MESSAGE_HEIGHT,
  ESTIMATED_CBT_STEP_HEIGHT,
} from '@/features/chat/components/virtualized-message-list';
import type { MessageData } from '@/features/chat/messages/message';

function makeMsg(
  id: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>
): MessageData {
  return {
    id,
    role,
    content,
    timestamp: new Date(),
    metadata,
  } as MessageData;
}

function makeManyMessages(count: number, role: 'user' | 'assistant' = 'user'): MessageData[] {
  const msgs: MessageData[] = [];
  for (let i = 0; i < count; i++) {
    msgs.push(makeMsg(String(i), role, `Message ${i}`));
  }
  return msgs;
}

describe('VirtualizedMessageList', () => {
  describe('basic rendering', () => {
    test('renders messages with user role', () => {
      const msgs = [makeMsg('1', 'user', 'Hello'), makeMsg('2', 'assistant', 'Hi there')];

      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={false}
          enableVirtualization={false}
        />
      );

      expect(screen.getByLabelText('Message from user')).toBeInTheDocument();
      expect(screen.getByLabelText('Message from assistant')).toBeInTheDocument();
    });

    test('renders recent messages only when exceeding maxVisible', () => {
      const msgs = makeManyMessages(60, 'user');

      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={false}
          maxVisible={10}
          enableVirtualization={false}
        />
      );

      const items = screen.getAllByLabelText('Message from user');
      // With maxVisible=10, only 10 messages should be rendered
      expect(items.length).toBe(10);
    });

    test('renders all messages when count is below maxVisible', () => {
      const msgs = makeManyMessages(5, 'user');

      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={false}
          maxVisible={10}
          enableVirtualization={false}
        />
      );

      const items = screen.getAllByLabelText('Message from user');
      expect(items.length).toBe(5);
    });
  });

  describe('virtualization behavior', () => {
    test('exports VIRTUAL_SCROLL_THRESHOLD constant', () => {
      expect(VIRTUAL_SCROLL_THRESHOLD).toBeDefined();
      expect(typeof VIRTUAL_SCROLL_THRESHOLD).toBe('number');
      expect(VIRTUAL_SCROLL_THRESHOLD).toBeGreaterThan(0);
    });

    test('exports ESTIMATED_MESSAGE_HEIGHT constant', () => {
      expect(ESTIMATED_MESSAGE_HEIGHT).toBeDefined();
      expect(typeof ESTIMATED_MESSAGE_HEIGHT).toBe('number');
      expect(ESTIMATED_MESSAGE_HEIGHT).toBeGreaterThan(0);
    });

    test('exports ESTIMATED_CBT_STEP_HEIGHT constant', () => {
      expect(ESTIMATED_CBT_STEP_HEIGHT).toBeDefined();
      expect(typeof ESTIMATED_CBT_STEP_HEIGHT).toBe('number');
      expect(ESTIMATED_CBT_STEP_HEIGHT).toBeGreaterThan(ESTIMATED_MESSAGE_HEIGHT);
    });

    test('can disable virtualization with enableVirtualization=false', () => {
      const msgs = makeManyMessages(100, 'user');

      // With virtualization disabled, should use simple rendering
      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={false}
          maxVisible={50}
          enableVirtualization={false}
        />
      );

      // Should render up to maxVisible messages
      const items = screen.getAllByLabelText('Message from user');
      expect(items.length).toBeLessThanOrEqual(50);
    });
  });

  describe('dismissed messages', () => {
    test('filters out dismissed messages', () => {
      const msgs = [
        makeMsg('1', 'user', 'Visible message'),
        makeMsg('2', 'assistant', 'Dismissed message', { dismissed: true }),
        makeMsg('3', 'user', 'Another visible message'),
      ];

      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={false}
          enableVirtualization={false}
        />
      );

      // Should have 2 visible messages (1 user, 1 user)
      const userItems = screen.getAllByLabelText('Message from user');
      expect(userItems.length).toBe(2);

      // Dismissed assistant message should not be rendered
      expect(screen.queryByText('Dismissed message')).not.toBeInTheDocument();
    });
  });

  describe('streaming indicator', () => {
    test('shows typing indicator for last empty assistant message when streaming', () => {
      const msgs = [
        makeMsg('1', 'user', 'Hello'),
        makeMsg('2', 'assistant', ''), // Empty content during streaming
      ];

      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={true}
          isMobile={false}
          enableVirtualization={false}
        />
      );

      expect(screen.getByLabelText('Assistant is typing')).toBeInTheDocument();
    });

    test('does not show typing indicator when not streaming', () => {
      const msgs = [makeMsg('1', 'user', 'Hello'), makeMsg('2', 'assistant', '')];

      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={false}
          enableVirtualization={false}
        />
      );

      expect(screen.queryByLabelText('Assistant is typing')).not.toBeInTheDocument();
    });
  });

  describe('mobile responsiveness', () => {
    test('applies mobile-specific spacing when isMobile is true', () => {
      const msgs = [makeMsg('1', 'user', 'Hello')];

      const { container } = ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={true}
          enableVirtualization={false}
        />
      );

      // Mobile should have space-y-3 instead of space-y-6
      const innerContainer = container.querySelector('.space-y-3');
      expect(innerContainer).toBeInTheDocument();
    });

    test('applies desktop spacing when isMobile is false', () => {
      const msgs = [makeMsg('1', 'user', 'Hello')];

      const { container } = ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={false}
          enableVirtualization={false}
        />
      );

      // Desktop should have space-y-6
      const innerContainer = container.querySelector('.space-y-6');
      expect(innerContainer).toBeInTheDocument();
    });
  });

  describe('CBT component rendering', () => {
    test('renders CBT step articles with correct aria labels', () => {
      const msgs = [
        makeMsg('1', 'assistant', '', {
          step: 'thoughts',
          stepNumber: 1,
          totalSteps: 5,
        }),
      ];

      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={msgs}
          isStreaming={false}
          isMobile={false}
          enableVirtualization={false}
        />
      );

      expect(screen.getByRole('article', { name: 'CBT thoughts step' })).toBeInTheDocument();
    });
  });

  describe('memoization', () => {
    test('component exports memo wrapper', () => {
      expect(VirtualizedMessageList).toBeDefined();
      // Memo-wrapped components have specific properties
      expect(typeof VirtualizedMessageList).toBe('object');
    });
  });

  describe('empty state', () => {
    test('renders nothing when messages array is empty', () => {
      ComponentTestUtils.renderWithProviders(
        <VirtualizedMessageList
          messages={[]}
          isStreaming={false}
          isMobile={false}
          enableVirtualization={false}
        />
      );

      // Container should exist but be empty of messages
      expect(screen.queryByLabelText('Message from user')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Message from assistant')).not.toBeInTheDocument();
    });
  });
});
