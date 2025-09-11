/**
 * React Markdown Processor
 * Processes markdown and returns React JSX elements instead of HTML strings
 */

import React from 'react';
import { Markdown } from '@/components/ui/markdown';

// CBT summary extraction moved to unified Markdown component

/**
 * Process markdown text and return React JSX elements
 */
export function processReactMarkdown(text: string, isUser: boolean = false): React.ReactElement {
  if (!text) return <></>;
  return <Markdown isUser={isUser}>{text}</Markdown>;
}
// Token-to-React rendering path removed. We rely solely on HTML processing
// from processMarkdown for simplicity and consistency.
