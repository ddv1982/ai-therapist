import React from 'react';
import { screen, fireEvent, render } from '@testing-library/react';

// Mock lucide-react before importing ChatHeader
jest.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="x-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  List: () => <div data-testid="list-icon" />,
}));

import { ChatHeader } from '@/features/chat/components/chat-header';

describe('ChatHeader', () => {
  test('renders new conversation title when no active session', () => {
    render(
      <ChatHeader
        showSidebar={false}
        onToggleSidebar={() => {}}
        hasActiveSession={false}
        hasMessages={false}
        isGeneratingReport={false}
        isLoading={false}
        isMobile={false}
        onGenerateReport={() => {}}
        onStopGenerating={() => {}}
        onOpenCBTDiary={() => {}}
        onCreateObsessionsTable={() => {}}
      />
    );

    // Uses next-intl mock: label equals key
    expect(screen.getByText('main.newConversation')).toBeInTheDocument();
  });

  test('invokes toggle sidebar on button click', () => {
    const onToggle = jest.fn();
    render(
      <ChatHeader
        showSidebar={false}
        onToggleSidebar={onToggle}
        hasActiveSession={false}
        hasMessages={false}
        isGeneratingReport={false}
        isLoading={false}
        isMobile={false}
        onGenerateReport={() => {}}
        onStopGenerating={() => {}}
        onOpenCBTDiary={() => {}}
        onCreateObsessionsTable={() => {}}
      />
    );

    const btn = screen.getByLabelText('main.toggleSidebar');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalled();
  });
});


