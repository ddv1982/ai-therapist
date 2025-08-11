import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Message } from '@/components/messages';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Heart: () => <div data-testid="heart-icon">Heart Icon</div>,
}));

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
    render(<Message message={mockMessage} />);
    
    // Check that basic content is rendered with lightweight processing
    expect(screen.getByText(/CBT Diary Entry/)).toBeInTheDocument();
    expect(screen.getByText(/Date:/)).toBeInTheDocument();
    expect(screen.getByText(/2025-08-07/)).toBeInTheDocument();
    expect(screen.getByText(/Situation/)).toBeInTheDocument();
    expect(screen.getByText(/Feelings/)).toBeInTheDocument();
  });

  it('should render content with lightweight processing', () => {
    const { container } = render(<Message message={mockMessage} />);
    
    // Check that the content is processed with our lightweight processor
    expect(container.innerHTML).toContain('CBT Diary Entry');
  });

  it('should handle table-like content', () => {
    render(<Message message={mockMessage} />);
    
    // Check that table content is present
    expect(screen.getByText(/Question/)).toBeInTheDocument();
    expect(screen.getByText(/Answer/)).toBeInTheDocument();
    expect(screen.getByText(/What does it say about me/)).toBeInTheDocument();
  });

  it('should render lists properly', () => {
    render(<Message message={mockMessage} />);
    
    // Check that list items are rendered
    expect(screen.getByText(/fear: 8\/10/i)).toBeInTheDocument();
    expect(screen.getByText(/anxiety: 4\/10/i)).toBeInTheDocument();
  });

  it('should render strong/bold text', () => {
    render(<Message message={mockMessage} />);
    
    // Check that bold text is rendered (may be within larger text blocks)
    expect(screen.getByText(/Date:/)).toBeInTheDocument();
    expect(screen.getByText(/Situation/)).toBeInTheDocument();
    expect(screen.getByText(/Feelings/)).toBeInTheDocument();
  });

  it('should render emphasis/italic text', () => {
    render(<Message message={mockMessage} />);
    
    // Check that italic text is rendered
    expect(screen.getByText(/this is for reflection and growth/i)).toBeInTheDocument();
  });

  it('should display user icon for user messages', () => {
    render(<Message message={mockMessage} />);
    
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
  });

  it('should display heart icon for assistant messages', () => {
    const assistantMessage = { ...mockMessage, role: 'assistant' as const };
    render(<Message message={assistantMessage} />);
    
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('user-icon')).not.toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    render(<Message message={mockMessage} />);
    
    // Check that a timestamp is displayed (may vary based on timezone)
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });
});