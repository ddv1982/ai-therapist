'use client';

import React from 'react';
import { cn, formatTimestamp } from '@/lib/utils';
import type { MessageBubbleProps } from '@/types/chat';

export function MessageBubble({ message, isUser, timestamp }: MessageBubbleProps) {
  return (
    <div className={cn(
      "message-spacing flex w-full", // 16px bottom margin per design
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "message-padding max-w-[80%] rounded-lg", // 8px internal padding per design
        isUser 
          ? "therapy-accent rounded-br-sm" // User messages: accent color, slight radius adjustment
          : "therapy-muted rounded-bl-sm" // AI messages: neutral styling
      )}>
        <div className="text-therapy-base leading-relaxed selectable-text">
          {message.content}
        </div>
        <div className={cn(
          "text-therapy-sm mt-1", // Size 4 for metadata per design principles
          isUser ? "text-accent-foreground/70" : "text-muted-foreground"
        )}>
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );
}