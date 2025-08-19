/**
 * Table Data Extraction Utility
 * Extracts structured data from markdown-it table tokens for React component rendering
 */

// Local type definition for markdown-it Token to avoid complex type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Token = any;

export interface TableData {
  headers: string[];
  rows: string[][];
  columnCount: number;
}

export interface TableDisplayConfig {
  displayMode: 'table' | 'cards' | 'auto';
  variant: 'default' | 'therapeutic' | 'compact' | 'detailed';
  layout: 'grid' | 'list' | 'masonry';
}

/**
 * Extract structured table data from markdown-it table tokens
 */
export function extractTableDataFromTokens(tokens: Token[], startIndex: number): {
  data: TableData;
  config: TableDisplayConfig;
  endIndex: number;
} {
  const tableToken = tokens[startIndex];
  if (!tableToken || tableToken.type !== 'table_open') {
    throw new Error('Expected table_open token');
  }

  const headers: string[] = [];
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let isInHeader = false;
  let isInBody = false;
  
  let index = startIndex + 1;
  
  while (index < tokens.length && tokens[index].type !== 'table_close') {
    const token = tokens[index];
    
    switch (token.type) {
      case 'thead_open':
        isInHeader = true;
        break;
        
      case 'thead_close':
        isInHeader = false;
        break;
        
      case 'tbody_open':
        isInBody = true;
        break;
        
      case 'tbody_close':
        isInBody = false;
        break;
        
      case 'tr_open':
        currentRow = [];
        break;
        
      case 'tr_close':
        if (isInHeader && currentRow.length > 0) {
          headers.push(...currentRow);
        } else if (isInBody && currentRow.length > 0) {
          rows.push([...currentRow]);
        }
        currentRow = [];
        break;
        
      case 'th_open':
      case 'td_open':
        // Start collecting cell content
        break;
        
      case 'th_close':
      case 'td_close':
        // Cell content should be in inline tokens between open/close
        const cellContent = extractCellContent(tokens, index - 1);
        currentRow.push(cellContent);
        break;
        
      case 'inline':
        // This contains the actual text content
        break;
    }
    
    index++;
  }

  const columnCount = Math.max(headers.length, ...rows.map(row => row.length));
  
  return {
    data: {
      headers: headers.length > 0 ? headers : generateDefaultHeaders(columnCount),
      rows,
      columnCount
    },
    config: determineDisplayConfig({ headers, rows, columnCount }),
    endIndex: index
  };
}

/**
 * Extract text content from table cell tokens
 */
function extractCellContent(tokens: Token[], cellCloseIndex: number): string {
  // Look backwards from cell_close to find the cell_open
  let cellOpenIndex = cellCloseIndex;
  while (cellOpenIndex > 0 && !tokens[cellOpenIndex].type.endsWith('_open')) {
    cellOpenIndex--;
  }
  
  // Collect all text content between cell_open and cell_close
  let content = '';
  for (let i = cellOpenIndex + 1; i < cellCloseIndex; i++) {
    const token = tokens[i];
    if (token.type === 'inline' && token.content) {
      content += token.content;
    }
  }
  
  return content.trim();
}

/**
 * Generate default column headers when none are provided
 */
function generateDefaultHeaders(columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
}

/**
 * Determine optimal display configuration based on table characteristics
 */
function determineDisplayConfig(data: TableData): TableDisplayConfig {
  const { columnCount } = data;
  
  // Analyze content characteristics for smarter decisions
  const contentAnalysis = analyzeTableContent(data);
  
  // Determine display mode based on multiple factors
  let displayMode: 'table' | 'cards' | 'auto' = 'auto';
  
  if (columnCount > 6) {
    displayMode = 'cards'; // Force cards for very complex tables
  } else if (columnCount > 4) {
    // 5-6 columns: decide based on content complexity and mobile-friendliness
    if (contentAnalysis.hasLongContent || contentAnalysis.isCBTData) {
      displayMode = 'cards'; // Better for mobile and complex content
    } else {
      displayMode = 'auto'; // Let responsive logic decide
    }
  } else if (columnCount <= 3 && contentAnalysis.isSimpleData) {
    displayMode = 'auto'; // Good for both formats
  } else {
    displayMode = 'auto'; // Default responsive behavior
  }
  
  // Determine variant based on enhanced content analysis
  let variant: 'default' | 'therapeutic' | 'compact' | 'detailed' = 'default';
  
  if (contentAnalysis.isCBTData || contentAnalysis.isTherapeuticData) {
    variant = 'therapeutic';
  } else if (contentAnalysis.isCompactData) {
    variant = 'compact';
  } else if (contentAnalysis.hasLongContent) {
    variant = 'detailed';
  }
  
  // Determine layout based on content characteristics and column count
  let layout: 'grid' | 'list' | 'masonry' = 'grid';
  
  if (columnCount <= 2) {
    layout = 'list';
  } else if (contentAnalysis.hasVariableContentLength || columnCount >= 6) {
    layout = 'masonry'; // Better for uneven content heights
  } else {
    layout = 'grid'; // Standard grid for uniform content
  }
  
  return {
    displayMode,
    variant,
    layout
  };
}

/**
 * Analyze table content to make smarter display decisions
 */
function analyzeTableContent(data: TableData): {
  isCBTData: boolean;
  isTherapeuticData: boolean;
  isCompactData: boolean;
  hasLongContent: boolean;
  isSimpleData: boolean;
  hasVariableContentLength: boolean;
} {
  const { headers, rows } = data;
  
  // CBT-specific patterns
  const cbtPatterns = /^(thought|feeling|behavior|situation|mood|rating|intensity|distortion|schema|belief|evidence|reframe|challenge)$/i;
  const isCBTData = headers.some(header => cbtPatterns.test(header)) ||
                    rows.some(row => row.some(cell => cbtPatterns.test(cell)));
  
  // General therapeutic patterns
  const therapeuticPatterns = /^(patient|session|therapy|treatment|progress|anxiety|depression|stress|emotion|goal|intervention|technique)$/i;
  const isTherapeuticData = headers.some(header => therapeuticPatterns.test(header)) ||
                           rows.some(row => row.some(cell => therapeuticPatterns.test(cell)));
  
  // Calculate content characteristics
  const allCells = rows.flat();
  const cellLengths = allCells.map(cell => cell.length);
  const avgCellLength = cellLengths.reduce((sum, len) => sum + len, 0) / Math.max(cellLengths.length, 1);
  const maxCellLength = Math.max(...cellLengths);
  const minCellLength = Math.min(...cellLengths);
  
  // Content classification
  const isCompactData = avgCellLength < 20 && maxCellLength < 50;
  const hasLongContent = maxCellLength > 100 || avgCellLength > 50;
  const isSimpleData = avgCellLength < 30 && maxCellLength < 60;
  const hasVariableContentLength = (maxCellLength - minCellLength) > 50;
  
  return {
    isCBTData,
    isTherapeuticData,
    isCompactData,
    hasLongContent,
    isSimpleData,
    hasVariableContentLength
  };
}

/**
 * Convert table data to column configuration for TherapeuticTable
 */
export function convertToColumnConfig(data: TableData): Array<{
  key: string;
  label: string;
  priority?: 'high' | 'medium' | 'low';
  type?: 'badge' | 'status' | 'text';
  showInCompact?: boolean;
}> {
  return data.headers.map((header, index) => {
    // Determine column priority based on position and content
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (index === 0) {
      priority = 'high'; // First column is usually the primary identifier
    } else if (index >= data.headers.length - 2) {
      priority = 'low'; // Last columns often contain secondary info
    }
    
    // Determine column type based on header text and typical content
    let type: 'badge' | 'status' | 'text' = 'text';
    const headerLower = header.toLowerCase();
    
    if (headerLower.includes('status') || headerLower.includes('state') || 
        headerLower.includes('level') || headerLower.includes('priority')) {
      type = 'status';
    } else if (headerLower.includes('tag') || headerLower.includes('type') ||
               headerLower.includes('category') || headerLower.match(/^(high|medium|low)$/i)) {
      type = 'badge';
    }
    
    return {
      key: `col_${index}`,
      label: header,
      priority,
      type,
      showInCompact: priority === 'high' || index < 3
    };
  });
}

/**
 * Convert table data to row data format expected by TherapeuticTable
 */
export function convertToRowData(data: TableData): Array<Record<string, unknown>> {
  return data.rows.map(row => {
    const rowData: Record<string, unknown> = {};
    row.forEach((cell, index) => {
      rowData[`col_${index}`] = cell;
    });
    return rowData;
  });
}