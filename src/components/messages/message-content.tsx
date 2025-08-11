/**
 * Message Content Component - Handles content processing and display
 */

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/design-system/message';
import { processMarkdown } from '@/lib/ui/markdown-processor';

interface MessageContentProps {
  content: string;
  role: MessageRole;
  className?: string;
}

export function MessageContent({ content, role, className }: MessageContentProps) {
  const processedContent = processMarkdown(content, role === 'user');
  const bubbleClasses = buildMessageClasses(role, 'bubble');
  const contentClasses = role === 'user' ? 'message-content-user' : 'message-content-assistant';
  
  return (
    <div 
      className={cn(bubbleClasses, contentClasses, className)}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}