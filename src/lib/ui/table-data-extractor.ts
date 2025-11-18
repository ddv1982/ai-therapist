/**
 * Table Data Extraction Utility
 * Extracts structured data from markdown-it table tokens for React component rendering
 */

// Local type definition for markdown-it Token to avoid complex type issues
type Token = {
  type: string;
  tag: string;
  content: string;
  children?: Token[];
};

export interface TableData {
  headers: string[];
  rows: string[][];
  columnCount: number;
}

// Column-based display configuration has been removed. We keep only the
// extracted table data to render via a unified, responsive table path.

/**
 * Extract structured table data from markdown-it table tokens
 */
export function extractTableDataFromTokens(
  tokens: Token[],
  startIndex: number
): {
  data: TableData;
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
        const cellContent = extractCellContent(tokens, index);
        currentRow.push(cellContent);
        break;

      case 'inline':
        // This contains the actual text content
        break;
    }

    index++;
  }

  const columnCount = Math.max(headers.length, ...rows.map((row) => row.length));

  return {
    data: {
      headers: headers.length > 0 ? headers : generateDefaultHeaders(columnCount),
      rows,
      columnCount,
    },
    endIndex: index,
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

// All column-count based display heuristics have been removed.

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

    if (
      headerLower.includes('status') ||
      headerLower.includes('state') ||
      headerLower.includes('level') ||
      headerLower.includes('priority')
    ) {
      type = 'status';
    } else if (
      headerLower.includes('tag') ||
      headerLower.includes('type') ||
      headerLower.includes('category') ||
      headerLower.match(/^(high|medium|low)$/i)
    ) {
      type = 'badge';
    }

    return {
      key: `col_${index}`,
      label: header,
      priority,
      type,
      showInCompact: priority === 'high' || index < 3,
    };
  });
}

/**
 * Convert table data to row data format expected by TherapeuticTable
 */
export function convertToRowData(data: TableData): Array<Record<string, unknown>> {
  return data.rows.map((row) => {
    const rowData: Record<string, unknown> = {};
    row.forEach((cell, index) => {
      rowData[`col_${index}`] = cell;
    });
    return rowData;
  });
}
