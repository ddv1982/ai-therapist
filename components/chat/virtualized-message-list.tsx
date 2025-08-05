'use client';

import React, { memo, useMemo } from 'react';
import { ChatMessage } from './chat-message';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  isStreaming: boolean;
  isMobile: boolean;
}

// Simple virtualization - only render visible and near-visible messages
function VirtualizedMessageListComponent({ 
  messages, 
  isStreaming, 
  isMobile 
}: VirtualizedMessageListProps) {
  // For conversations with many messages, only render the most recent ones to improve performance
  const visibleMessages = useMemo(() => {
    if (messages.length <= 50) {
      // For shorter conversations, render all messages
      return messages;
    }
    
    // For longer conversations, show only the most recent 50 messages
    // This prevents the DOM from getting too heavy
    return messages.slice(-50);
  }, [messages]);

  const containerClassName = useMemo(() => 
    `max-w-4xl mx-auto ${isMobile ? 'space-y-3 pb-3' : 'space-y-6'}`,
    [isMobile]
  );

  return (
    <div className={containerClassName}>
      {visibleMessages.map((message, index) => (
        <div
          key={message.id}
          role="article"
          aria-label={`Message from ${message.role}`}
        >
          <ChatMessage message={message} />
        </div>
      ))}
      
      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex justify-center items-center py-4">
          <div className="flex space-x-2 animate-pulse">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export const VirtualizedMessageList = memo(VirtualizedMessageListComponent, (prevProps, nextProps) => {
  // Only re-render if messages changed, streaming status changed, or mobile status changed
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.messages[prevProps.messages.length - 1]?.id === nextProps.messages[nextProps.messages.length - 1]?.id &&
    prevProps.messages[prevProps.messages.length - 1]?.content === nextProps.messages[nextProps.messages.length - 1]?.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.isMobile === nextProps.isMobile
  );
});