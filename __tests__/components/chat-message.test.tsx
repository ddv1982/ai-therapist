import { render, screen } from '@testing-library/react'
import { Message } from '@/features/chat/messages'

describe('ChatMessage Component', () => {
  const mockMessage = {
    id: 'test-id',
    role: 'user' as const,
    content: 'Hello, how can I manage stress?',
    timestamp: new Date('2024-01-01T10:00:00Z')
  }

  it('renders user message correctly', () => {
    render(<Message message={mockMessage} />)
    
    expect(screen.getByText('Hello, how can I manage stress?')).toBeInTheDocument()
    // The timestamp will be formatted based on local timezone, so we'll look for the time pattern
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'I understand you\'re looking for stress management techniques.'
    }

    render(<Message message={assistantMessage} />)
    
    expect(screen.getByText('I understand you\'re looking for stress management techniques.')).toBeInTheDocument()
  })

  it('renders markdown content with lightweight processing', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: '**Stress Management Tips:**\n\n- Deep breathing\n- Regular exercise\n- Adequate sleep'
    }

    const { container } = render(<Message message={assistantMessage} />)
    
    // Check for rendered content with lightweight processing
    expect(screen.getByText('Stress Management Tips:')).toBeInTheDocument()
    expect(screen.getByText('Deep breathing')).toBeInTheDocument()
    expect(screen.getByText('Regular exercise')).toBeInTheDocument()
    expect(screen.getByText('Adequate sleep')).toBeInTheDocument()
    // Check that list items are properly structured with standard HTML
    const listItems = container.querySelectorAll('li')
    expect(listItems).toHaveLength(3)
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

    render(<Message message={assistantMessage} />)
    
    // Check for properly formatted table with headers and data
    expect(screen.getByText('Technique')).toBeInTheDocument()
    expect(screen.getByText('Duration')).toBeInTheDocument()
    expect(screen.getByText('Frequency')).toBeInTheDocument()
    expect(screen.getByText('Meditation')).toBeInTheDocument()
    expect(screen.getByText('10-20 min')).toBeInTheDocument()
    expect(screen.getByText('Daily')).toBeInTheDocument()
    expect(screen.getByText('Exercise')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('3x/week')).toBeInTheDocument()
  })

  it('applies correct styling for user vs assistant messages', () => {
    const { rerender } = render(<Message message={mockMessage} />)
    
    // User message container should have flex-row-reverse class
    // Look for the article container with the updated class structure
    const userContainer = document.querySelector('.flex.items-start.gap-4.mb-6');
    expect(userContainer).toHaveClass('flex-row-reverse')

    // Assistant message should have flex-row class
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const
    }
    
    rerender(<Message message={assistantMessage} />)
    const assistantContainer = document.querySelector('.flex.items-start.gap-4.mb-6');
    expect(assistantContainer).toHaveClass('flex-row')
  })

  it('displays correct avatar icons', () => {
    const { rerender } = render(<Message message={mockMessage} />)
    
    // User message should show User icon
    expect(document.querySelector('svg')).toBeInTheDocument()

    // Assistant message should show Heart icon
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const
    }
    
    rerender(<Message message={assistantMessage} />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('handles empty content gracefully', () => {
    const emptyMessage = {
      ...mockMessage,
      content: ''
    }

    render(<Message message={emptyMessage} />)
    
    // Component should still render without crashing - check for timestamp pattern
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
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

    const { rerender } = render(<Message message={morningMessage} />)
    // Check that timestamp is rendered in correct format (will be local timezone)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()

    rerender(<Message message={eveningMessage} />)
    // Check that a different timestamp is rendered 
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('displays model name for assistant messages', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'I can help with stress management techniques.',
      modelUsed: 'openai/gpt-oss-20b'
    }

    render(<Message message={assistantMessage} />)
    
    // Check that model name is displayed for assistant messages
    expect(screen.getByText(/GPT OSS 20B/)).toBeInTheDocument()
  })

  it('displays enhanced model name for larger models', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'I can provide in-depth analysis of your CBT thought record.',
      modelUsed: 'openai/gpt-oss-120b'
    }

    render(<Message message={assistantMessage} />)
    
    // Check that enhanced model name is displayed for larger models
    expect(screen.getByText(/GPT OSS 120B \(Deep Analysis\)/)).toBeInTheDocument()
  })

  it('does not display model name for user messages', () => {
    const userMessage = {
      ...mockMessage,
      role: 'user' as const,
      modelUsed: 'openai/gpt-oss-20b' // Should not be displayed for user messages
    }

    render(<Message message={userMessage} />)
    
    // Check that model name is NOT displayed for user messages
    expect(screen.queryByText(/GPT OSS 20B/)).not.toBeInTheDocument()
  })

  it('handles assistant messages without model information', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'I can help with stress management techniques.'
      // No modelUsed property
    }

    render(<Message message={assistantMessage} />)
    
    // Component should render without model info, no crash
    expect(screen.getByText('I can help with stress management techniques.')).toBeInTheDocument()
    expect(screen.queryByText(/GPT/)).not.toBeInTheDocument()
  })
})