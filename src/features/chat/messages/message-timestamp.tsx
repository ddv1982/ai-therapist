/**
 * Message Timestamp Component - Displays formatted timestamp
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/ui/design-system/message';

interface MessageTimestampProps {
  timestamp: Date;
  role: MessageRole;
  className?: string;
}

const MessageTimestampComponent = function MessageTimestamp({
  timestamp,
  role,
  className,
}: MessageTimestampProps) {
  const timestampClasses = buildMessageClasses(role, 'timestamp');

  const formattedTime = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn(timestampClasses, className)}>
      <div className="flex items-center gap-2 text-sm">
        <span>{formattedTime}</span>
      </div>
    </div>
  );
};

// Memoized export - only re-render when timestamp changes
export const MessageTimestamp = memo(MessageTimestampComponent, (prevProps, nextProps) => {
  return (
    prevProps.timestamp.getTime() === nextProps.timestamp.getTime() &&
    prevProps.role === nextProps.role &&
    prevProps.className === nextProps.className
  );
});
