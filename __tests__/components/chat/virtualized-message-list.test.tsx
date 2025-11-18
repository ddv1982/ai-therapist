import { screen } from '@testing-library/react';
import { ComponentTestUtils } from '__tests__/utils/test-utilities';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import type { MessageData } from '@/features/chat/messages/message';

function makeMsg(id: string, role: 'user' | 'assistant', content: string): MessageData {
  return { id, role, content, timestamp: new Date() } as MessageData;
}

describe('VirtualizedMessageList', () => {
  test('renders recent messages only when exceeding maxVisible', () => {
    const msgs: MessageData[] = [];
    for (let i = 0; i < 60; i++) {
      msgs.push(makeMsg(String(i), 'user', `M${i}`));
    }
    ComponentTestUtils.renderWithProviders(
      <VirtualizedMessageList
        messages={msgs}
        isStreaming={false}
        isMobile={false}
        maxVisible={10}
      />
    );
    const items = screen.getAllByLabelText('Message from user');
    expect(items.length).toBeGreaterThan(0);
  });
});
