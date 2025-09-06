import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
// @ts-expect-error - No TypeScript definitions available for markdown-it-attrs
import markdownItAttrs from 'markdown-it-attrs';
import { logger } from '@/lib/utils/logger';

// Configure markdown-it with therapeutic-friendly settings and enhanced table support
const md = new MarkdownIt({
  html: false,        // Disable raw HTML for security
  breaks: true,       // Convert line breaks to <br>
  linkify: true,      // Auto-convert URLs to links
  typographer: false  // Disable smart quotes/dashes for cleaner output
});

// Add attributes plugin for CSS class support on tables and other elements
md.use(markdownItAttrs, {
  // Allow attributes on all elements (tables, paragraphs, etc.)
  allowedAttributes: ['class', 'id']
});

/**
 * Enhanced table processing with intelligent layout selection
 * - 1-3 columns: Auto-responsive (cards on mobile, table on desktop)
 * - 4-5 columns: Hybrid layout with card fallback
 * - 6+ columns: Always transform to cards or definition lists
 */
function enhanceTablesForTherapeuticUse(html: string): string {
  // Process each table individually to apply column-based logic
  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableMatch) => {
    const columnCount = countTableColumns(tableMatch);
    
    if (columnCount <= 3) {
      // Simple tables: Auto-responsive with card support
      return processResponsiveTable(tableMatch, columnCount);
    } else if (columnCount <= 5) {
      // Medium tables: Hybrid layout
      return processHybridTable(tableMatch, columnCount);
    } else {
      // Complex tables: Transform to cards or structured view
      return transformToCardLayout(tableMatch, columnCount);
    }
  });
}

/**
 * Count the number of columns in a table by analyzing the header row
 */
function countTableColumns(tableHtml: string): number {
  // Look for header row in thead or first tr
  const headerMatch = tableHtml.match(/<thead[^>]*>[\s\S]*?<\/thead>/i) ||
                     tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/i);
  
  if (!headerMatch) return 0;
  
  // Count th or td elements in the header
  const headerRow = headerMatch[0];
  const thMatches = headerRow.match(/<th[^>]*>[\s\S]*?<\/th>/gi);
  const tdMatches = headerRow.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
  
  return (thMatches?.length || 0) + (tdMatches?.length || 0);
}

/**
 * Determine if a field should be considered primary/important
 */
// Legacy types removed - these were unused in the new card system

/**
 * Touch optimization is now handled entirely via CSS classes
 * This prevents React hydration mismatches with inline styles
 */

// Legacy functions removed - these were deprecated and unused in the new card system

// More legacy functions removed - these were deprecated and unused

/**
 * Server-side table processing - no client-side detection needed
 * Uses CSS container queries for responsive behavior
 */

/**
 * Modern markdown processor using markdown-it + sanitize-html
 * Server-side table processing with CSS container queries for responsive behavior
 */
export function processMarkdown(text: string): string {
  if (!text) return '';

  // Pre-process text to handle common HTML entities and tags
  const processedText = text
    // Convert literal <br> tags to actual line breaks for markdown processing
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert other common HTML entities that might appear as text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  // Convert markdown to HTML using markdown-it
  let html: string;
  try {
    html = md.render(processedText);
  } catch (error) {
    logger.warn('Markdown parsing failed', {
      operation: 'markdownToHtml',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    html = `<p>${processedText}</p>`;
  }

  // Always enhance tables with modern responsive system
  // CSS container queries handle mobile/desktop differences
  html = enhanceTablesForTherapeuticUse(html);

  // Sanitize HTML for security
  const allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's',
    'ul', 'ol', 'li',
    'hr', 'blockquote', 'code', 'pre',
    'div', 'a', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Alternative view tags
    'dl', 'dt', 'dd', 'button'
  ];
  
  const allowedClasses: Record<string, string[]> = {
    'div': [
      'table-container', 'table-system',
      // Alternative view classes
      'alternative-view-container', 'alternative-view-header',
      'structured-cards-container', 'structured-cards-grid', 'structured-card',
      'card-primary-fields', 'card-secondary-fields', 'card-field',
      'field-label', 'field-value', 'primary-field', 'secondary-field',
      'definition-list-container', 'expandable-rows-container',
      'expandable-row', 'row-summary', 'row-details', 'summary-field', 'detail-field'
    ],
    'table': [
      'therapeutic-table', 'table-striped', 'table-compact', 
      'table-cbt-report', 'table-progress', 'table-comparison',
      'table-dashboard', 'custom-table', 'table-optimized-wide'
    ],
    'tr': ['progress-positive', 'progress-negative'],
    'td': ['progress-positive', 'progress-negative'],
    'th': ['sortable'],
    'dl': ['therapeutic-definition-list'],
    'dt': ['definition-term'],
    'dd': ['definition-description'],
    'hr': ['row-separator'],
    'button': ['expand-button'],
    'span': ['summary-field']
  };

  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'table': ['class', 'id', 'data-columns', 'data-row'],
      'thead': ['class', 'id'], 
      'tbody': ['class', 'id'],
      'tr': ['class', 'id'],
      'th': ['class', 'id', 'data-type'],
      'td': ['class', 'id', 'data-label', 'data-type', 'title'],
      'div': ['class', 'id', 'data-row'],
      'hr': ['class', 'style'],
      'ul': ['class', 'id'],
      'ol': ['class', 'id'],
      'li': ['class', 'id'],
      'dl': ['class', 'id', 'data-row'],
      'dt': ['class', 'id'],
      'dd': ['class', 'id'],
      'button': ['class', 'id', 'aria-expanded', 'aria-label', 'type'],
      'span': ['class', 'id']
    },
    allowedClasses,
    transformTags: {
      'a': function(tagName, attribs) {
        attribs.target = '_blank';
        attribs.rel = 'noopener noreferrer';
        return { tagName, attribs };
      }
    }
  });
  
  return sanitizedHtml;
}

// New functions for card layout support

/**
 * Process responsive tables (1-3 columns) with auto card/table switching
 */
function processResponsiveTable(tableHtml: string, columnCount: number): string {
  // Add responsive attributes that allow TherapeuticTable to switch modes
  let processedHtml = tableHtml;
  
  // Add auto-responsive class
  processedHtml = processedHtml.replace(
    /<table([^>]*class="([^"]*)")([^>]*)>/gi,
    (_match, _classAttr, existingClasses, rest) => {
      const classes = `${existingClasses} therapeutic-table-auto responsive-cards-enabled`.trim();
      return `<table class="${classes}" data-columns="${columnCount}" data-display-mode="auto"${rest}>`;
    }
  );
  
  // Handle tables without classes
  processedHtml = processedHtml.replace(
    /<table(?![^>]*class=)([^>]*)>/gi, 
    `<table class="therapeutic-table-auto responsive-cards-enabled" data-columns="${columnCount}" data-display-mode="auto"$1>`
  );
  
  // Wrap in container with card data attributes
  const tableData = extractTableDataForCards(tableHtml);
  const cardDataAttrs = generateCardDataAttributes(tableData, columnCount);
  
  return `<div class="therapeutic-table-container auto-responsive" ${cardDataAttrs}>${processedHtml}</div>`;
}

/**
 * Process hybrid tables (4-5 columns) with smart layout selection
 */
function processHybridTable(tableHtml: string, columnCount: number): string {
  let processedHtml = tableHtml;
  
  // Add hybrid layout class
  processedHtml = processedHtml.replace(
    /<table([^>]*class="([^"]*)")([^>]*)>/gi,
    (_match, _classAttr, existingClasses, rest) => {
      const classes = `${existingClasses} therapeutic-table-hybrid card-fallback-enabled`.trim();
      return `<table class="${classes}" data-columns="${columnCount}" data-display-mode="hybrid"${rest}>`;
    }
  );
  
  processedHtml = processedHtml.replace(
    /<table(?![^>]*class=)([^>]*)>/gi, 
    `<table class="therapeutic-table-hybrid card-fallback-enabled" data-columns="${columnCount}" data-display-mode="hybrid"$1>`
  );
  
  const tableData = extractTableDataForCards(tableHtml);
  const cardDataAttrs = generateCardDataAttributes(tableData, columnCount);
  
  return `<div class="therapeutic-table-container hybrid-layout" ${cardDataAttrs}>${processedHtml}</div>`;
}

/**
 * Transform complex tables (6+ columns) to card layout
 */
function transformToCardLayout(tableHtml: string, columnCount: number): string {
  const tableData = extractTableDataForCards(tableHtml);
  
  // Generate pure card markup for complex tables
  return generateCardOnlyMarkup(tableData, columnCount);
}

/**
 * Extract structured data from table HTML for card layout
 */
function extractTableDataForCards(tableHtml: string): { headers: string[], rows: string[][] } {
  const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!tempDiv) {
    // Fallback for server-side rendering
    return parseTableDataFromHtml(tableHtml);
  }
  
  tempDiv.innerHTML = tableHtml;
  const table = tempDiv.querySelector('table');
  if (!table) return { headers: [], rows: [] };
  
  // Extract headers
  const headerCells = Array.from(table.querySelectorAll('thead th, tr:first-child th, tr:first-child td'));
  const headers = headerCells.map(cell => cell.textContent?.trim() || '');
  
  // Extract data rows
  const dataRows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'));
  const rows = dataRows.map(row => {
    const cells = Array.from(row.querySelectorAll('td, th'));
    return cells.map(cell => cell.textContent?.trim() || '');
  });
  
  return { headers, rows };
}

/**
 * Server-side fallback for table data parsing
 */
function parseTableDataFromHtml(tableHtml: string): { headers: string[], rows: string[][] } {
  // Extract headers using regex
  const headerMatch = tableHtml.match(/<thead[^>]*>[\s\S]*?<\/thead>/i) || 
                     tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/i);
  
  let headers: string[] = [];
  if (headerMatch) {
    const headerCells = headerMatch[0].match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
    headers = headerCells.map(cell => 
      cell.replace(/<[^>]*>/g, '').trim()
    );
  }
  
  // Extract data rows
  const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const dataRows = rowMatches.slice(1); // Skip header row
  
  const rows = dataRows.map(row => {
    const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
    return cells.map(cell => 
      cell.replace(/<[^>]*>/g, '').trim()
    );
  });
  
  return { headers, rows };
}

/**
 * Generate data attributes for card configuration
 */
function generateCardDataAttributes(tableData: { headers: string[], rows: string[][] }, columnCount: number): string {
  const attributes = [
    `data-card-columns='${JSON.stringify(tableData.headers)}'`,
    `data-card-rows='${JSON.stringify(tableData.rows)}'`,
    `data-column-count="${columnCount}"`,
    `data-card-variant="${determineCardVariant(tableData)}"`,
    `data-card-layout="${determineCardLayout(columnCount)}"`
  ];
  
  return attributes.join(' ');
}

/**
 * Determine appropriate card variant based on table content
 */
function determineCardVariant(tableData: { headers: string[], rows: string[][] }): string {
  const { headers } = tableData;
  
  // Check for therapeutic data patterns
  const therapeuticPatterns = /^(patient|session|mood|anxiety|depression|therapy|treatment|progress)$/i;
  if (headers.some(header => therapeuticPatterns.test(header))) {
    return 'therapeutic';
  }
  
  // Check for compact data patterns (many short fields)
  const avgHeaderLength = headers.reduce((sum, h) => sum + h.length, 0) / headers.length;
  if (avgHeaderLength < 10 && headers.length >= 4) {
    return 'compact';
  }
  
  // Check for detailed data patterns
  if (headers.length <= 3 && tableData.rows.some(row => row.some(cell => cell.length > 50))) {
    return 'detailed';
  }
  
  return 'default';
}

/**
 * Determine appropriate card layout based on column count
 */
function determineCardLayout(columnCount: number): string {
  if (columnCount <= 2) return 'list';
  if (columnCount >= 6) return 'masonry';
  return 'grid';
}

/**
 * Generate pure card markup for complex tables
 */
function generateCardOnlyMarkup(tableData: { headers: string[], rows: string[][] }, columnCount: number): string {
  const variant = determineCardVariant(tableData);
  const layout = determineCardLayout(columnCount);
  
  let cardHtml = `<div class="therapeutic-card-grid-generated" data-variant="${variant}" data-layout="${layout}">`;
  
  // Add caption if applicable
  cardHtml += `<div class="card-grid-header">
    <h3 class="text-lg font-semibold">Complex Data (${columnCount} columns)</h3>
    <span class="text-sm text-muted-foreground">${tableData.rows.length} items</span>
  </div>`;
  
  // Generate cards container
  cardHtml += `<div class="card-grid-container ${layout}-layout">`;
  
  tableData.rows.forEach((row, index) => {
    cardHtml += generateSingleCard(tableData.headers, row, index, variant);
  });
  
  cardHtml += '</div></div>';
  
  return cardHtml;
}

/**
 * Generate markup for a single card
 */
function generateSingleCard(headers: string[], row: string[], index: number, variant: string): string {
  const primaryField = row[0] || `Item ${index + 1}`;
  const secondaryFields = headers.slice(1).map((header, i) => ({ 
    label: header, 
    value: row[i + 1] || '' 
  })).filter(field => field.value);
  
  let cardHtml = `<div class="therapeutic-card generated-card ${variant}-variant" data-index="${index}">`;
  
  // Card header
  cardHtml += `<div class="card-header">
    <h4 class="card-title">${primaryField}</h4>
  </div>`;
  
  // Card content
  cardHtml += `<div class="card-content">`;
  
  // Show first 3 fields prominently
  secondaryFields.slice(0, 3).forEach(field => {
    cardHtml += `<div class="card-field primary">
      <span class="field-label">${field.label}:</span>
      <span class="field-value">${field.value}</span>
    </div>`;
  });
  
  // Collapsible additional fields for complex data
  if (secondaryFields.length > 3) {
    cardHtml += `<details class="card-details">
      <summary class="details-toggle">Show ${secondaryFields.length - 3} more fields</summary>
      <div class="additional-fields">`;
    
    secondaryFields.slice(3).forEach(field => {
      cardHtml += `<div class="card-field secondary">
        <span class="field-label">${field.label}:</span>
        <span class="field-value">${field.value}</span>
      </div>`;
    });
    
    cardHtml += `</div></details>`;
  }
  
  cardHtml += `</div></div>`;
  
  return cardHtml;
}
