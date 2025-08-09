'use client';

import React, { memo, useMemo } from 'react';
import { Message, type MessageData } from '@/components/message';

interface VirtualizedMessageListProps {
  messages: MessageData[];
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
      {visibleMessages.map((message, index) => {
        const isLastMessage = index === visibleMessages.length - 1;
        const isAssistantMessage = message.role === 'assistant';
        const shouldShowTypingIndicator = isStreaming && isLastMessage && isAssistantMessage && message.content === '';
        
        return (
          <div key={message.id}>
            {/* Show typing indicator before empty assistant message */}
            {shouldShowTypingIndicator && (
              <div className="flex justify-start items-center py-2 mb-2 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                  {/* Avatar placeholder */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 shadow-lg flex items-center justify-center">
                    <div className="w-4 h-4 text-white">❤️</div>
                  </div>
                  {/* Typing dots */}
                  <div className="flex space-x-2 animate-pulse">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Only show message if it has content */}
            {message.content && (
              <div
                role="article"
                aria-label={`Message from ${message.role}`}
              >
                <Message message={message} />
              </div>
            )}
          </div>
        );
      })}
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