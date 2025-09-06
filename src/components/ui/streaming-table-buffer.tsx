/**
 * Streaming Table Buffer Component
 * Handles incomplete table content during AI streaming and renders complete tables
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { processReactMarkdown } from '@/lib/ui/react-markdown-processor';
import { Skeleton } from '@/components/ui/skeleton';

interface StreamingTableBufferProps {
  content: string;
  isStreaming: boolean;
  isUser?: boolean;
  className?: string;
}

interface TableBuffer {
  content: string;
  isComplete: boolean;
  startIndex: number;
  endIndex?: number;
}

/**
 * Component that buffers streaming markdown content and renders tables when complete
 * Handles partial table content gracefully during AI streaming
 */
export function StreamingTableBuffer({ 
  content, 
  isStreaming, 
  isUser = false, 
  className
}: StreamingTableBufferProps) {
  const [bufferedContent, setBufferedContent] = useState('');
  const previousContentRef = useRef('');

  /**
   * Check if a line looks like a table header
   */
  const isTableHeaderLine = useCallback((line: string): boolean => {
    // Basic markdown table header detection
    return line.includes('|') && !line.match(/^\s*\|?\s*[-:]+\s*\|/);
  }, []);

  /**
   * Check if a line is a table separator (e.g., |---|---|)
   */
  const isTableSeparatorLine = useCallback((line: string): boolean => {
    return line.match(/^\s*\|?\s*[-:]+(\s*\|\s*[-:]+)*\s*\|?\s*$/) !== null;
  }, []);

  /**
   * Check if a line is a table row
   */
  const isTableRowLine = useCallback((line: string): boolean => {
    return line.includes('|') && !isTableSeparatorLine(line);
  }, [isTableSeparatorLine]);

  /**
   * Check if a line is table-related (header, separator, or row)
   */
  const isTableRelatedLine = useCallback((line: string): boolean => {
    return isTableHeaderLine(line) || isTableSeparatorLine(line) || isTableRowLine(line) || line.trim() === '';
  }, [isTableHeaderLine, isTableSeparatorLine, isTableRowLine]);

  /**
   * Generate placeholder content for incomplete tables
   */
  const generateTablePlaceholder = useCallback((buffer: TableBuffer): string => {
    const lines = buffer.content.trim().split('\n');
    const headerLine = lines.find(line => isTableHeaderLine(line.trim()));
    
    if (headerLine) {
      const columnCount = (headerLine.match(/\|/g) || []).length + 1;
      return `<!-- STREAMING_TABLE_PLACEHOLDER:${columnCount} -->`;
    }
    
    return '<!-- STREAMING_TABLE_PLACEHOLDER:3 -->';
  }, [isTableHeaderLine]);

  /**
   * Process streaming content to identify and buffer incomplete tables
   */
  const processStreamingContent = useCallback((content: string): {
    processedContent: string;
  } => {
    const lines = content.split('\n');
    const buffers: TableBuffer[] = [];
    const processedLines: string[] = [];
    
    let currentTableBuffer: TableBuffer | null = null;
    let lineIndex = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect table start (markdown table syntax)
      if (isTableHeaderLine(trimmedLine)) {
        // Start new table buffer
        currentTableBuffer = {
          content: line + '\n',
          isComplete: false,
          startIndex: lineIndex
        };
      } else if (currentTableBuffer && isTableSeparatorLine(trimmedLine)) {
        // Continue table buffer
        currentTableBuffer.content += line + '\n';
      } else if (currentTableBuffer && isTableRowLine(trimmedLine)) {
        // Continue table buffer
        currentTableBuffer.content += line + '\n';
      } else if (currentTableBuffer && trimmedLine === '') {
        // Empty line might indicate table end, but wait for confirmation
        currentTableBuffer.content += line + '\n';
      } else if (currentTableBuffer && !isTableRelatedLine(trimmedLine)) {
        // Non-table content encountered, table is complete
        currentTableBuffer.isComplete = true;
        currentTableBuffer.endIndex = lineIndex;
        buffers.push(currentTableBuffer);
        
        // Add the complete table content to processed lines
        processedLines.push(currentTableBuffer.content);
        processedLines.push(line);
        
        currentTableBuffer = null;
      } else if (!currentTableBuffer) {
        // Regular content, add to processed lines
        processedLines.push(line);
      }
      
      lineIndex++;
    }
    
    // Handle incomplete table at end of stream
    if (currentTableBuffer) {
      if (!isStreaming) {
        // Stream ended, complete the table
        currentTableBuffer.isComplete = true;
        currentTableBuffer.endIndex = lineIndex;
        buffers.push(currentTableBuffer);
        processedLines.push(currentTableBuffer.content);
      } else {
        // Still streaming, keep buffering
        buffers.push(currentTableBuffer);
        // Add placeholder for incomplete table
        processedLines.push(generateTablePlaceholder(currentTableBuffer));
      }
    }

    return {
      processedContent: processedLines.join('\n')
    };
  }, [isStreaming, generateTablePlaceholder, isTableHeaderLine, isTableSeparatorLine, isTableRowLine, isTableRelatedLine]);

  /**
   * Update buffered content, handling incomplete tables during streaming
   */
  const updateBufferedContent = useCallback((newContent: string, streaming: boolean) => {
    if (!streaming) {
      // If not streaming, render all content immediately
      setBufferedContent(newContent);
      return;
    }

    // During streaming, detect and buffer incomplete tables
    const { processedContent } = processStreamingContent(newContent);
    setBufferedContent(processedContent);
  }, [processStreamingContent]);

  useEffect(() => {
    // Only update if content actually changed
    if (content !== previousContentRef.current) {
      updateBufferedContent(content, isStreaming);
      previousContentRef.current = content;
    }
  }, [content, isStreaming, updateBufferedContent]);

  /**
   * Render streaming table placeholder
   */
  const renderStreamingPlaceholder = (columnCount: number): React.ReactElement => {
    const placeholderId = `placeholder-${Date.now()}-${Math.random()}`;
    
    return (
      <div key={placeholderId} className="table-container mb-4">
        <div className="grid gap-4 md:grid-cols-1">
          {/* Table header skeleton */}
          <div className="space-y-2">
            <div className="flex gap-4">
              {Array.from({ length: Math.min(columnCount, 4) }, (_, i) => (
                <Skeleton key={`${placeholderId}-header-${i}`} className="h-4 flex-1" />
              ))}
            </div>
            <div className="h-px bg-border" />
          </div>
          
          {/* Table rows skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 2 }, (_, rowIndex) => (
              <div key={`${placeholderId}-row-${rowIndex}`} className="flex gap-4">
                {Array.from({ length: Math.min(columnCount, 4) }, (_, colIndex) => (
                  <Skeleton 
                    key={`${placeholderId}-cell-${rowIndex}-${colIndex}`} 
                    className={`h-4 ${colIndex === 0 ? 'flex-2' : 'flex-1'}`} 
                  />
                ))}
              </div>
            ))}
          </div>
          
          {isStreaming && (
            <div key={`${placeholderId}-indicator`} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
              Streaming table data...
            </div>
          )}
        </div>
      </div>
    );
  };

  // Process content with placeholders replaced
  const processContentWithPlaceholders = (content: string): React.ReactElement => {
    // Replace streaming placeholders with skeleton components
    const placeholderRegex = /<!-- STREAMING_TABLE_PLACEHOLDER:(\d+) -->/g;
    const parts = content.split(placeholderRegex);
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular content
        if (parts[i].trim()) {
          elements.push(processReactMarkdown(parts[i], isUser));
        }
      } else {
        // Placeholder (column count is in parts[i])
        const columnCount = parseInt(parts[i]) || 3;
        elements.push(renderStreamingPlaceholder(columnCount));
      }
    }
    
    return (
      <div className={className}>
        {elements.map((element, index) => (
          <React.Fragment key={`buffer-element-${index}`}>{element}</React.Fragment>
        ))}
      </div>
    );
  };

  // If we have placeholders, render with special handling
  if (isStreaming && bufferedContent.includes('STREAMING_TABLE_PLACEHOLDER')) {
    return processContentWithPlaceholders(bufferedContent);
  }

  // Regular rendering for complete content
  return (
    <div className={className}>
      {processReactMarkdown(bufferedContent, isUser)}
    </div>
  );
}