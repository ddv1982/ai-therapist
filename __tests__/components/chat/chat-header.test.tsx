import { screen, fireEvent, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useChat } from '@/features/chat/context/chat-context';

// Mock lucide-react before importing ChatHeader
jest.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="x-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  List: () => <div data-testid="list-icon" />,
}));

// Mock the context
jest.mock('@/features/chat/context/chat-context', () => ({
  useChat: jest.fn(),
}));

import { ChatHeader } from '@/features/chat/components/chat-header';
import enMessages from '@/i18n/messages/en.json';

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('ChatHeader', () => {
  const mockState = {
    showSidebar: false,
    isGeneratingReport: false,
    isSessionReadyForReport: true,
    isLoading: false,
    isMobile: false,
    currentSession: null,
    messages: [],
  };

  const mockActions = {
    openCBTDiary: jest.fn(),
    handleCreateObsessionsTable: jest.fn(),
  };

  const mockController = {
    setShowSidebar: jest.fn(),
    generateReport: jest.fn(),
    stopGenerating: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useChat as jest.Mock).mockReturnValue({
      state: mockState,
      actions: mockActions,
      controller: mockController,
      modelLabel: 'GPT-OSS 20B',
    });
  });

  test('renders new conversation title when no active session', () => {
    renderWithIntl(<ChatHeader />);
    expect(screen.getByText('New Conversation')).toBeInTheDocument();
  });

  test('invokes toggle sidebar on button click', () => {
    renderWithIntl(<ChatHeader />);

    const btn = screen.getByLabelText('Toggle session sidebar');
    fireEvent.click(btn);
    expect(mockController.setShowSidebar).toHaveBeenCalledWith(true);
  });

  test('disables report button when session is not ready', () => {
    (useChat as jest.Mock).mockReturnValue({
      state: {
        ...mockState,
        currentSession: 'sess-1',
        isSessionReadyForReport: false,
      },
      actions: mockActions,
      controller: mockController,
      modelLabel: 'GPT-OSS 20B',
    });

    renderWithIntl(<ChatHeader />);

    const reportButton = screen.getByTitle('Generate session report');
    expect(reportButton).toBeDisabled();
  });
});
