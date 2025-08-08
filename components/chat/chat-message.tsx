'use client';

import React, { memo, useMemo } from 'react';
import { User, Heart } from 'lucide-react';
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

// Enhanced markdown processor with proper table support
function processMarkdown(text: string): string {
  // Process tables first (before other replacements)
  text = processMarkdownTables(text);
  
  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground bg-primary/10 px-1 py-0.5 rounded">$1</strong>')
    // Italic text  
    .replace(/\*(.*?)\*/g, '<em class="italic text-accent font-medium">$1</em>')
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-base sm:text-lg font-semibold mb-2 text-foreground mt-4 first:mt-0">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg sm:text-xl font-semibold mb-3 text-foreground mt-6 first:mt-0">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl sm:text-2xl font-bold mb-4 text-foreground border-b border-border/30 pb-2">$1</h1>')
    // Horizontal rules (but not table separators)
    .replace(/^---$/gm, '<hr class="border-border/50 my-6" />')
    // Lists (basic support)
    .replace(/^- (.*$)/gm, '<li class="text-foreground leading-relaxed pl-1 mb-1">• $1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4 text-foreground leading-relaxed last:mb-0">')
    // Line breaks
    .replace(/\n/g, '<br />');
}

// Dedicated table processor for markdown tables
function processMarkdownTables(text: string): string {
  // Match complete markdown tables (header + separator + rows)
  const tableRegex = /(\|[^|\n]+\|[^\n]*\n\|[-:|]+\|[^\n]*(?:\n\|[^|\n]*\|[^\n]*)*)/gm;
  
  return text.replace(tableRegex, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;
    
    // Parse header row
    const headerRow = lines[0];
    const separatorRow = lines[1];
    const dataRows = lines.slice(2);
    
    // Extract header cells
    const headerCells = headerRow
      .split('|')
      .slice(1, -1) // Remove empty first/last elements
      .map(cell => cell.trim())
      .filter(cell => cell);
    
    // Extract data rows
    const processedDataRows = dataRows.map(row => {
      const cells = row
        .split('|')
        .slice(1, -1) // Remove empty first/last elements  
        .map(cell => cell.trim())
        .filter(cell => cell);
      
      return cells;
    });
    
    // Build HTML table
    let tableHtml = '<div class="overflow-x-auto my-6 rounded-lg border border-border/30 bg-card shadow-sm">';
    tableHtml += '<table class="w-full border-collapse">';
    
    // Add header
    if (headerCells.length > 0) {
      tableHtml += '<thead class="bg-primary/10 border-b border-border/30">';
      tableHtml += '<tr>';
      headerCells.forEach(cell => {
        tableHtml += `<th class="px-4 py-3 text-left font-semibold text-foreground text-sm uppercase tracking-wide bg-primary/5">${cell}</th>`;
      });
      tableHtml += '</tr>';
      tableHtml += '</thead>';
    }
    
    // Add body
    if (processedDataRows.length > 0) {
      tableHtml += '<tbody>';
      processedDataRows.forEach(row => {
        tableHtml += '<tr class="border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors">';
        row.forEach(cell => {
          tableHtml += `<td class="px-4 py-3 text-foreground border-r border-border/10 last:border-r-0">${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody>';
    }
    
    tableHtml += '</table>';
    tableHtml += '</div>';
    
    return tableHtml;
  });
}

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
          <div 
            className="text-therapy-sm sm:text-therapy-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processMarkdown(message.content) }}
          />
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