import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
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
 * Enhance tables with therapeutic styling and responsive wrappers
 * Automatically applies default classes if none are specified
 */
function enhanceTablesForTherapeuticUse(html: string): string {
  // First, wrap tables in responsive containers
  html = html.replace(
    /<table([^>]*)>/gi,
    '<div class="table-responsive"><table$1>'
  );
  
  // Close the wrapper divs
  html = html.replace(
    /<\/table>/gi,
    '</table></div>'
  );
  
  // Then enhance tables with default classes if none exist
  html = html.replace(
    /<table([^>]*class="([^"]*)")([^>]*)>/gi,
    (match, classAttr, existingClasses, rest) => {
      // If table already has classes, add therapeutic-table to them
      const classes = existingClasses.trim();
      const updatedClasses = classes ? `${classes} therapeutic-table` : 'therapeutic-table';
      return `<table class="${updatedClasses}"${rest}>`;
    }
  );
  
  // Handle tables without any classes
  html = html.replace(
    /<table(?![^>]*class=)([^>]*)>/gi, 
    '<table class="therapeutic-table table-striped"$1>'
  );
  
  // Add data-label attributes for mobile stacked view
  html = enhanceTableCellsWithLabels(html);
  
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
    
    processedTable = processedTable.replace(/<td([^>]*)>/gi, (match, attributes) => {
      const headerIndex = cellIndex % headers.length;
      const headerText = headers[headerIndex] || `Column ${headerIndex + 1}`;
      cellIndex++;
      
      // Don't duplicate data-label if it already exists
      if (attributes.includes('data-label')) {
        return match;
      }
      
      return `<td${attributes} data-label="${headerText}">`;
    });
    
    return processedTable;
  });
}

/**
 * Simplified markdown processor using markdown-it + sanitize-html
 * Generates standard HTML elements and relies on CSS classes for styling
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

  // Auto-enhance tables with therapeutic classes and responsive wrappers
  html = enhanceTablesForTherapeuticUse(html);

  // Sanitize HTML for security while preserving table styling classes
  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li',  // Standard list elements
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'blockquote', 'code', 'pre',
      'div', // Allow div wrappers for responsive tables
      'a' // Allow links
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'table': ['class', 'id'],
      'thead': ['class', 'id'], 
      'tbody': ['class', 'id'],
      'tr': ['class', 'id'],
      'th': ['class', 'id'],
      'td': ['class', 'id', 'data-label'], // data-label for mobile stacked layout
      'p': ['class', 'id'],
      'div': ['class', 'id'],
      'ul': ['class', 'id'],
      'ol': ['class', 'id'],
      'li': ['class', 'id']
    },
    // Allow therapeutic table classes and responsive wrappers
    allowedClasses: {
      'table': [
        'therapeutic-table', 'table-responsive', 'table-striped', 
        'table-compact', 'table-stacked', 'table-cbt-report', 'table-progress',
        'table-comparison', 'custom-table', 'w-full'
      ],
      'div': ['table-responsive', 'overflow-x-auto'],
      '*': ['therapeutic-table', 'table-responsive', 'table-striped', 'table-compact', 'table-stacked', 'table-cbt-report', 'custom-table']
    },
    transformTags: {
      // Security-related transforms for links
      'a': function(tagName, attribs) {
        attribs.target = '_blank';
        attribs.rel = 'noopener noreferrer';
        return { tagName, attribs };
      }
    }
  });
  
  return sanitizedHtml;
}