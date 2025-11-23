import { screen, fireEvent, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

// Mock lucide-react before importing ChatHeader
jest.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="x-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  List: () => <div data-testid="list-icon" />,
}));

import { ChatHeader } from '@/features/chat/components/chat-header';
import { ChatHeaderProvider } from '@/features/chat/context/chat-header-context';
import enMessages from '@/i18n/messages/en.json';

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('ChatHeader', () => {
  test('renders new conversation title when no active session', () => {
    renderWithIntl(
      <ChatHeaderProvider
        value={{
          showSidebar: false,
          onToggleSidebar: () => {},
          hasActiveSession: false,
          hasMessages: false,
          isGeneratingReport: false,
          isLoading: false,
          isMobile: false,
          onGenerateReport: () => {},
          onStopGenerating: () => {},
          onOpenCBTDiary: () => {},
          onCreateObsessionsTable: () => {},
          modelLabel: 'GPT-OSS 20B',
        }}
      >
        <ChatHeader />
      </ChatHeaderProvider>
    );

    expect(screen.getByText('New Conversation')).toBeInTheDocument();
  });

  test('invokes toggle sidebar on button click', () => {
    const onToggle = jest.fn();
    renderWithIntl(
      <ChatHeaderProvider
        value={{
          showSidebar: false,
          onToggleSidebar: onToggle,
          hasActiveSession: false,
          hasMessages: false,
          isGeneratingReport: false,
          isLoading: false,
          isMobile: false,
          onGenerateReport: () => {},
          onStopGenerating: () => {},
          onOpenCBTDiary: () => {},
          onCreateObsessionsTable: () => {},
          modelLabel: 'GPT-OSS 20B',
        }}
      >
        <ChatHeader />
      </ChatHeaderProvider>
    );

    const btn = screen.getByLabelText('Toggle session sidebar');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalled();
  });
});
