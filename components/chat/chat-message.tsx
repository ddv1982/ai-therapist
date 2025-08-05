'use client';

import React from 'react';
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

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "flex items-start space-x-4 mb-6",
      isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
        isUser 
          ? "bg-primary" 
          : "bg-gradient-to-r from-purple-500 to-pink-500"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Heart className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[85%]",
        isUser ? "text-right" : "text-left"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "inline-block p-4 rounded-2xl shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border/30 text-foreground rounded-bl-md"
        )}>
          {isUser ? (
            <div className="text-therapy-sm sm:text-therapy-base leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div className="text-therapy-sm sm:text-therapy-base leading-relaxed prose prose-sm max-w-none dark:prose-invert [&>*:last-child]:mb-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl sm:text-2xl font-bold mb-4 text-foreground border-b border-border/30 pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg sm:text-xl font-semibold mb-3 text-foreground mt-6 first:mt-0" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground mt-4 first:mt-0" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-sm sm:text-base font-semibold mb-2 text-foreground mt-3 first:mt-0" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 text-foreground leading-relaxed last:mb-0" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-foreground bg-primary/10 px-1 py-0.5 rounded" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-accent font-medium" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-foreground" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 space-y-2 text-foreground" {...props} />,
                  li: ({node, ...props}) => <li className="text-foreground leading-relaxed pl-1" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-primary bg-primary/5 pl-6 pr-4 py-3 my-4 rounded-r-lg italic text-foreground relative" {...props}>
                      <div className="absolute top-2 left-2 text-primary/50 text-xl">&quot;</div>
                    </blockquote>
                  ),
                  code: ({node, ...props}) => {
                    const isInline = node?.tagName !== 'pre';
                    return isInline ? (
                      <code className="bg-muted px-2 py-1 rounded text-sm text-foreground font-mono border border-border/30" {...props} />
                    ) : (
                      <code className="block bg-muted p-4 rounded-lg text-sm text-foreground font-mono border border-border/30 overflow-x-auto my-4" {...props} />
                    );
                  },
                  pre: ({node, ...props}) => <pre className="bg-muted p-4 rounded-lg border border-border/30 overflow-x-auto my-4" {...props} />,
                  a: ({node, ...props}) => <a className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium" {...props} />,
                  hr: ({node, ...props}) => <hr className="border-border/50 my-6" {...props} />,
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-6 rounded-lg border border-border/30 bg-card shadow-sm">
                      <table className="w-full border-collapse" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => <thead className="bg-primary/10 border-b border-border/30" {...props} />,
                  tbody: ({node, ...props}) => <tbody {...props} />,
                  tr: ({node, ...props}) => <tr className="border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors" {...props} />,
                  th: ({node, ...props}) => <th className="px-4 py-3 text-left font-semibold text-foreground text-sm uppercase tracking-wide bg-primary/5" {...props} />,
                  td: ({node, ...props}) => <td className="px-4 py-3 text-foreground border-r border-border/10 last:border-r-0" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
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