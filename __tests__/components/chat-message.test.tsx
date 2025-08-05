import { render, screen } from '@testing-library/react'
import { ChatMessage } from '@/components/chat/chat-message'

describe('ChatMessage Component', () => {
  const mockMessage = {
    id: 'test-id',
    role: 'user' as const,
    content: 'Hello, how can I manage stress?',
    timestamp: new Date('2024-01-01T10:00:00Z')
  }

  it('renders user message correctly', () => {
    render(<ChatMessage message={mockMessage} />)
    
    expect(screen.getByText('Hello, how can I manage stress?')).toBeInTheDocument()
    expect(screen.getByText('10:00 AM')).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'I understand you\'re looking for stress management techniques.'
    }

    render(<ChatMessage message={assistantMessage} />)
    
    expect(screen.getByText('I understand you\'re looking for stress management techniques.')).toBeInTheDocument()
  })

  it('renders markdown content for assistant messages', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: '**Stress Management Tips:**\n\n- Deep breathing\n- Regular exercise\n- Adequate sleep'
    }

    render(<ChatMessage message={assistantMessage} />)
    
    // Check for rendered markdown elements
    expect(screen.getByText('Stress Management Tips:')).toBeInTheDocument()
    expect(screen.getByText('Deep breathing')).toBeInTheDocument()
    expect(screen.getByText('Regular exercise')).toBeInTheDocument()
    expect(screen.getByText('Adequate sleep')).toBeInTheDocument()
  })

  it('renders table content correctly', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: `| Technique | Duration | Frequency |
|-----------|----------|-----------|
| Meditation | 10-20 min | Daily |
| Exercise | 30 min | 3x/week |`
    }

    render(<ChatMessage message={assistantMessage} />)
    
    expect(screen.getByText('Technique')).toBeInTheDocument()
    expect(screen.getByText('Meditation')).toBeInTheDocument()
    expect(screen.getByText('10-20 min')).toBeInTheDocument()
  })

  it('applies correct styling for user vs assistant messages', () => {
    const { rerender } = render(<ChatMessage message={mockMessage} />)
    
    // User message should have flex-row-reverse class
    let messageContainer = screen.getByText('Hello, how can I manage stress?').closest('div[class*="flex"]')
    expect(messageContainer).toHaveClass('flex-row-reverse')

    // Assistant message should have flex-row class
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const
    }
    
    rerender(<ChatMessage message={assistantMessage} />)
    messageContainer = screen.getByText('Hello, how can I manage stress?').closest('div[class*="flex"]')
    expect(messageContainer).toHaveClass('flex-row')
  })

  it('displays correct avatar icons', () => {
    const { rerender } = render(<ChatMessage message={mockMessage} />)
    
    // User message should show User icon
    expect(document.querySelector('svg')).toBeInTheDocument()

    // Assistant message should show Heart icon
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const
    }
    
    rerender(<ChatMessage message={assistantMessage} />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('handles empty content gracefully', () => {
    const emptyMessage = {
      ...mockMessage,
      content: ''
    }

    render(<ChatMessage message={emptyMessage} />)
    
    // Component should still render without crashing
    expect(screen.getByText('10:00 AM')).toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    const morningMessage = {
      ...mockMessage,
      timestamp: new Date('2024-01-01T09:30:00Z')
    }
    
    const eveningMessage = {
      ...mockMessage,
      timestamp: new Date('2024-01-01T21:45:00Z')
    }

    const { rerender } = render(<ChatMessage message={morningMessage} />)
    expect(screen.getByText('9:30 AM')).toBeInTheDocument()

    rerender(<ChatMessage message={eveningMessage} />)
    expect(screen.getByText('9:45 PM')).toBeInTheDocument()
  })
})