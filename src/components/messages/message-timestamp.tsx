/**
 * Message Timestamp Component - Displays formatted timestamp
 */

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/design-system/message';

interface MessageTimestampProps {
  timestamp: Date;
  role: MessageRole;
  modelUsed?: string;
  className?: string;
}

export function MessageTimestamp({ timestamp, role, modelUsed, className }: MessageTimestampProps) {
  const timestampClasses = buildMessageClasses(role, 'timestamp');
  
  const formattedTime = timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Format model name for display
  const formatModelName = (model?: string): string => {
    if (!model) return '';
    
    // Convert from API format to user-friendly format
    if (model === 'openai/gpt-oss-20b') {
      return 'GPT OSS 20B';
    } else if (model === 'openai/gpt-oss-120b') {
      return 'GPT OSS 120B (Deep Analysis)';
    }
    
    // Fallback to original name if format is unknown
    return model.replace(/^[^/]+\//, '').toUpperCase();
  };
  
  return (
    <div className={cn(timestampClasses, className)}>
      <div className="flex items-center gap-2 text-sm">
        <span>{formattedTime}</span>
        {role === 'assistant' && modelUsed && (
          <span className="text-muted-foreground/70 text-xs">
            • {formatModelName(modelUsed)}
          </span>
        )}
      </div>
    </div>
  );
}