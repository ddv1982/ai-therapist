'use client';

import React from 'react';
import { Streamdown } from 'streamdown';
import { CBTSessionSummaryCard, type CBTSessionSummaryData } from '@/components/ui/cbt-session-summary-card';

function extractCBTSummaryData(text: string): { summaryData: CBTSessionSummaryData | null; cleanText: string } {
  const cbtPattern = /<!-- CBT_SUMMARY_CARD:(.*?) -->[\s\S]*?<!-- END_CBT_SUMMARY_CARD -->/;
  const match = text.match(cbtPattern);
  if (match) {
    try {
      const summaryData = JSON.parse(match[1]!) as CBTSessionSummaryData;
      const cleanText = text.replace(cbtPattern, '').trim();
      return { summaryData, cleanText };
    } catch {
      // Fall through to standard markdown rendering if JSON parse fails
    }
  }
  return { summaryData: null, cleanText: text };
}

export type MarkdownProps = {
  children: string;
  isUser?: boolean; // reserved for future role-based tweaks (unused for now)
  className?: string;
  defaultOrigin?: string;
};

/**
 * Convert markdown tables with more than 3 columns into definition-like lists.
 * Skips fenced code blocks to avoid transforming code examples.
 */
function convertWideTablesToLists(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown;

  // Split by fenced code blocks to avoid touching them
  const segments = markdown.split(/(```[\s\S]*?```)/g);

  const processed = segments.map((segment: string, index: number) => {
    // Odd indices are code blocks (because the delimiter is kept), keep intact
    if (index % 2 === 1) return segment;

    // Regex to match a simple markdown table (header | separator | body)
    const tableRegex = /(^|\n)\|([^\n]+)\|\s*\n\|\s*[-:|\s]+\|\s*\n((?:\|[^\n]+\|\s*\n?)+)/g;

    return segment.replace(tableRegex, (fullMatch: string, leadingNewline: string, headerRow: string, bodyRows: string) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
      if (headers.length <= 3) return fullMatch; // keep small tables

      // Parse rows
      const rows: string[][] = bodyRows
        .trim()
        .split(/\n/)
        .map((r: string) => r.replace(/^\|/, '').replace(/\|\s*$/, ''))
        .map((r: string) => r.split('|').map((c: string) => c.trim()));

      // Build list/card-like sections
      const converted = rows
        .map((cells: string[]) => {
          const items = headers.map((h: string, i: number) => `- **${h}**: ${cells[i] ?? ''}`);
          return items.join('\n');
        })
        .join('\n\n---\n\n');

      // Preserve the leading newline if present
      return `${leadingNewline ?? ''}${converted}\n`;
    });
  });

  return processed.join('');
}

export function Markdown({ children, className, defaultOrigin, isUser }: MarkdownProps) {
  if (!children) return null;

  const { summaryData, cleanText } = extractCBTSummaryData(children);
  if (summaryData) return <CBTSessionSummaryCard data={summaryData} />;

  const resolvedOrigin = defaultOrigin ?? (
    typeof window !== 'undefined' && typeof window.location?.origin === 'string'
      ? window.location.origin
      : 'http://localhost'
  );

  // Convert wide tables to lists for assistant messages only
  const finalText = isUser ? cleanText : convertWideTablesToLists(cleanText);

  return (
    <Streamdown
      parseIncompleteMarkdown
      className={['markdown-content', className].filter(Boolean).join(' ')}
      allowedImagePrefixes={[]}
      allowedLinkPrefixes={['*']}
      defaultOrigin={resolvedOrigin}
    >
      {finalText}
    </Streamdown>
  );
}


