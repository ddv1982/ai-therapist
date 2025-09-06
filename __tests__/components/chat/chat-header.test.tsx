import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { ComponentTestUtils } from '__tests__/utils/test-utilities';
import { ChatHeader } from '@/features/chat/components/chat-header';

describe('ChatHeader', () => {
  test('renders new conversation title when no active session', () => {
    ComponentTestUtils.renderWithProviders(
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
      />
    );

    // Uses next-intl mock: label equals key
    expect(screen.getByText('main.newConversation')).toBeInTheDocument();
  });

  test('invokes toggle sidebar on button click', () => {
    const onToggle = jest.fn();
    ComponentTestUtils.renderWithProviders(
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
      />
    );

    const btn = screen.getByLabelText('main.toggleSidebar');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalled();
  });
});


