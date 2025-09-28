/**
 * Message Timestamp Component - Displays formatted timestamp
 */

import React from 'react';
import { supportsWebSearch, getModelDisplayName, languageModels, type ModelID } from '@/ai/providers';
import { cn } from '@/lib/utils/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/ui/design-system/message';

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
  
  // Format model name for display using providers
  const formatModelName = (model?: string): string => {
    if (!model) return '';
    const isModelID = (m: string): m is ModelID => Object.prototype.hasOwnProperty.call(languageModels, m);
    const base = isModelID(model) ? getModelDisplayName(model) : model.replace(/^[^/]+\//, '').toUpperCase();
    // Add hint for models with web search/deep analysis capability
    return (isModelID(model) && supportsWebSearch(model)) ? `${base} (Deep Analysis)` : base;
  };
  
  return (
    <div className={cn(timestampClasses, className)}>
      <div className="flex items-center gap-2 text-sm">
        <span>{formattedTime}</span>
        {role === 'assistant' && modelUsed && (
          <span className="text-muted-foreground/70 text-sm">
            • {formatModelName(modelUsed)}
          </span>
        )}
      </div>
    </div>
  );
}