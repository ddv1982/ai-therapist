'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { TypingIndicatorProps } from '@/types/chat';

export function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="message-spacing flex w-full justify-start">
      <div className="message-padding therapy-muted rounded-lg rounded-bl-sm max-w-[80%]">
        <div className="flex items-center space-x-1">
          <div className="text-therapy-base text-muted-foreground">
            Therapist is typing
          </div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}