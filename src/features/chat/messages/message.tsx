/**
 * Unified Message Component - Single source of truth for all message display
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/ui/design-system/message';
import { MessageAvatar } from './message-avatar';
import { MessageContent } from './message-content';
import { MessageActions } from './message-actions';

interface MessageData {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  modelUsed?: string;
  metadata?: {
    type?: string;
    step?: string;
    stepNumber?: number;
    totalSteps?: number;
    sessionData?: unknown;
    data?: unknown;
    dismissed?: boolean;
    dismissedReason?: 'auto' | 'manual' | null;
  };
  digest?: string;
}

interface MessageProps {
  message: MessageData;
  variant?: 'default' | 'system';
  className?: string;
}

function MessageComponent({ message, className }: MessageProps) {
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
      <div className={cn(contentWrapperClasses, 'group relative')}>
        {/* Message Content */}
        <MessageContent content={message.content} role={message.role} messageId={message.id} />

        {/* Message Actions (CBT Export) */}
        <MessageActions
          messageId={message.id}
          messageContent={message.content}
          messageRole={message.role}
          timestamp={message.timestamp}
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
    prevMsg.modelUsed === nextMsg.modelUsed &&
    prevProps.variant === nextProps.variant &&
    prevProps.className === nextProps.className
  );
});

// Export types for external use
export type { MessageData };
