/**
 * Message Content Component - Handles content processing and display
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/ui/design-system/message';
import { Markdown } from '@/components/ui/markdown';
import { logger } from '@/lib/utils/logger';
import { isDevelopment } from '@/config/env.public';

interface MessageContentProps {
  content: string;
  role: MessageRole;
  messageId?: string;
  className?: string;
}

// Check if message content suggests it's a session report with CBT data
function detectCBTSessionReport(content: string): boolean {
  const cbtIndicators = [
    'ERP (Exposure & Response Prevention)',
    'Schema Therapy Analysis',
    'Identified Distortions',
    'Active Schema Modes',
    'emotion.*rating',
    'thought.*record',
    'core.*belief'
  ];
  
  return cbtIndicators.some(pattern => 
    new RegExp(pattern, 'is').test(content)
  );
}

export function MessageContent({ content, role, messageId, className }: MessageContentProps) {
  // Check if this is a CBT session report message
  const isCBTReport = role === 'assistant' && detectCBTSessionReport(content);
  
  // Debug logging (development only)
  if (isDevelopment && isCBTReport) {
    logger.secureDevLog('CBT report detected', { component: 'MessageContent', messageId, role });
  }
  
  // (Previously loaded CBT report data for tables; removed as tables render directly from markdown.)
  
  const bubbleClasses = buildMessageClasses(role, 'bubble');
  const contentClasses = role === 'user' ? 'message-content-user' : 'message-content-assistant';
  
  return (
    <div className={cn(bubbleClasses, contentClasses, 'therapeutic-content', className)}>
      <Markdown isUser={role === 'user'}>
        {content}
      </Markdown>
    </div>
  );
}
