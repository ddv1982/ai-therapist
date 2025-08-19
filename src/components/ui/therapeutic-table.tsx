'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TherapeuticCardGrid, convertTableColumnsToCardColumns } from './therapeutic-card-grid';
import { cn } from "@/lib/utils";

interface TherapeuticTableProps {
  data: Array<Record<string, unknown>>;
  columns: Array<{ 
    key: string; 
    label: string; 
    className?: string;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  }>;
  className?: string;
  variant?: "default" | "therapeutic" | "compact";
  caption?: string;
  // New card-specific props
  displayMode?: 'table' | 'cards' | 'auto'; // Auto switches based on screen size
  layout?: 'grid' | 'list' | 'masonry';
  onItemClick?: (item: Record<string, unknown>, index: number) => void;
  onItemEdit?: (item: Record<string, unknown>, index: number) => void;
  onItemDelete?: (item: Record<string, unknown>, index: number) => void;
  onItemView?: (item: Record<string, unknown>, index: number) => void;
  loading?: boolean;
}

/**
 * Enhanced therapeutic data display component
 * Automatically switches between table and card layouts for optimal mobile experience
 * Fixes AI SDK markup formatting issues by providing proper CSS for all display modes
 */
export function TherapeuticTable({ 
  data, 
  columns, 
  className,
  variant = "default",
  caption,
  displayMode = "auto",
  layout = "grid",
  onItemClick,
  onItemEdit,
  onItemDelete,
  onItemView,
  loading = false
}: TherapeuticTableProps) {
  // Convert table columns to card columns
  const cardColumns = React.useMemo(() => {
    return convertTableColumnsToCardColumns(columns);
  }, [columns]);

  // Determine display mode based on props and screen size
  const [shouldUseCards, setShouldUseCards] = React.useState(false);
  
  React.useEffect(() => {
    if (displayMode === 'cards') {
      setShouldUseCards(true);
    } else if (displayMode === 'table') {
      setShouldUseCards(false);
    } else {
      // Auto mode: use cards on mobile, table on desktop
      const checkScreenSize = () => {
        setShouldUseCards(window.innerWidth < 768);
      };
      
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, [displayMode]);

  // Table-specific styling variants
  const tableVariants = {
    default: "w-full",
    therapeutic: "w-full border-primary/20 bg-primary/5 rounded-lg overflow-hidden",
    compact: "w-full text-sm"
  };

  const headerVariants = {
    default: "bg-muted/50",
    therapeutic: "bg-primary/10 text-primary-foreground/90",
    compact: "bg-muted/30 py-2"
  };

  const rowVariants = {
    default: "hover:bg-muted/30 transition-colors",
    therapeutic: "hover:bg-primary/10 transition-colors border-b border-primary/10",
    compact: "hover:bg-muted/20 py-1"
  };

  // Use card layout for mobile or when explicitly requested
  if (shouldUseCards || displayMode === 'cards') {
    return (
      <TherapeuticCardGrid
        data={data}
        columns={cardColumns}
        variant={variant === 'compact' ? 'compact' : variant === 'therapeutic' ? 'therapeutic' : 'default'}
        layout={layout}
        className={className}
        caption={caption}
        onCardClick={onItemClick}
        onCardEdit={onItemEdit}
        onCardDelete={onItemDelete}
        onCardView={onItemView}
        loading={loading}
      />
    );
  }

  // Empty state for table mode - don't show anything if no data
  if (!data || data.length === 0) {
    return null;
  }

  // Traditional table layout for desktop
  return (
    <div className={cn("rounded-md border overflow-hidden", variant === "therapeutic" && "border-primary/20", className)}>
      {caption && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-b bg-muted/20">
          {caption}
        </div>
      )}
      <Table className={cn(tableVariants[variant])}>
        <TableHeader>
          <TableRow className={cn(headerVariants[variant], "border-b")}>
            {columns.map((column) => (
              <TableHead 
                key={column.key} 
                className={cn(
                  "font-semibold text-left py-3 px-4",
                  variant === "compact" && "py-2",
                  column.className
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={index} 
              className={cn(rowVariants[variant])}
            >
              {columns.map((column) => (
                <TableCell 
                  key={column.key} 
                  className={cn(
                    "py-3 px-4",
                    variant === "compact" && "py-2"
                  )}
                >
                  {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// CSS classes that will be generated by the markdown processor
// These replace the missing therapeutic table classes
export const therapeuticTableClasses = {
  'therapeutic-table': 'w-full border-primary/20 bg-primary/5 rounded-lg overflow-hidden',
  'table-container': 'rounded-md border overflow-hidden mb-4',
  'table-system': 'w-full border-collapse',
  'table-header-therapeutic': 'bg-primary/10 text-primary-foreground/90 font-semibold',
  'table-row-therapeutic': 'hover:bg-primary/10 transition-colors border-b border-primary/10',
  'table-cell-therapeutic': 'py-3 px-4 text-left',
} as const;

/**
 * Hook to apply therapeutic table classes to markdown-generated tables
 */
export function useTherapeuticTableStyles() {
  React.useEffect(() => {
    // Apply therapeutic styles to any existing markdown tables
    const tables = document.querySelectorAll('table');
    tables.forEach((table) => {
      if (table.closest('.message-content-assistant')) {
        table.className = therapeuticTableClasses['therapeutic-table'];
        
        const header = table.querySelector('thead tr');
        if (header) {
          header.className = therapeuticTableClasses['table-header-therapeutic'];
        }
        
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row) => {
          row.className = therapeuticTableClasses['table-row-therapeutic'];
        });
        
        const cells = table.querySelectorAll('td, th');
        cells.forEach((cell) => {
          cell.className = therapeuticTableClasses['table-cell-therapeutic'];
        });
      }
    });
  }, []);
}