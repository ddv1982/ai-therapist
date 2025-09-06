/**
 * React Markdown Processor
 * Processes markdown and returns React JSX elements instead of HTML strings
 * Integrates table-to-card conversion for therapeutic data display
 */

import React from 'react';
import MarkdownIt from 'markdown-it';
// @ts-expect-error - No TypeScript definitions available for markdown-it-attrs
import markdownItAttrs from 'markdown-it-attrs';
import { logger } from '@/lib/utils/logger';
import { TherapeuticTable } from '@/components/ui/therapeutic-table';
import { CBTSessionSummaryCard, type CBTSessionSummaryData } from '@/components/ui/cbt-session-summary-card';

// Local type definition for markdown-it Token to avoid complex type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Token = any;
import { 
  extractTableDataFromTokens, 
  convertToColumnConfig, 
  convertToRowData,
  type TableData,
  type TableDisplayConfig
} from './table-data-extractor';
import { processMarkdown } from './markdown-processor';

// Configure markdown-it with therapeutic-friendly settings
const md = new MarkdownIt({
  html: false,        // Disable raw HTML for security
  breaks: true,       // Convert line breaks to <br>
  linkify: true,      // Auto-convert URLs to links
  typographer: false  // Disable smart quotes/dashes for cleaner output
});

// Add attributes plugin for CSS class support
md.use(markdownItAttrs, {
  allowedAttributes: ['class', 'id']
});

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

/**
 * Convert markdown-it tokens to React elements
 * (Currently unused, but kept for future therapeutic table rendering)
 */
export function tokensToReactElements(tokens: Token[]): React.ReactElement[] {
  const elements: React.ReactElement[] = [];
  let index = 0;
  let elementCounter = 0; // Use a separate counter for unique keys

  while (index < tokens.length) {
    const token = tokens[index];

    switch (token.type) {
      case 'table_open': {
        // Handle table specially - convert to TherapeuticTable component
        try {
          const { data, config, endIndex } = extractTableDataFromTokens(tokens, index);
          
          // Skip empty tables completely - don't render anything
          const hasContent = data.rows.length > 0 && data.rows.some(row => 
            row.some(cell => cell && cell.trim().length > 0)
          );
          
          if (hasContent) {
            const tableElement = renderTableAsReactComponent(data, config, `table-${elementCounter}`);
            elements.push(tableElement);
            elementCounter++;
          }
          index = endIndex;
        } catch (error) {
          logger.warn('Table processing failed', {
            operation: 'processTablesInHTML',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Skip failed table processing entirely
          index = findClosingToken(tokens, index, 'table_open', 'table_close');
        }
        break;
      }

      case 'heading_open': {
        const headingElement = renderHeading(token, tokens, index, `heading-${elementCounter}`);
        elements.push(headingElement);
        elementCounter++;
        index = findClosingToken(tokens, index, 'heading_open', 'heading_close');
        break;
      }

      case 'paragraph_open': {
        const paragraphElement = renderParagraph(token, tokens, index, `paragraph-${elementCounter}`);
        elements.push(paragraphElement);
        elementCounter++;
        index = findClosingToken(tokens, index, 'paragraph_open', 'paragraph_close');
        break;
      }

      case 'bullet_list_open':
      case 'ordered_list_open': {
        const listElement = renderList(token, tokens, index, `list-${elementCounter}`);
        elements.push(listElement);
        elementCounter++;
        index = findClosingToken(tokens, index, token.type, token.type.replace('_open', '_close'));
        break;
      }

      case 'blockquote_open': {
        const blockquoteElement = renderBlockquote(token, tokens, index, `blockquote-${elementCounter}`);
        elements.push(blockquoteElement);
        elementCounter++;
        index = findClosingToken(tokens, index, 'blockquote_open', 'blockquote_close');
        break;
      }

      case 'code_block':
      case 'fence': {
        const codeElement = renderCodeBlock(token, `code-${elementCounter}`);
        elements.push(codeElement);
        elementCounter++;
        index++;
        break;
      }

      case 'hr': {
        elements.push(<hr key={`hr-${elementCounter}`} className="my-4 border-border" />);
        elementCounter++;
        index++;
        break;
      }

      default:
        // Skip open/close tokens that don't need special handling
        index++;
        break;
    }
  }

  return elements;
}

/**
 * Render table data as TherapeuticTable React component
 */
function renderTableAsReactComponent(
  data: TableData, 
  config: TableDisplayConfig, 
  key: string
): React.ReactElement {
  const columns = convertToColumnConfig(data);
  const rowData = convertToRowData(data);

  // Map variant to valid TherapeuticTable variants
  const tableVariant = config.variant === 'detailed' ? 'default' : config.variant;
  
  return (
    <div key={key} className="table-container mb-4">
      <TherapeuticTable
        data={rowData}
        columns={columns}
        variant={tableVariant as 'default' | 'therapeutic' | 'compact'}
        displayMode={config.displayMode}
        layout={config.layout}
        className="therapeutic-table-generated"
      />
    </div>
  );
}

/**
 * Render heading elements
 */
function renderHeading(token: Token, tokens: Token[], startIndex: number, key: string): React.ReactElement {
  const level = parseInt(token.tag.substring(1)) as 1 | 2 | 3 | 4 | 5 | 6;
  const content = extractInlineContent(tokens, startIndex + 1);
  
  const headingClasses = {
    1: 'text-3xl font-semibold mb-4',
    2: 'text-2xl font-semibold mb-3',
    3: 'text-xl font-semibold mb-3', 
    4: 'text-lg font-semibold mb-2',
    5: 'text-base font-semibold mb-2',
    6: 'text-sm font-semibold mb-2'
  };

  const HeadingTag = token.tag as keyof React.JSX.IntrinsicElements;
  
  return (
    <HeadingTag 
      key={key} 
      className={headingClasses[level]}
    >
      {content}
    </HeadingTag>
  );
}

/**
 * Render paragraph elements
 */
function renderParagraph(_token: Token, tokens: Token[], startIndex: number, key: string): React.ReactElement {
  const content = extractInlineContent(tokens, startIndex + 1);
  
  return (
    <p key={key} className="mb-3 text-base leading-relaxed">
      {content}
    </p>
  );
}

/**
 * Render list elements
 */
function renderList(token: Token, tokens: Token[], startIndex: number, key: string): React.ReactElement {
  const isOrdered = token.type === 'ordered_list_open';
  const ListTag = isOrdered ? 'ol' : 'ul';
  const listItems: React.ReactElement[] = [];
  
  let index = startIndex + 1;
  let itemKey = 0;
  
  while (index < tokens.length && tokens[index].type !== token.type.replace('_open', '_close')) {
    if (tokens[index].type === 'list_item_open') {
      const itemContent = extractInlineContent(tokens, index + 1);
      listItems.push(
        <li key={`${key}-item-${itemKey}`} className="mb-1">
          {itemContent}
        </li>
      );
      itemKey++;
    }
    index++;
  }

  return (
    <ListTag key={key} className={`mb-3 pl-6 ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
      {listItems}
    </ListTag>
  );
}

/**
 * Render blockquote elements
 */
function renderBlockquote(_token: Token, tokens: Token[], startIndex: number, key: string): React.ReactElement {
  const content = extractInlineContent(tokens, startIndex + 1);
  
  return (
    <blockquote key={key} className="border-l-4 border-primary/30 pl-4 py-2 my-4 bg-muted/30 text-muted-foreground italic">
      {content}
    </blockquote>
  );
}

/**
 * Render code block elements
 */
function renderCodeBlock(token: Token, key: string): React.ReactElement {
  return (
    <pre key={key} className="bg-muted p-4 rounded-md overflow-x-auto mb-3 text-sm font-mono">
      <code>{token.content}</code>
    </pre>
  );
}

/**
 * Extract inline content from tokens (handles text, links, emphasis, etc.)
 */
function extractInlineContent(tokens: Token[], startIndex: number): React.ReactNode {
  let index = startIndex;
  
  while (index < tokens.length && tokens[index].type !== 'paragraph_close' && 
         tokens[index].type !== 'heading_close' && tokens[index].type !== 'list_item_close') {
    if (tokens[index].type === 'inline') {
      return processInlineToken(tokens[index]);
    }
    index++;
  }
  
  return '';
}

/**
 * Process inline tokens (text with formatting, links, etc.)
 */
function processInlineToken(token: Token): React.ReactNode {
  if (!token.children) {
    return token.content || '';
  }
  
  const elements: React.ReactNode[] = [];
  const children = token.children;
  let index = 0;
  
  while (index < children.length) {
    const child = children[index];
    const inlineKey = `inline-${token.type || 'unknown'}-${index}`;
    
    switch (child.type) {
      case 'text':
        elements.push(child.content);
        break;
        
      case 'strong_open': {
        // Find content between strong_open and strong_close
        const content: React.ReactNode[] = [];
        index++; // Move past strong_open
        
        while (index < children.length && children[index].type !== 'strong_close') {
          if (children[index].type === 'text') {
            content.push(children[index].content);
          }
          index++;
        }
        
        elements.push(<strong key={inlineKey}>{content}</strong>);
        break;
      }
        
      case 'em_open': {
        // Find content between em_open and em_close
        const content: React.ReactNode[] = [];
        index++; // Move past em_open
        
        while (index < children.length && children[index].type !== 'em_close') {
          if (children[index].type === 'text') {
            content.push(children[index].content);
          }
          index++;
        }
        
        elements.push(<em key={inlineKey}>{content}</em>);
        break;
      }
        
      case 'code_inline':
        elements.push(
          <code key={inlineKey} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
            {child.content}
          </code>
        );
        break;
        
      case 'link_open': {
        const href = child.attrGet?.('href') || '#';
        // Find content between link_open and link_close
        const content: React.ReactNode[] = [];
        index++; // Move past link_open
        
        while (index < children.length && children[index].type !== 'link_close') {
          if (children[index].type === 'text') {
            content.push(children[index].content);
          }
          index++;
        }
        
        elements.push(
          <a 
            key={inlineKey} 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
          >
            {content}
          </a>
        );
        break;
      }
      
      case 'strong_close':
      case 'em_close':
      case 'link_close':
        // These are handled by their corresponding open cases
        break;
        
      default:
        // Handle any other token types as plain text
        if (child.content) {
          elements.push(child.content);
        }
        break;
    }
    
    index++;
  }
  
  return elements;
}

/**
 * Find the closing token index for a given opening token
 */
function findClosingToken(
  tokens: Token[], 
  startIndex: number, 
  openType: string, 
  closeType: string
): number {
  let depth = 0;
  let index = startIndex;
  
  while (index < tokens.length) {
    if (tokens[index].type === openType) {
      depth++;
    } else if (tokens[index].type === closeType) {
      depth--;
      if (depth === 0) {
        return index + 1;
      }
    }
    index++;
  }
  
  return index;
}
