'use client';

import type { TypingIndicatorProps } from '@/types';

export function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="message-spacing flex w-full justify-start">
      <div className="message-padding therapy-muted max-w-[80%] rounded-lg rounded-bl-sm">
        <div className="flex items-center space-x-1">
          <div className="text-muted-foreground text-base">Therapist is typing</div>
          <div className="flex space-x-1">
            <div
              className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
