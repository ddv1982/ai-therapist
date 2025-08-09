/**
 * Table System TypeScript Definitions
 * Type-safe interfaces for the robust table system
 */

import { ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';

// Base table component props
export interface TableProps extends Omit<HTMLAttributes<HTMLTableElement>, 'className'> {
  children: ReactNode;
  variant?: TableVariant;
  size?: TableSize;
  striped?: boolean;
  className?: string;
}

// Table container wrapper props
export interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

// Table header props
export interface TableHeaderProps extends Omit<ThHTMLAttributes<HTMLTableHeaderCellElement>, 'className'> {
  children: ReactNode;
  sortable?: boolean;
  columnType?: ColumnType;
  className?: string;
}

// Table cell props
export interface TableCellProps extends Omit<TdHTMLAttributes<HTMLTableDataCellElement>, 'className'> {
  children: ReactNode;
  label?: string; // For mobile data-label
  columnType?: ColumnType;
  className?: string;
}

// Table row props
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  variant?: RowVariant;
  className?: string;
}

// Table body props
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

// Table head props
export interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

// Table styling variants
export type TableVariant = 
  | 'default'
  | 'cbt-report'
  | 'progress'
  | 'comparison'
  | 'dashboard'
  | 'compact';

// Table size variants
export type TableSize = 
  | 'sm'
  | 'md'
  | 'lg';

// Column type for automatic styling
export type ColumnType = 
  | 'priority'    // Short numeric/priority content
  | 'framework'   // Framework/method names
  | 'content'     // Longer descriptive content
  | 'metric'      // Dashboard metrics/numbers
  | 'label'       // Descriptive labels
  | 'default';

// Row styling variants
export type RowVariant = 
  | 'default'
  | 'positive'    // Progress positive indicator
  | 'negative'    // Progress negative indicator
  | 'neutral';

// Table configuration options
export interface TableConfig {
  responsive: boolean;
  mobileCardLayout: boolean;
  stripedRows: boolean;
  hoverEffects: boolean;
  sortable: boolean;
  columnResize: boolean;
}

// Column definition for programmatic table generation
export interface ColumnDefinition {
  id: string;
  header: string;
  type: ColumnType;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  accessor?: string | ((row: Record<string, unknown>) => ReactNode);
  className?: string;
}

// Table data structure for programmatic generation
export interface TableData {
  columns: ColumnDefinition[];
  rows: Record<string, unknown>[];
  config?: Partial<TableConfig>;
}

// Style tokens for theming
export interface TableThemeTokens {
  colors: {
    background: string;
    border: string;
    text: string;
    headerBackground: string;
    stripeBackground: string;
    hoverBackground: string;
  };
  spacing: {
    cellPaddingMobile: string;
    cellPaddingDesktop: string;
    rowMinHeightMobile: string;
    rowMinHeightDesktop: string;
  };
  typography: {
    fontSizeMobile: string;
    fontSizeDesktop: string;
    headerFontWeight: string;
  };
  layout: {
    borderRadius: string;
    borderWidth: string;
    mobileBreakpoint: string;
    tabletBreakpoint: string;
  };
}

// Responsive breakpoint detection (server-safe)
export interface ResponsiveContext {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  containerWidth?: number;
}

// Table accessibility props
export interface TableA11yProps {
  captionText?: string;
  summaryText?: string;
  headerScope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  sortDirection?: 'asc' | 'desc' | 'none';
  rowHeaders?: boolean;
}

// Complete table component props combining all features
export interface ComprehensiveTableProps extends TableProps {
  data?: TableData;
  a11y?: TableA11yProps;
  theme?: Partial<TableThemeTokens>;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: Record<string, unknown>, index: number) => void;
}

// Type guards for runtime checks
export const isValidTableVariant = (variant: unknown): variant is TableVariant => {
  return ['default', 'cbt-report', 'progress', 'comparison', 'dashboard', 'compact'].includes(variant as string);
};

export const isValidColumnType = (type: unknown): type is ColumnType => {
  return ['priority', 'framework', 'content', 'metric', 'label', 'default'].includes(type as string);
};

export const isValidTableSize = (size: unknown): size is TableSize => {
  return ['sm', 'md', 'lg'].includes(size as string);
};

// Default configurations
export const DEFAULT_TABLE_CONFIG: TableConfig = {
  responsive: true,
  mobileCardLayout: true,
  stripedRows: false,
  hoverEffects: true,
  sortable: false,
  columnResize: false,
};

export const DEFAULT_THEME_TOKENS: TableThemeTokens = {
  colors: {
    background: 'hsl(var(--card))',
    border: 'hsl(var(--border))',
    text: 'hsl(var(--foreground))',
    headerBackground: 'hsl(var(--muted) / 0.8)',
    stripeBackground: 'hsl(var(--muted) / 0.15)',
    hoverBackground: 'hsl(var(--muted) / 0.25)',
  },
  spacing: {
    cellPaddingMobile: '0.75rem',
    cellPaddingDesktop: '1rem 1.25rem',
    rowMinHeightMobile: '44px',
    rowMinHeightDesktop: '60px',
  },
  typography: {
    fontSizeMobile: '0.875rem',
    fontSizeDesktop: '1rem',
    headerFontWeight: '700',
  },
  layout: {
    borderRadius: '0.5rem',
    borderWidth: '1px',
    mobileBreakpoint: '480px',
    tabletBreakpoint: '768px',
  },
};

// ========================================
// WIDE TABLE SYSTEM TYPES (5+ Columns)
// ========================================

// Column priority for wide tables
export type ColumnPriority = 'high' | 'medium' | 'low';

// Wide table response strategies (horizontal-scroll removed due to 5-column rule)
export type WideTableStrategy = 
  | 'priority-plus'     // Hide lower priority columns
  | 'adaptive-cards'    // Transform to cards on mobile
  | 'column-toggle'     // User-controlled column visibility
  | 'auto';            // Automatically choose based on column count

// Enhanced column definition with priority and wide table features
export interface WideColumnDefinition extends ColumnDefinition {
  priority?: ColumnPriority;
  hiddenByDefault?: boolean;
  alwaysVisible?: boolean; // Cannot be hidden by user
  groupId?: string;      // For column grouping
}

// Wide table configuration
export interface WideTableConfig extends TableConfig {
  strategy: WideTableStrategy;
  maxVisibleColumns: number;
  stickyColumns: number;
  allowColumnToggle: boolean;
  preserveColumnOrder: boolean;
  showHiddenColumnsIndicator: boolean;
  keyboardNavigation: boolean;
}

// Column management state for user preferences  
export interface ColumnVisibilityState {
  [columnId: string]: {
    visible: boolean;
    order: number;
    width?: string;
  };
}

// Wide table props extending the base table props
export interface WideTableProps extends Omit<TableProps, 'variant'> {
  // Wide table specific props
  columns: WideColumnDefinition[];
  strategy?: WideTableStrategy;
  maxVisibleColumns?: number;
  _stickyFirstColumn?: boolean;
  allowColumnManagement?: boolean;
  
  // Column management callbacks
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  onColumnOrderChange?: (columnIds: string[]) => void;
  onColumnResize?: (columnId: string, width: number) => void;
  
  // Initial state
  initialColumnVisibility?: ColumnVisibilityState;
  
  // Advanced features
  showColumnManager?: boolean;
  persistColumnPreferences?: boolean;
  enableKeyboardNavigation?: boolean;
  
  // Accessibility
  columnNavigationLabel?: string;
  hiddenColumnsAnnouncement?: string;
}

// Column manager component props
export interface ColumnManagerProps {
  columns: WideColumnDefinition[];
  visibilityState: ColumnVisibilityState;
  onVisibilityChange: (columnId: string, visible: boolean) => void;
  onOrderChange: (columnIds: string[]) => void;
  onReset: () => void;
  className?: string;
}

// Priority-plus indicator props
export interface PriorityPlusIndicatorProps {
  hiddenCount: number;
  hiddenColumns: WideColumnDefinition[];
  onShowHidden: () => void;
  className?: string;
}

// Wide table context for child components
export interface WideTableContext {
  strategy: WideTableStrategy;
  columnCount: number;
  visibleColumnCount: number;
  isWide: boolean;
  columnVisibility: ColumnVisibilityState;
  setColumnVisibility: (state: ColumnVisibilityState) => void;
}

// Auto-detection utilities
export interface TableMetrics {
  columnCount: number;
  containerWidth: number;
  averageColumnWidth: number;
  totalContentWidth: number;
  recommendedStrategy: WideTableStrategy;
}

// Column priority detection algorithm
export interface PriorityDetectionConfig {
  dataTypeWeights: Record<ColumnType, number>;
  positionWeight: number; // Left columns get higher priority
  userInteractionWeight: number; // Frequently accessed columns
  semanticWeight: number; // Based on content importance
}

// Default wide table configuration
export const DEFAULT_WIDE_TABLE_CONFIG: WideTableConfig = {
  responsive: true,
  mobileCardLayout: true,
  stripedRows: false,
  hoverEffects: true,
  sortable: false,
  columnResize: false,
  strategy: 'auto',
  maxVisibleColumns: 4,
  stickyColumns: 1,
  allowColumnToggle: true,
  preserveColumnOrder: true,
  showHiddenColumnsIndicator: true,
  keyboardNavigation: true,
};

// Priority detection configuration
export const DEFAULT_PRIORITY_CONFIG: PriorityDetectionConfig = {
  dataTypeWeights: {
    priority: 0.9,    // High priority for status/rating columns
    framework: 0.7,   // Medium-high for categorization
    content: 0.5,     // Medium for descriptive content
    metric: 0.8,      // High for numerical data
    label: 0.3,       // Lower for descriptive labels
    default: 0.5,
  },
  positionWeight: 0.3,
  userInteractionWeight: 0.4,
  semanticWeight: 0.6,
};