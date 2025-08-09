/**
 * Table System - Clean Exports
 * Modern, responsive, accessible table components
 */

// Component exports
export {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  CompleteTable,
  useTableResponsive,
} from './table';

// Wide table system exports
export {
  WideTable,
  ColumnManager,
  PriorityPlusIndicator,
  useWideTableContext,
} from './wide-table';

// Type exports
export type {
  TableProps,
  TableContainerProps,
  TableHeaderProps,
  TableCellProps,
  TableRowProps,
  TableBodyProps,
  TableHeadProps,
  TableVariant,
  TableSize,
  ColumnType,
  RowVariant,
  TableConfig,
  ColumnDefinition,
  TableData,
  TableThemeTokens,
  ResponsiveContext,
  TableA11yProps,
  ComprehensiveTableProps,
  // Wide table types
  WideTableProps,
  WideTableStrategy,
  ColumnPriority,
  WideColumnDefinition,
  WideTableConfig,
  ColumnVisibilityState,
  ColumnManagerProps,
  PriorityPlusIndicatorProps,
  WideTableContext,
  TableMetrics,
  PriorityDetectionConfig,
} from './table-types';

// Utility exports
export {
  isValidTableVariant,
  isValidColumnType,
  isValidTableSize,
  DEFAULT_TABLE_CONFIG,
  DEFAULT_THEME_TOKENS,
  DEFAULT_WIDE_TABLE_CONFIG,
  DEFAULT_PRIORITY_CONFIG,
} from './table-types';

// Default export for convenience
export { default } from './table';