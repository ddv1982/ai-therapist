/**
 * Unified Message Component - Single source of truth for all message display
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/design-system/message';
import { MessageAvatar } from './message-avatar';
import { MessageContent } from './message-content';
import { MessageTimestamp } from './message-timestamp';

interface MessageData {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface MessageProps {
  message: MessageData;
  variant?: 'default' | 'system';
  className?: string;
}

function MessageComponent({ message, variant: _variant = 'default', className }: MessageProps) {
  const containerClasses = buildMessageClasses(message.role, 'container');
  const contentWrapperClasses = buildMessageClasses(message.role, 'contentWrapper');
  
  return (
    <article 
      className={cn(containerClasses, className)}
      role="article"
      aria-label={`Message from ${message.role}`}
    >
      {/* Avatar */}
      <MessageAvatar role={message.role} />
      
      {/* Content Wrapper */}
      <div className={contentWrapperClasses}>
        {/* Message Content */}
        <MessageContent 
          content={message.content} 
          role={message.role}
        />
        
        {/* Timestamp */}
        <MessageTimestamp 
          timestamp={message.timestamp}
          role={message.role}
        />
      </div>
    </article>
  );
}

// Memoize for performance - only re-render if message changes
export const Message = memo(MessageComponent, (prevProps, nextProps) => {
  const prevMsg = prevProps.message;
  const nextMsg = nextProps.message;
  
  return (
    prevMsg.id === nextMsg.id &&
    prevMsg.content === nextMsg.content &&
    prevMsg.role === nextMsg.role &&
    prevMsg.timestamp.getTime() === nextMsg.timestamp.getTime() &&
    prevProps.variant === nextProps.variant
  );
});

// Export types for external use
export type { MessageData, MessageProps };