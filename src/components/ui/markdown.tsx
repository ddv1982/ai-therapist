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

export function Markdown({ children, className, defaultOrigin }: MarkdownProps) {
  if (!children) return null;

  const { summaryData, cleanText } = extractCBTSummaryData(children);
  if (summaryData) return <CBTSessionSummaryCard data={summaryData} />;

  const resolvedOrigin = defaultOrigin ?? (
    typeof window !== 'undefined' && typeof window.location?.origin === 'string'
      ? window.location.origin
      : 'http://localhost'
  );

  return (
    <Streamdown
      parseIncompleteMarkdown
      className={className}
      allowedImagePrefixes={[]}
      allowedLinkPrefixes={['/', 'https://', 'mailto:', 'tel:']}
      defaultOrigin={resolvedOrigin}
    >
      {cleanText}
    </Streamdown>
  );
}


