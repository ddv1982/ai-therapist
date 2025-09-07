/**
 * React Markdown Processor
 * Processes markdown and returns React JSX elements instead of HTML strings
 */

import React from 'react';
import { logger } from '@/lib/utils/logger';
import { CBTSessionSummaryCard, type CBTSessionSummaryData } from '@/components/ui/cbt-session-summary-card';
import { processMarkdown } from './markdown-processor';

/**
 * Extract CBT summary data from markdown comments
 */
function extractCBTSummaryData(text: string): { summaryData: CBTSessionSummaryData | null; cleanText: string } {
  const cbtPattern = /<!-- CBT_SUMMARY_CARD:(.*?) -->[\s\S]*?<!-- END_CBT_SUMMARY_CARD -->/;
  const match = text.match(cbtPattern);
  
  if (match) {
    try {
      const summaryData = JSON.parse(match[1]) as CBTSessionSummaryData;
      const cleanText = text.replace(cbtPattern, '').trim();
      return { summaryData, cleanText };
    } catch (error) {
      logger.warn('Failed to parse CBT summary data', {
        operation: 'parseCBTSummaryTable',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return { summaryData: null, cleanText: text };
}

/**
 * Process markdown text and return React JSX elements
 */
export function processReactMarkdown(text: string, isUser: boolean = false): React.ReactElement {
  if (!text) return <></>;

  // Check for CBT summary cards first
  const { summaryData, cleanText } = extractCBTSummaryData(text);
  
  if (summaryData) {
    return <CBTSessionSummaryCard data={summaryData} />;
  }

  // Use the improved HTML-based processor
  try {
    // Use static import to avoid async client component issues
    const html = processMarkdown(cleanText);
    return (
      <div
        className={`markdown-content ${isUser ? 'user-content' : 'assistant-content'}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (error) {
    logger.warn('Markdown processing failed in React wrapper', {
      operation: 'processReactMarkdown',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return <p>{cleanText}</p>;
  }
}
// Token-to-React rendering path removed. We rely solely on HTML processing
// from processMarkdown for simplicity and consistency.
