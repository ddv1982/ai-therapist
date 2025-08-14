/**
 * Tests for the new unified Message component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Message } from '@/features/chat/messages';

describe('Message Component', () => {
  const mockMessage = {
    id: 'test-1',
    role: 'assistant' as const,
    content: 'Hello, this is a test message with **bold** text.',
    timestamp: new Date('2023-01-01T12:00:00Z')
  };

  it('renders message content correctly', () => {
    render(<Message message={mockMessage} />);
    
    // Text is split due to bold formatting, so search for parts
    expect(screen.getByText(/Hello, this is a test message with/)).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('displays timestamp correctly', () => {
    render(<Message message={mockMessage} />);
    
    // Timestamp will show based on local timezone, so just check it's there
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('renders assistant avatar for assistant messages', () => {
    render(<Message message={mockMessage} />);
    
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Message from assistant');
  });

  it('renders user avatar for user messages', () => {
    const userMessage = { ...mockMessage, role: 'user' as const };
    render(<Message message={userMessage} />);
    
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Message from user');
  });

  it('processes markdown content', () => {
    const messageWithMarkdown = {
      ...mockMessage,
      content: '## Heading\n\n- List item\n- Another item\n\n**Bold text**'
    };
    
    render(<Message message={messageWithMarkdown} />);
    
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('List item')).toBeInTheDocument();
    expect(screen.getByText('Bold text')).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    const emptyMessage = { ...mockMessage, content: '' };
    render(<Message message={emptyMessage} />);
    
    // Should not crash and should render a timestamp
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });
});