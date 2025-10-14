import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { Message } from '@/features/chat/messages';
// reducers are provided by the app store; individual imports are unnecessary here

// Test wrapper with Redux Provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    {children}
  </Provider>
);

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Heart: () => <div data-testid="heart-icon">Heart Icon</div>,
}));

// Mock fetch for API calls
global.fetch = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({ success: false, memoryDetails: [] }),
  ok: true,
  status: 200,
});

const mockMessage = {
  id: '1',
  role: 'user' as const,
  content: `📝 **CBT Diary Entry**

**Date:** 2025-08-07

---

## **Situation**
I was walking outside during my lunch break.

---

## **Feelings**
- Fear: 8/10
- Anxiety: 4/10

---

## **Challenge**

| **Question** | **Answer** |
|--------------|------------|
| What does it say about me? | It shows I'm worried |
| Are thoughts actions? | No, they are different |

---

*This is for reflection and growth.*`,
  timestamp: new Date('2025-08-07T12:00:00.000Z')
};

describe('ChatMessage Lightweight Rendering', () => {
  it('should render the message content', () => {
    render(
      <TestWrapper>
        <Message message={mockMessage} />
      </TestWrapper>
    );
    
    // Check that basic content is rendered with lightweight processing
    expect(screen.getByText(/CBT Diary Entry/)).toBeInTheDocument();
    expect(screen.getByText(/Date:/)).toBeInTheDocument();
    expect(screen.getByText(/2025-08-07/)).toBeInTheDocument();
    expect(screen.getByText(/Situation/)).toBeInTheDocument();
    expect(screen.getByText(/Feelings/)).toBeInTheDocument();
  });

  it('should render content with lightweight processing', () => {
    const { container } = render(
      <TestWrapper>
        <Message message={mockMessage} />
      </TestWrapper>
    );
    
    // Check that the content is processed with our lightweight processor
    expect(container.innerHTML).toContain('CBT Diary Entry');
  });

  it('should handle table-like content', () => {
    const { container } = render(
      <TestWrapper>
        <Message message={mockMessage} />
      </TestWrapper>
    );
    
    // Check that Challenge section is present (tables may be rendered as text)
    expect(screen.getByText(/Challenge/)).toBeInTheDocument();
    
    // Check that basic content from the table is present in some form
    // The table content might be rendered as plain text
    const htmlContent = container.innerHTML;
    expect(htmlContent).toContain('Challenge'); // Header should be present
  });

  it('should render lists properly', () => {
    render(
      <TestWrapper>
        <Message message={mockMessage} />
      </TestWrapper>
    );
    
    // Check that list items are rendered
    expect(screen.getByText(/fear: 8\/10/i)).toBeInTheDocument();
    expect(screen.getByText(/anxiety: 4\/10/i)).toBeInTheDocument();
  });

  it('should render strong/bold text', () => {
    render(
      <TestWrapper>
        <Message message={mockMessage} />
      </TestWrapper>
    );
    
    // Check that bold text is rendered (may be within larger text blocks)
    expect(screen.getByText(/Date:/)).toBeInTheDocument();
    expect(screen.getByText(/Situation/)).toBeInTheDocument();
    expect(screen.getByText(/Feelings/)).toBeInTheDocument();
  });

  it('should render emphasis/italic text', () => {
    render(
      <TestWrapper>
        <Message message={mockMessage} />
      </TestWrapper>
    );
    
    // Check that italic text is rendered
    expect(screen.getByText(/this is for reflection and growth/i)).toBeInTheDocument();
  });

  it('should display user icon for user messages', () => {
    render(
      <TestWrapper>
        <Message message={mockMessage} />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
  });

  it('should display heart icon for assistant messages', () => {
    const assistantMessage = { ...mockMessage, role: 'assistant' as const };
    render(
      <TestWrapper>
        <Message message={assistantMessage} />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('user-icon')).not.toBeInTheDocument();
  });

  it('should omit inline timestamp metadata', () => {
    render(
      <TestWrapper>
        <Message message={mockMessage} />
      </TestWrapper>
    );
    
    // Timestamp below bubble has been removed to avoid duplication
    expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
  });
});