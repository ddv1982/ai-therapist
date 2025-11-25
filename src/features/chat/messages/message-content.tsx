/**
 * Message Content Component - Handles content processing and display
 */

import { memo } from 'react';
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
    'core.*belief',
  ];

  return cbtIndicators.some((pattern) => new RegExp(pattern, 'is').test(content));
}

// Check if content contains a CBT Summary Card marker (rendered as standalone card)
function isCBTSummaryCardContent(content: string): boolean {
  const CBT_CARD_PATTERN = /<!-- CBT_SUMMARY_CARD:/;
  return CBT_CARD_PATTERN.test(content);
}

const MessageContentComponent = function MessageContent({
  content,
  role,
  messageId,
  className,
}: MessageContentProps) {
  // Check if this is a CBT session report message
  const isCBTReport = role === 'assistant' && detectCBTSessionReport(content);

  // Check if this contains a CBT Summary Card (should render without bubble wrapper)
  const isCBTCard = role === 'assistant' && isCBTSummaryCardContent(content);

  // Debug logging (development only)
  if (isDevelopment && isCBTReport) {
    logger.secureDevLog('CBT report detected', { component: 'MessageContent', messageId, role });
  }

  // For CBT Summary Cards: render without bubble wrapper for clean standalone appearance
  if (isCBTCard) {
    return (
      <div className={cn('cbt-card-container w-full max-w-2xl', className)}>
        <Markdown isUser={false}>{content}</Markdown>
      </div>
    );
  }

  // For regular messages: apply bubble styling with therapeutic content
  const bubbleClasses = buildMessageClasses(role, 'bubble');
  const contentClasses = role === 'user' ? 'message-content-user' : 'message-content-assistant';

  return (
    <div className={cn(bubbleClasses, contentClasses, 'therapeutic-content', className)}>
      <Markdown isUser={role === 'user'}>{content}</Markdown>
    </div>
  );
};

// Memoized export - only re-render when content or role changes
export const MessageContent = memo(MessageContentComponent, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.role === nextProps.role &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.className === nextProps.className
  );
});
