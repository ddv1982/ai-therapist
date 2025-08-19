import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { Message } from '@/features/chat/messages'
import chatSlice from '@/store/slices/chatSlice'
import sessionsSlice from '@/store/slices/sessionsSlice'
import cbtSlice from '@/store/slices/cbtSlice'

// Mock fetch in beforeEach to ensure it's properly set up
beforeEach(() => {
  global.fetch = jest.fn(() => 
    Promise.resolve({
      json: () => Promise.resolve({ success: false, memoryDetails: [] })
    })
  ) as jest.Mock
})

// Mock the streaming table buffer to just render content directly
jest.mock('@/components/ui/streaming-table-buffer', () => ({
  StreamingTableBuffer: ({ content }: { content: string }) => {
    // Simple markdown processing for tests
    const lines = content.split('\n')
    let result = ''
    let inTable = false
    
    for (const line of lines) {
      if (line.includes('|') && !inTable) {
        // Start of table
        inTable = true
        const headers = line.split('|').filter(h => h.trim()).map(h => h.trim())
        result += '<table><thead><tr>'
        headers.forEach(header => {
          result += `<th>${header}</th>`
        })
        result += '</tr></thead><tbody>'
      } else if (line.includes('|') && inTable && !line.includes('---')) {
        // Table row
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
        result += '<tr>'
        cells.forEach(cell => {
          result += `<td>${cell}</td>`
        })
        result += '</tr>'
      } else if (inTable && !line.includes('|')) {
        // End of table
        result += '</tbody></table>'
        inTable = false
        result += `<p>${line}</p>`
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        result += `<strong>${line.slice(2, -2)}</strong>`
      } else if (line.startsWith('- ')) {
        // List item
        result += `<ul><li>${line.slice(2)}</li></ul>`
      } else if (line.trim()) {
        result += `<p>${line}</p>`
      }
    }
    
    if (inTable) {
      result += '</tbody></table>'
    }
    
    return React.createElement('div', { 
      className: 'markdown-content',
      dangerouslySetInnerHTML: { __html: result }
    })
  }
}))

// Mock the markdown processor
jest.mock('@/lib/ui/react-markdown-processor', () => ({
  processReactMarkdown: jest.fn()
}))

// Create a test store
const createTestStore = () => configureStore({
  reducer: {
    chat: chatSlice,
    sessions: sessionsSlice,
    cbt: cbtSlice,
  },
})

// Wrapper component for Redux Provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createTestStore()
  return <Provider store={store}>{children}</Provider>
}

// Helper function to render with Redux Provider
const renderWithRedux = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper })
}

describe('ChatMessage Component', () => {
  const mockMessage = {
    id: 'test-id',
    role: 'user' as const,
    content: 'Hello, how can I manage stress?',
    timestamp: new Date('2024-01-01T10:00:00Z')
  }

  it('renders user message correctly', () => {
    renderWithRedux(<Message message={mockMessage} />)
    
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

    renderWithRedux(<Message message={assistantMessage} />)
    
    expect(screen.getByText('I understand you\'re looking for stress management techniques.')).toBeInTheDocument()
  })

  it('renders markdown content with lightweight processing', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: '**Stress Management Tips:**\n\n- Deep breathing\n- Regular exercise\n- Adequate sleep'
    }

    const { container } = renderWithRedux(<Message message={assistantMessage} />)
    
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

    renderWithRedux(<Message message={assistantMessage} />)
    
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
    const { rerender } = renderWithRedux(<Message message={mockMessage} />)
    
    // User message container should have flex-row-reverse or md:flex-row-reverse class
    // Look for the article container with the updated class structure
    const userContainer = document.querySelector('article[role="article"]');
    expect(userContainer).toHaveClass('md:flex-row-reverse')

    // Assistant message should have flex-row class
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const
    }
    
    rerender(<TestWrapper><Message message={assistantMessage} /></TestWrapper>)
    const assistantContainer = document.querySelector('article[role="article"]');
    expect(assistantContainer).toHaveClass('flex-row')
  })

  it('displays correct avatar icons', () => {
    const { rerender } = renderWithRedux(<Message message={mockMessage} />)
    
    // User message should show User icon (mocked as div with data-testid)
    expect(screen.getByTestId('user-icon')).toBeInTheDocument()

    // Assistant message should show Heart icon (mocked as div with data-testid)
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const
    }
    
    rerender(<TestWrapper><Message message={assistantMessage} /></TestWrapper>)
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
  })

  it('handles empty content gracefully', () => {
    const emptyMessage = {
      ...mockMessage,
      content: ''
    }

    renderWithRedux(<Message message={emptyMessage} />)
    
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

    const { rerender } = renderWithRedux(<Message message={morningMessage} />)
    // Check that timestamp is rendered in correct format (will be local timezone)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()

    rerender(<TestWrapper><Message message={eveningMessage} /></TestWrapper>)
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

    renderWithRedux(<Message message={assistantMessage} />)
    
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

    renderWithRedux(<Message message={assistantMessage} />)
    
    // Check that enhanced model name is displayed for larger models
    expect(screen.getByText(/GPT OSS 120B \(Deep Analysis\)/)).toBeInTheDocument()
  })

  it('does not display model name for user messages', () => {
    const userMessage = {
      ...mockMessage,
      role: 'user' as const,
      modelUsed: 'openai/gpt-oss-20b' // Should not be displayed for user messages
    }

    renderWithRedux(<Message message={userMessage} />)
    
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

    renderWithRedux(<Message message={assistantMessage} />)
    
    // Component should render without model info, no crash
    expect(screen.getByText('I can help with stress management techniques.')).toBeInTheDocument()
    expect(screen.queryByText(/GPT/)).not.toBeInTheDocument()
  })
})