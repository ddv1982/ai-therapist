import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
// @ts-expect-error - No TypeScript definitions available for markdown-it-attrs
import markdownItAttrs from 'markdown-it-attrs';

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
 * Enhanced table processing with 5-column rule and alternative views
 * 1-5 columns: Responsive table with container queries
 * 6+ columns: Transform to structured cards or definition lists
 */
function enhanceTablesForTherapeuticUse(html: string): string {
  // Process each table individually to apply column-based logic
  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableMatch) => {
    const columnCount = countTableColumns(tableMatch);
    
    if (columnCount <= 5) {
      // Standard responsive table for 1-5 columns
      return processStandardTable(tableMatch, columnCount);
    } else {
      // Transform to alternative view for 6+ columns
      return transformToAlternativeView(tableMatch, columnCount);
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
 * Process standard tables (1-5 columns) with responsive container and streaming support
 */
function processStandardTable(tableHtml: string, columnCount: number): string {
  // Work with original table HTML first, then wrap in container at the end
  let processedHtml = tableHtml;
  
  // Enhanced class application for standard tables
  processedHtml = processedHtml.replace(
    /<table([^>]*class="([^"]*)")([^>]*)>/gi,
    (match, classAttr, existingClasses, rest) => {
      const classes = existingClasses.trim();
      
      // Determine table variant and add column-specific optimizations
      let baseClasses = 'therapeutic-table streaming-stable-table';
      let variant = '';
      
      // Map therapeutic table types
      if (classes.includes('table-cbt-report') || classes.includes('cbt')) {
        variant = 'table-cbt-report';
        baseClasses += ' table-striped';
      } else if (classes.includes('table-progress') || classes.includes('progress')) {
        variant = 'table-progress';
      } else if (classes.includes('table-dashboard') || classes.includes('dashboard')) {
        variant = 'table-dashboard';
      } else if (classes.includes('table-comparison') || classes.includes('comparison')) {
        variant = 'table-comparison';
      } else if (classes.includes('table-compact') || classes.includes('compact')) {
        variant = 'table-compact';
      } else {
        baseClasses += ' table-striped';
      }
      
      // Add column-count specific optimization classes
      if (columnCount === 4 || columnCount === 5) {
        baseClasses += ' table-optimized-wide';
      }
      
      // Add streaming layout stability
      baseClasses += ' streaming-layout-stable';
      
      const allClasses = `${classes} ${baseClasses} ${variant}`.split(' ')
        .filter((cls, index, arr) => cls && arr.indexOf(cls) === index)
        .join(' ');
        
      return `<table class="${allClasses}" data-columns="${columnCount}" data-streaming-optimized="true"${rest}>`;
    }
  );
  
  // Handle tables without classes
  let baseClassesNoExisting = 'therapeutic-table table-striped streaming-stable-table streaming-layout-stable';
  if (columnCount === 4 || columnCount === 5) {
    baseClassesNoExisting += ' table-optimized-wide';
  }
  
  processedHtml = processedHtml.replace(
    /<table(?![^>]*class=)([^>]*)>/gi, 
    `<table class="${baseClassesNoExisting}" data-columns="${columnCount}" data-streaming-optimized="true"$1>`
  );
  
  // Normalize table structure to ensure proper thead/tbody elements (skip if already has thead)
  if (!processedHtml.includes('<thead')) {
    processedHtml = normalizeTableStructure(processedHtml);
  }
  
  // Add mobile data-label attributes and streaming attributes
  processedHtml = enhanceTableCellsWithLabels(processedHtml);
  processedHtml = addStreamingStabilityAttributes(processedHtml);
  
  // Finally, wrap in responsive container
  processedHtml = '<div class="table-container table-system streaming-table-container">' + processedHtml + '</div>';
  
  return processedHtml;
}

/**
 * Transform tables with 6+ columns to structured cards or definition lists
 */
function transformToAlternativeView(tableHtml: string, columnCount: number): string {
  // Extract table data structure
  const tableData = extractTableData(tableHtml);
  
  if (!tableData || tableData.headers.length === 0) {
    // Fallback to standard table if extraction fails
    return processStandardTable(tableHtml, columnCount);
  }
  
  // Determine the best alternative view based on content type and complexity
  const viewType = determineAlternativeViewType(tableData, columnCount);
  
  switch (viewType) {
    case 'structured-cards':
      return generateStructuredCards(tableData);
    case 'definition-list':
      return generateDefinitionList(tableData);
    case 'expandable-rows':
      return generateExpandableRows(tableData);
    default:
      // Fallback to cards for unknown types
      return generateStructuredCards(tableData);
  }
}

/**
 * Extract structured data from table HTML
 */
function extractTableData(tableHtml: string): TableDataStructure | null {
  try {
    // Extract headers
    const headerMatches = tableHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
    const headers = headerMatches.map(th => 
      th.replace(/<\/?[^>]+(>|$)/g, '').trim()
    );
    
    if (headers.length === 0) return null;
    
    // Extract rows
    const rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    const rows: string[][] = [];
    
    // Skip header row, process data rows
    for (let i = 1; i < rowMatches.length; i++) {
      const cellMatches = rowMatches[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      const cells = cellMatches.map(td => 
        td.replace(/<\/?[^>]+(>|$)/g, '').trim()
      );
      
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    
    return { headers, rows };
  } catch (error) {
    console.warn('Failed to extract table data:', error);
    return null;
  }
}

/**
 * Determine the best alternative view type based on table content
 */
function determineAlternativeViewType(tableData: TableDataStructure, columnCount: number): AlternativeViewType {
  const { headers } = tableData;
  
  // Check for key-value pair patterns (good for definition lists)
  const hasKeyValuePattern = headers.some(header => 
    /^(question|answer|problem|solution|before|after|input|output)$/i.test(header)
  );
  
  // Check for therapeutic data patterns (good for cards)
  const hasTherapeuticPattern = headers.some(header => 
    /^(patient|session|date|mood|anxiety|depression|intervention|goal|progress)$/i.test(header)
  );
  
  // Check for temporal/chronological data (good for expandable rows)
  const hasTemporalPattern = headers.some(header => 
    /^(date|time|session|week|day|before|during|after)$/i.test(header)
  );
  
  // Decision logic
  if (columnCount >= 10) {
    return 'expandable-rows'; // Best for very complex data
  } else if (hasKeyValuePattern && columnCount <= 8) {
    return 'definition-list'; // Good for Q&A, before/after comparisons
  } else if (hasTherapeuticPattern) {
    return 'structured-cards'; // Best for patient/session data
  } else if (hasTemporalPattern) {
    return 'expandable-rows'; // Good for timeline data
  } else {
    return 'structured-cards'; // Default for general complex data
  }
}

/**
 * Generate structured cards HTML for complex table data
 */
function generateStructuredCards(tableData: TableDataStructure): string {
  const { headers, rows } = tableData;
  
  let cardsHtml = '<div class="alternative-view-container structured-cards-container">';
  cardsHtml += '<div class="alternative-view-header">Complex Data View</div>';
  cardsHtml += '<div class="structured-cards-grid">';
  
  rows.forEach((row, rowIndex) => {
    cardsHtml += `<div class="structured-card" data-row="${rowIndex}">`;
    
    // Group related fields together
    const primaryFields: string[] = [];
    const secondaryFields: string[] = [];
    
    row.forEach((cell, cellIndex) => {
      if (cellIndex < headers.length) {
        const header = headers[cellIndex];
        const isPrimary = isPrimaryField(header, cell);
        
        const fieldHtml = `
          <div class="card-field ${isPrimary ? 'primary-field' : 'secondary-field'}">
            <div class="field-label">${header}</div>
            <div class="field-value">${cell || '—'}</div>
          </div>
        `;
        
        if (isPrimary) {
          primaryFields.push(fieldHtml);
        } else {
          secondaryFields.push(fieldHtml);
        }
      }
    });
    
    // Render primary fields first, then secondary
    cardsHtml += '<div class="card-primary-fields">' + primaryFields.join('') + '</div>';
    if (secondaryFields.length > 0) {
      cardsHtml += '<div class="card-secondary-fields">' + secondaryFields.join('') + '</div>';
    }
    
    cardsHtml += '</div>';
  });
  
  cardsHtml += '</div></div>';
  
  return cardsHtml;
}

/**
 * Generate definition list HTML for key-value table data
 */
function generateDefinitionList(tableData: TableDataStructure): string {
  const { headers, rows } = tableData;
  
  let listHtml = '<div class="alternative-view-container definition-list-container">';
  listHtml += '<div class="alternative-view-header">Structured Information</div>';
  
  rows.forEach((row, rowIndex) => {
    listHtml += `<dl class="therapeutic-definition-list" data-row="${rowIndex}">`;
    
    row.forEach((cell, cellIndex) => {
      if (cellIndex < headers.length) {
        const header = headers[cellIndex];
        listHtml += `
          <dt class="definition-term">${header}</dt>
          <dd class="definition-description">${cell || '—'}</dd>
        `;
      }
    });
    
    listHtml += '</dl>';
    if (rowIndex < rows.length - 1) {
      listHtml += '<hr class="row-separator">';
    }
  });
  
  listHtml += '</div>';
  
  return listHtml;
}

/**
 * Generate expandable rows HTML for very complex data
 */
function generateExpandableRows(tableData: TableDataStructure): string {
  const { headers, rows } = tableData;
  
  let expandableHtml = '<div class="alternative-view-container expandable-rows-container">';
  expandableHtml += '<div class="alternative-view-header">Detailed Data Records</div>';
  
  rows.forEach((row, rowIndex) => {
    // Show 2-3 most important fields as summary
    const summaryFields: { header: string; value: string }[] = [];
    const detailFields: { header: string; value: string }[] = [];
    
    row.forEach((cell, cellIndex) => {
      if (cellIndex < headers.length) {
        const header = headers[cellIndex];
        const fieldHtml = { header, value: cell || '—' };
        
        if (cellIndex < 3 || isPrimaryField(header, cell)) {
          summaryFields.push(fieldHtml);
        } else {
          detailFields.push(fieldHtml);
        }
      }
    });
    
    expandableHtml += `<div class="expandable-row" data-row="${rowIndex}">`;
    expandableHtml += '<div class="row-summary">';
    
    summaryFields.forEach(field => {
      expandableHtml += `<span class="summary-field"><strong>${field.header}:</strong> ${field.value}</span>`;
    });
    
    if (detailFields.length > 0) {
      expandableHtml += '<button class="expand-button" aria-expanded="false">Show Details</button>';
    }
    
    expandableHtml += '</div>';
    
    if (detailFields.length > 0) {
      expandableHtml += '<div class="row-details" hidden>';
      detailFields.forEach(field => {
        expandableHtml += `<div class="detail-field"><strong>${field.header}:</strong> ${field.value}</div>`;
      });
      expandableHtml += '</div>';
    }
    
    expandableHtml += '</div>';
  });
  
  expandableHtml += '</div>';
  
  return expandableHtml;
}

/**
 * Determine if a field should be considered primary/important
 */
function isPrimaryField(header: string, value: string): boolean {
  // Primary field indicators
  const primaryPatterns = [
    /^(patient|name|id|title|session|date)$/i,
    /^(primary|main|key|important)$/i,
    /^(mood|anxiety|depression|score|rating)$/i
  ];
  
  // Check header patterns
  if (primaryPatterns.some(pattern => pattern.test(header))) {
    return true;
  }
  
  // Check value patterns (short, important-looking values)
  if (value && value.length <= 20 && /^[0-9\/-]+$|high|medium|low|severe|mild/i.test(value)) {
    return true;
  }
  
  return false;
}

// Type definitions for the new system
interface TableDataStructure {
  headers: string[];
  rows: string[][];
}

type AlternativeViewType = 'structured-cards' | 'definition-list' | 'expandable-rows';

/**
 * Touch optimization is now handled entirely via CSS classes
 * This prevents React hydration mismatches with inline styles
 */

/**
 * Normalize table structure to ensure proper thead/tbody elements
 * This fixes issues where markdown-it doesn't generate proper table structure
 */
function normalizeTableStructure(html: string): string {
  return html.replace(/<table([^>]*)>([\s\S]*?)<\/table>/gi, (match, tableAttrs, tableContent) => {
    // Check if we already have proper thead/tbody structure
    if (tableContent.includes('<thead') && tableContent.includes('<tbody')) {
      return match; // Already properly structured
    }
    
    // Extract all table rows
    const rows = tableContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    
    if (rows.length === 0) {
      return match; // No rows found, return as is
    }
    
    // First row should be the header if it contains <th> elements
    const firstRow = rows[0];
    const isHeaderRow = firstRow.includes('<th');
    
    let normalizedContent = '';
    
    if (isHeaderRow) {
      // Wrap first row in thead
      normalizedContent += `<thead>${firstRow}</thead>`;
      
      // Wrap remaining rows in tbody
      if (rows.length > 1) {
        const bodyRows = rows.slice(1).join('');
        normalizedContent += `<tbody>${bodyRows}</tbody>`;
      }
    } else {
      // No header row, wrap all rows in tbody
      normalizedContent += `<tbody>${rows.join('')}</tbody>`;
    }
    
    return `<table${tableAttrs}>${normalizedContent}</table>`;
  });
}

/**
 * Add streaming stability attributes to prevent layout shifts during animation
 */
function addStreamingStabilityAttributes(html: string): string {
  // Add container-level attributes for streaming optimization
  html = html.replace(
    /<div class="([^"]*table-container[^"]*)"([^>]*)>/gi,
    '<div class="$1" data-streaming-container="true" data-layout-stable="true"$2>'
  );
  
  // Add table-level streaming attributes
  html = html.replace(
    /<table([^>]*)>/gi,
    '<table data-streaming-table="true" style="table-layout: fixed; width: 100%;"$1>'
  );
  
  // Add header stability attributes
  html = html.replace(
    /<th([^>]*?)>([\s\S]*?)<\/th>/gi,
    (match, attributes, content) => {
      const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, '').trim();
      const estimatedWidth = Math.max(cleanContent.length * 0.6, 4); // Rough character-based width estimation
      
      return `<th${attributes} data-streaming-header="true" data-min-width="${estimatedWidth}em">${content}</th>`;
    }
  );
  
  return html;
}

/**
 * Add data-label attributes to table cells for mobile stacked layout
 * Extracts header text and applies it to corresponding cells
 */
function enhanceTableCellsWithLabels(html: string): string {
  // Use a simple regex to find tables and process them
  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableMatch) => {
    // Extract header text from th elements
    const headerMatches = tableMatch.match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
    if (!headerMatches) return tableMatch;
    
    // Extract clean header text (strip HTML tags)
    const headers = headerMatches.map(th => 
      th.replace(/<\/?[^>]+(>|$)/g, '').trim()
    );
    
    // Add data-label attributes to td elements
    let processedTable = tableMatch;
    let cellIndex = 0;
    
    processedTable = processedTable.replace(/<td([^>]*?)>([\s\S]*?)<\/td>/gi, (match, attributes, cellContent) => {
      const headerIndex = cellIndex % headers.length;
      const headerText = headers[headerIndex] || `Column ${headerIndex + 1}`;
      cellIndex++;
      
      // Extract clean cell content for tooltip
      const cleanContent = cellContent.replace(/<\/?[^>]+(>|$)/g, '').trim();
      
      // Don't duplicate attributes if they already exist
      let newAttributes = attributes;
      if (!attributes.includes('data-label')) {
        newAttributes += ` data-label="${headerText}"`;
      }
      
      // Add title attribute for tooltip on longer content
      if (cleanContent.length > 50 && !attributes.includes('title')) {
        newAttributes += ` title="${cleanContent.replace(/"/g, '&quot;')}"`;
      }
      
      // Auto-detect column types for dynamic width optimization
      if (!attributes.includes('data-type')) {
        // Detect priority/numeric columns (short content, numbers, ratings)
        if (cleanContent.match(/^(high|medium|low|\d+|[1-5]\/5|\d+%|[★⭐]+)$/i) || 
            cleanContent.length <= 10) {
          newAttributes += ` data-type="priority"`;
        }
        // Detect header/framework columns (specific therapeutic terms)
        else if (headerText.toLowerCase().includes('framework') || 
                headerText.toLowerCase().includes('approach') ||
                headerText.toLowerCase().includes('method')) {
          newAttributes += ` data-type="framework"`;
        }
        // Default to content type for longer descriptive text
        else if (cleanContent.length > 20) {
          newAttributes += ` data-type="content"`;
        }
      }
      
      return `<td${newAttributes}>${cellContent}</td>`;
    });
    
    return processedTable;
  });
}

/**
 * Server-side table processing - no client-side detection needed
 * Uses CSS container queries for responsive behavior
 */

/**
 * Modern markdown processor using markdown-it + sanitize-html
 * Server-side table processing with CSS container queries for responsive behavior
 */
export function processMarkdown(text: string, _isUser: boolean = false): string {
  if (!text) return '';

  // Convert markdown to HTML using markdown-it
  let html: string;
  try {
    html = md.render(text);
  } catch (error) {
    console.warn('Markdown parsing failed:', error);
    html = `<p>${text}</p>`;
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