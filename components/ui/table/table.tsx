/**
 * Robust Table Component System
 * Modern, accessible, responsive tables with TypeScript support
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import {
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
} from './table-types';

// Import the CSS styles
import './table-styles.css';

/**
 * Table Container - Responsive wrapper with container queries
 */
export const TableContainer = forwardRef<HTMLDivElement, TableContainerProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('table-container table-system', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TableContainer.displayName = 'TableContainer';

/**
 * Main Table Component
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, variant = 'default', size = 'md', striped = false, className, ...props }, ref) => {
    const variantClass = getTableVariantClass(variant);
    const sizeClass = getTableSizeClass(size);
    
    return (
      <table
        ref={ref}
        className={cn(
          'therapeutic-table',
          variantClass,
          sizeClass,
          striped && 'table-striped',
          className
        )}
        {...props}
      >
        {children}
      </table>
    );
  }
);
Table.displayName = 'Table';

/**
 * Table Header Component
 */
export const TableHead = forwardRef<HTMLTableSectionElement, TableHeadProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <thead ref={ref} className={cn('', className)} {...props}>
        {children}
      </thead>
    );
  }
);
TableHead.displayName = 'TableHead';

/**
 * Table Body Component
 */
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <tbody ref={ref} className={cn('', className)} {...props}>
        {children}
      </tbody>
    );
  }
);
TableBody.displayName = 'TableBody';

/**
 * Table Row Component
 */
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    const variantClass = getRowVariantClass(variant);
    
    return (
      <tr ref={ref} className={cn(variantClass, className)} {...props}>
        {children}
      </tr>
    );
  }
);
TableRow.displayName = 'TableRow';

/**
 * Table Header Cell Component
 */
export const TableHeader = forwardRef<HTMLTableHeaderCellElement, TableHeaderProps>(
  ({ children, columnType = 'default', sortable = false, className, ...props }, ref) => {
    const columnTypeClass = getColumnTypeClass(columnType);
    
    return (
      <th
        ref={ref}
        className={cn(columnTypeClass, sortable && 'sortable', className)}
        data-type={columnType}
        {...props}
      >
        {children}
      </th>
    );
  }
);
TableHeader.displayName = 'TableHeader';

/**
 * Table Cell Component
 */
export const TableCell = forwardRef<HTMLTableDataCellElement, TableCellProps>(
  ({ children, label, columnType = 'default', className, ...props }, ref) => {
    const columnTypeClass = getColumnTypeClass(columnType);
    
    return (
      <td
        ref={ref}
        className={cn(columnTypeClass, className)}
        data-label={label}
        data-type={columnType}
        {...props}
      >
        {children}
      </td>
    );
  }
);
TableCell.displayName = 'TableCell';

/**
 * Complete Table System - Combines all components
 */
interface CompleteTableProps extends TableProps {
  caption?: string;
  container?: boolean;
}

export const CompleteTable = forwardRef<HTMLTableElement, CompleteTableProps>(
  ({ children, caption, container = true, ...tableProps }, ref) => {
    const table = (
      <>
        {caption && <caption className="sr-only">{caption}</caption>}
        <Table ref={ref} {...tableProps}>
          {children}
        </Table>
      </>
    );

    if (container) {
      return <TableContainer>{table}</TableContainer>;
    }

    return table;
  }
);
CompleteTable.displayName = 'CompleteTable';

// Helper functions for CSS class generation

function getTableVariantClass(variant: TableVariant): string {
  const variantMap: Record<TableVariant, string> = {
    'default': '',
    'cbt-report': 'table-cbt-report',
    'progress': 'table-progress',
    'comparison': 'table-comparison',
    'dashboard': 'table-dashboard',
    'compact': 'table-compact',
  };
  
  return variantMap[variant] || '';
}

function getTableSizeClass(size: TableSize): string {
  const sizeMap: Record<TableSize, string> = {
    'sm': 'table-sm',
    'md': '',
    'lg': 'table-lg',
  };
  
  return sizeMap[size] || '';
}

function getColumnTypeClass(type: ColumnType): string {
  const typeMap: Record<ColumnType, string> = {
    'priority': 'column-priority',
    'framework': 'column-framework',
    'content': 'column-content',
    'metric': 'column-metric',
    'label': 'column-label',
    'default': '',
  };
  
  return typeMap[type] || '';
}

function getRowVariantClass(variant: RowVariant): string {
  const variantMap: Record<RowVariant, string> = {
    'default': '',
    'positive': 'progress-positive',
    'negative': 'progress-negative',
    'neutral': '',
  };
  
  return variantMap[variant] || '';
}

// Utility hook for responsive table behavior (server-safe)
export function useTableResponsive() {
  // For server-side rendering, we default to mobile-first
  // The CSS container queries will handle the actual responsive behavior
  return {
    isMobile: true, // Default assumption for SSR
    isTablet: false,
    isDesktop: false,
  };
}

// Export all components as default export for convenience
const TableComponents = {
  Container: TableContainer,
  Root: Table,
  Head: TableHead,
  Body: TableBody,
  Row: TableRow,
  Header: TableHeader,
  Cell: TableCell,
  Complete: CompleteTable,
};

export default TableComponents;