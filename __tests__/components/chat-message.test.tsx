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

// No streaming table buffer anymore; Streamdown handles incomplete markdown

// Mock the markdown processor
// Streamdown renders directly via Markdown component now; no need to mock old processor

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
    
    // With mocked Streamdown, markdown is simplified; assert raw text presence
    expect(screen.getByText(/Technique/)).toBeInTheDocument()
    expect(screen.getByText(/Meditation/)).toBeInTheDocument()
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
  })

  it('does not render inline timestamps', () => {
    const morningMessage = {
      ...mockMessage,
      timestamp: new Date('2024-01-01T09:30:00Z')
    }

    const eveningMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      timestamp: new Date('2024-01-01T21:45:00Z')
    }

    const { rerender } = renderWithRedux(<Message message={morningMessage} />)
    expect(screen.queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument()

    rerender(<TestWrapper><Message message={eveningMessage} /></TestWrapper>)
    expect(screen.queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument()
  })

  it('does not duplicate model name for assistant messages', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'I can help with stress management techniques.',
      modelUsed: 'openai/gpt-oss-20b'
    }

    renderWithRedux(<Message message={assistantMessage} />)
    
    // Model name should not appear within the message timestamp row anymore
    expect(screen.queryByText(/GPT OSS 20B/)).not.toBeInTheDocument()
  })

  it('omits enhanced model name suffix in assistant messages', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'I can provide in-depth analysis of your CBT thought record.',
      modelUsed: 'openai/gpt-oss-120b'
    }

    renderWithRedux(<Message message={assistantMessage} />)
    
    // Enhanced suffix should no longer be rendered beneath the chat message
    expect(screen.queryByText(/GPT OSS 120B \(Deep Analysis\)/)).not.toBeInTheDocument()
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