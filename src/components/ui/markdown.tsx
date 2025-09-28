'use client';

import React from 'react';
import { Streamdown } from 'streamdown';
import { CBTSessionSummaryCard, type CBTSessionSummaryData } from '@/components/ui/cbt-session-summary-card';
import { safeParseFromMatch } from '@/lib/utils/safe-json';

function extractCBTSummaryData(text: string): { summaryData: CBTSessionSummaryData | null; cleanText: string } {
  const cbtPattern = /<!-- CBT_SUMMARY_CARD:(.*?) -->[\s\S]*?<!-- END_CBT_SUMMARY_CARD -->/;
  const match = text.match(cbtPattern);
  if (match) {
    const parsed = safeParseFromMatch<CBTSessionSummaryData>(match[1]);
    if (parsed.ok) {
      const cleanText = text.replace(cbtPattern, '').trim();
      return { summaryData: parsed.data, cleanText };
    }
  }
  return { summaryData: null, cleanText: text };
}

export type MarkdownProps = {
  children: string;
  isUser?: boolean; // reserved for future role-based tweaks (unused for now)
  className?: string;
  defaultOrigin?: string;
  allowedLinkPrefixes?: string[]; // optional override
};

function extractLinkOrigins(markdown: string): string[] {
  if (!markdown) return [];
  const origins = new Set<string>();
  const urlPattern = /(https?:\/\/[^\s<>"')]+)/gi;

  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(markdown)) !== null) {
    const candidate = match[1];
    try {
      const url = new URL(candidate);
      origins.add(url.origin);
    } catch {
      // Ignore invalid URLs
    }
  }

  return Array.from(origins);
}

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

export function Markdown({ children, className, defaultOrigin, isUser, allowedLinkPrefixes }: MarkdownProps) {
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

  const allowHttp = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP === 'true';
  const allowMailto = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO === 'true';
  const normalizedOrigin = (() => {
    try {
      const parsed = new URL(resolvedOrigin);
      return parsed.origin;
    } catch {
      return resolvedOrigin;
    }
  })();

  const dynamicPrefixes = new Set<string>([normalizedOrigin]);
  if (allowHttp) {
    dynamicPrefixes.add(normalizedOrigin.replace(/^https:/, 'http:'));
  }
  extractLinkOrigins(finalText).forEach((origin) => {
    dynamicPrefixes.add(origin);
    if (allowHttp && origin.startsWith('https://')) {
      dynamicPrefixes.add(origin.replace('https://', 'http://'));
    }
  });

  const computedPrefixes = allowedLinkPrefixes ?? [
    ...dynamicPrefixes,
    ...(allowMailto ? ['mailto:'] : []),
  ];

  return (
    <Streamdown
      parseIncompleteMarkdown
      className={['markdown-content', className].filter(Boolean).join(' ')}
      allowedImagePrefixes={[]}
      allowedLinkPrefixes={computedPrefixes}
      defaultOrigin={resolvedOrigin}
    >
      {finalText}
    </Streamdown>
  );
}


