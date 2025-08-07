'use client';

import React, { memo, useMemo } from 'react';
import type { Components } from 'react-markdown';
import { User, Heart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

// Memoized markdown components to prevent recreation on every render
const markdownComponents: Components = {
  h1: ({ ...props }) => <h1 className="text-xl sm:text-2xl font-bold mb-4 text-foreground border-b border-border/30 pb-2" {...props} />,
  h2: ({ ...props }) => <h2 className="text-lg sm:text-xl font-semibold mb-3 text-foreground mt-6 first:mt-0" {...props} />,
  h3: ({ ...props }) => <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground mt-4 first:mt-0" {...props} />,
  h4: ({ ...props }) => <h4 className="text-sm sm:text-base font-semibold mb-2 text-foreground mt-3 first:mt-0" {...props} />,
  p: ({ ...props }) => <p className="mb-4 text-foreground leading-relaxed last:mb-0" {...props} />,
  strong: ({ ...props }) => <strong className="font-bold text-foreground bg-primary/10 px-1 py-0.5 rounded" {...props} />,
  em: ({ ...props }) => <em className="italic text-accent font-medium" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-foreground" {...props} />,
  ul: ({ ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2 text-foreground" {...props} />,
  li: ({ ...props }) => <li className="text-foreground leading-relaxed pl-1" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote className="border-l-4 border-primary bg-primary/5 pl-6 pr-4 py-3 my-4 rounded-r-lg italic text-foreground relative" {...props}>
      <div className="absolute top-2 left-2 text-primary/50 text-xl">&quot;</div>
    </blockquote>
  ),
  code: ({ node, ...props }) => {
    const isInline = node?.tagName !== 'pre';
    return isInline ? (
      <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground border border-border/50" {...props} />
    ) : (
      <code className="block bg-muted p-4 rounded-lg text-sm font-mono text-foreground border border-border/50 overflow-x-auto" {...props} />
    );
  },
  pre: ({ ...props }) => <pre className="bg-muted p-4 rounded-lg border border-border/30 overflow-x-auto my-4" {...props} />,
  hr: ({ ...props }) => <hr className="border-border/50 my-6" {...props} />,
  table: ({ ...props }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-border/30 bg-card shadow-sm">
      <table className="w-full border-collapse" {...props} />
    </div>
  ),
  thead: ({ ...props }) => <thead className="bg-primary/10 border-b border-border/30" {...props} />,
  tbody: ({ ...props }) => <tbody {...props} />,
  tr: ({ ...props }) => <tr className="border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors" {...props} />,
  th: ({ ...props }) => <th className="px-4 py-3 text-left font-semibold text-foreground text-sm uppercase tracking-wide bg-primary/5" {...props} />,
  td: ({ ...props }) => <td className="px-4 py-3 text-foreground border-r border-border/10 last:border-r-0" {...props} />,
};

function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // Memoize class computations to prevent recalculation on every render
  const containerClasses = useMemo(() => cn(
    "flex items-start space-x-4 mb-6",
    isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
  ), [isUser]);

  const avatarClasses = useMemo(() => cn(
    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
    isUser 
      ? "bg-primary" 
      : "bg-gradient-to-r from-purple-500 to-pink-500"
  ), [isUser]);

  const contentClasses = useMemo(() => cn(
    "flex-1 max-w-[85%]",
    isUser ? "text-right" : "text-left"
  ), [isUser]);

  const bubbleClasses = useMemo(() => cn(
    "inline-block p-4 rounded-2xl shadow-sm",
    isUser
      ? "bg-primary text-primary-foreground rounded-br-md"
      : "bg-card border border-border/30 text-foreground rounded-bl-md"
  ), [isUser]);
  
  return (
    <div className={containerClasses}>
      {/* Avatar */}
      <div className={avatarClasses}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Heart className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={contentClasses}>
        {/* Message Bubble */}
        <div className={bubbleClasses}>
          <div className="text-therapy-sm sm:text-therapy-base leading-relaxed prose prose-sm max-w-none dark:prose-invert [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-muted-foreground mt-2 px-1",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const ChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
  // Only re-render if the message content, role, or timestamp changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.role === nextProps.message.role &&
    prevProps.message.timestamp.getTime() === nextProps.message.timestamp.getTime()
  );
});