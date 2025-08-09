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
 * Enhance tables with mobile-first touch-optimized therapeutic styling
 * Applies responsive wrappers and touch-friendly classes automatically
 */
function enhanceTablesForTherapeuticUse(html: string): string {
  // First, wrap tables in touch-optimized responsive containers
  html = html.replace(
    /<table([^>]*)>/gi,
    '<div class="table-responsive table-container"><table$1>'
  );
  
  // Close the wrapper divs
  html = html.replace(
    /<\/table>/gi,
    '</table></div>'
  );
  
  // Enhanced class application with touch optimization
  html = html.replace(
    /<table([^>]*class="([^"]*)")([^>]*)>/gi,
    (match, classAttr, existingClasses, rest) => {
      const classes = existingClasses.trim();
      
      // Determine if this is a specialized table type
      let baseClasses = 'therapeutic-table table-touch-optimized';
      
      // Check for specialized table types and enhance accordingly
      if (classes.includes('table-cbt-report') || classes.includes('cbt')) {
        baseClasses += ' table-striped';
      } else if (classes.includes('table-progress') || classes.includes('progress')) {
        baseClasses += ' table-progress';
      } else if (classes.includes('table-dashboard') || classes.includes('dashboard')) {
        baseClasses += ' table-dashboard';
      } else if (classes.includes('table-comparison') || classes.includes('comparison')) {
        baseClasses += ' table-comparison';
      } else if (classes.includes('table-compact') || classes.includes('compact')) {
        baseClasses += ' table-compact';
      } else {
        // Default styling for general tables
        baseClasses += ' table-striped';
      }
      
      // Merge with existing classes, avoiding duplicates
      const allClasses = `${classes} ${baseClasses}`.split(' ')
        .filter((cls, index, arr) => cls && arr.indexOf(cls) === index)
        .join(' ');
        
      return `<table class="${allClasses}"${rest}>`;
    }
  );
  
  // Handle tables without any classes - mobile-first default
  html = html.replace(
    /<table(?![^>]*class=)([^>]*)>/gi, 
    '<table class="therapeutic-table table-touch-optimized table-striped"$1>'
  );
  
  // Add mobile-optimized data-label attributes for stacked layout
  html = enhanceTableCellsWithLabels(html);
  
  // Add touch-action optimization to all table elements
  html = addTouchActionToTables(html);
  
  return html;
}

/**
 * Add touch-action optimization to table elements for iOS Safari
 * Prevents double-tap issues on mobile devices
 * Note: Touch-action is handled via CSS classes to avoid React hydration issues
 */
function addTouchActionToTables(html: string): string {
  // Touch-action optimization is now handled entirely via CSS classes
  // to prevent React hydration mismatches with inline styles
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
 * Detect if we're on a mobile device
 * Uses both client-side detection and responsive design principles
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: assume desktop for SSR, will be corrected on client
    return false;
  }
  
  // Check screen width (mobile-first breakpoint)
  const isMobileWidth = window.innerWidth < 768;
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || '';
  const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Return true if either condition is met
  return isMobileWidth || isMobileUA;
}

/**
 * Convert HTML table to readable text format for mobile
 */
function convertTableToMobileText(html: string): string {
  // Find all tables and convert them to text
  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableMatch) => {
    // Extract table data
    const rows: string[][] = [];
    let headers: string[] = [];
    
    // Extract headers
    const headerMatches = tableMatch.match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
    if (headerMatches) {
      headers = headerMatches.map(th => 
        th.replace(/<\/?[^>]+(>|$)/g, '').trim()
      );
    }
    
    // Extract data rows
    const rowMatches = tableMatch.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (rowMatches) {
      rowMatches.forEach(rowMatch => {
        const cellMatches = rowMatch.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        if (cellMatches) {
          const rowData = cellMatches.map(td => 
            td.replace(/<\/?[^>]+(>|$)/g, '').trim()
          );
          rows.push(rowData);
        }
      });
    }
    
    // Convert to mobile-friendly text format
    if (headers.length === 0 && rows.length === 0) {
      return '<p><em>Table data not available</em></p>';
    }
    
    let mobileText = '<div class="mobile-table-text">\n';
    
    // If we have headers but no data rows, just show headers
    if (headers.length > 0 && rows.length === 0) {
      mobileText += '<p><strong>' + headers.join(' • ') + '</strong></p>\n';
    }
    // If we have data, format it nicely
    else if (rows.length > 0) {
      rows.forEach((row, rowIndex) => {
        mobileText += '<div class="mobile-table-row">\n';
        
        row.forEach((cell, cellIndex) => {
          if (cell.trim()) {
            const header = headers[cellIndex] || `Item ${cellIndex + 1}`;
            mobileText += `<p><strong>${header}:</strong> ${cell}</p>\n`;
          }
        });
        
        mobileText += '</div>\n';
        if (rowIndex < rows.length - 1) {
          mobileText += '<hr style="margin: 1rem 0; border: none; border-top: 1px solid #e5e7eb;">\n';
        }
      });
    }
    
    mobileText += '</div>';
    return mobileText;
  });
}

/**
 * Simplified markdown processor using markdown-it + sanitize-html
 * Automatically converts tables to text on mobile devices for better readability
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

  // Check if we're on mobile and should convert tables to text
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // Convert tables to mobile-friendly text format
    html = convertTableToMobileText(html);
  } else {
    // Desktop: enhance tables with therapeutic classes and responsive wrappers
    html = enhanceTablesForTherapeuticUse(html);
  }

  // Sanitize HTML for security
  const allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's',
    'ul', 'ol', 'li',
    'hr', 'blockquote', 'code', 'pre',
    'div', 'a'
  ];
  
  const allowedClasses = {
    'div': ['mobile-table-text', 'mobile-table-row', 'table-responsive', 'table-container'],
    '*': ['mobile-table-text', 'mobile-table-row']
  };
  
  // Add table tags and classes only for desktop
  if (!isMobile) {
    allowedTags.push('table', 'thead', 'tbody', 'tr', 'th', 'td');
    allowedClasses['table'] = [
      'therapeutic-table', 'table-responsive', 'table-striped', 
      'table-compact', 'table-stacked', 'table-cbt-report', 'table-progress',
      'table-comparison', 'table-dashboard', 'table-touch-optimized',
      'table-scroll-horizontal', 'custom-table', 'w-full'
    ];
    allowedClasses['tr'] = ['progress-positive', 'progress-negative'];
    allowedClasses['td'] = ['progress-positive', 'progress-negative'];
    allowedClasses['*'] = [
      ...allowedClasses['*'],
      'therapeutic-table', 'table-responsive', 'table-striped', 'table-compact', 
      'table-stacked', 'table-cbt-report', 'table-progress', 'table-comparison',
      'table-dashboard', 'table-touch-optimized', 'custom-table',
      'progress-positive', 'progress-negative'
    ];
  }

  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'table': ['class', 'id'],
      'thead': ['class', 'id'], 
      'tbody': ['class', 'id'],
      'tr': ['class', 'id'],
      'th': ['class', 'id'],
      'td': ['class', 'id', 'data-label'],
      'p': ['class', 'id', 'style'],
      'div': ['class', 'id'],
      'hr': ['style'],
      'ul': ['class', 'id'],
      'ol': ['class', 'id'],
      'li': ['class', 'id']
    },
    allowedClasses,
    allowedStyles: {
      'hr': {
        'margin': [/^\d+(\.\d+)?(px|em|rem|%)(\s+\d+(\.\d+)?(px|em|rem|%))*$/],
        'border': [/^none$/],
        'border-top': [/^1px solid #[a-fA-F0-9]{6}$/]
      }
    },
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