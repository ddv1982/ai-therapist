'use client';

import { isValidElement, ReactElement, ReactNode, Children } from 'react';
import { Streamdown } from 'streamdown';
import {
  CBTSessionSummaryCard,
  type CBTSessionSummaryData,
} from '@/features/therapy/components/cbt-session-summary-card';
import { safeParseFromMatch } from '@/lib/utils/helpers';

function extractCBTSummaryData(text: string): {
  summaryData: CBTSessionSummaryData | null;
  cleanText: string;
} {
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

    return segment.replace(
      tableRegex,
      (fullMatch: string, leadingNewline: string, headerRow: string, bodyRows: string) => {
        const headers = headerRow
          .split('|')
          .map((h: string) => h.trim())
          .filter(Boolean);
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
      }
    );
  });

  return processed.join('');
}

type TableSectionProps = { children?: ReactNode };
type TableCellProps = { children?: ReactNode };

const extractTextContent = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join(' ').trim();
  }
  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    return extractTextContent(element.props.children);
  }
  return '';
};

const ResponsiveMarkdownTable = ({ children }: { children?: ReactNode }) => {
  const childArray = Children.toArray(children);
  if (childArray.length === 0) return null;

  const headerNode = childArray.find((child) => isValidElement(child) && child.type === 'thead') as
    | ReactElement<TableSectionProps>
    | undefined;
  const bodyNodes = childArray.filter(
    (child) => isValidElement(child) && child.type === 'tbody'
  ) as Array<ReactElement<TableSectionProps>>;

  const headers: string[] = [];
  if (headerNode) {
    const headerElement = headerNode as ReactElement<TableSectionProps>;
    Children.forEach(headerElement.props.children, (row) => {
      if (!isValidElement(row)) return;
      const headerRow = row as ReactElement<TableSectionProps>;
      Children.forEach(headerRow.props.children, (cell) => {
        if (!isValidElement(cell)) return;
        const headerCell = cell as ReactElement<TableCellProps>;
        headers.push(extractTextContent(headerCell.props.children));
      });
    });
  }

  const mobileCards = bodyNodes.flatMap((tbody, tbodyIndex) => {
    const rows: ReactNode[] = [];
    Children.forEach(tbody.props.children, (row, rowIndex) => {
      if (!isValidElement(row)) return;
      const bodyRow = row as ReactElement<TableSectionProps>;
      const cells: Array<{ label: string; content: ReactNode; key: string }> = [];
      Children.forEach(bodyRow.props.children, (cell, cellIndex) => {
        if (!isValidElement(cell)) return;
        const bodyCell = cell as ReactElement<TableCellProps>;
        const label = headers[cellIndex] ?? `Column ${cellIndex + 1}`;
        cells.push({
          label,
          content: bodyCell.props.children,
          key: `${tbodyIndex}-${rowIndex}-${cellIndex}`,
        });
      });
      rows.push(
        <div className="markdown-table-card" key={`${tbodyIndex}-${rowIndex}`}>
          {cells.map((cell) => (
            <div className="markdown-table-card-row" key={cell.key}>
              <span className="markdown-table-card-label">{cell.label}</span>
              <div className="markdown-table-card-value">{cell.content}</div>
            </div>
          ))}
        </div>
      );
    });
    return rows;
  });

  return (
    <div className="markdown-table" data-responsive="true">
      <div className="markdown-table-desktop" tabIndex={0} role="group">
        <table>{children}</table>
      </div>
      <div className="markdown-table-mobile" aria-hidden="true">
        {mobileCards}
      </div>
    </div>
  );
};

const streamdownComponents = {
  table: ResponsiveMarkdownTable,
};

export function Markdown({ children, className, isUser }: MarkdownProps) {
  const rawContent = children ?? '';
  const hasContent = rawContent.length > 0;

  const { summaryData, cleanText } = extractCBTSummaryData(rawContent);
  const finalText = isUser ? cleanText : convertWideTablesToLists(cleanText);

  if (!hasContent) return null;
  if (summaryData) return <CBTSessionSummaryCard data={summaryData} />;

  return (
    <Streamdown
      parseIncompleteMarkdown
      className={['markdown-content', className].filter(Boolean).join(' ')}
      components={streamdownComponents}
    >
      {finalText}
    </Streamdown>
  );
}
