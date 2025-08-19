'use client';

import React, { useMemo } from 'react';
import { TherapeuticCard, type ColumnConfig } from './therapeutic-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TherapeuticCardGridProps {
  data: Array<Record<string, unknown>>;
  columns: Array<ColumnConfig>;
  variant?: 'default' | 'therapeutic' | 'compact' | 'detailed';
  layout?: 'grid' | 'list' | 'masonry';
  className?: string;
  caption?: string;
  onCardClick?: (item: Record<string, unknown>, index: number) => void;
  onCardEdit?: (item: Record<string, unknown>, index: number) => void;
  onCardDelete?: (item: Record<string, unknown>, index: number) => void;
  onCardView?: (item: Record<string, unknown>, index: number) => void;
  emptyState?: React.ReactNode;
  loading?: boolean;
}

/**
 * Main container component for therapeutic card-based data display
 * Provides responsive grid layouts and mobile-optimized experiences
 */
export function TherapeuticCardGrid({
  data,
  columns,
  variant = 'default',
  layout = 'grid',
  className,
  caption,
  onCardClick,
  onCardEdit,
  onCardDelete,
  onCardView,
  emptyState,
  loading = false
}: TherapeuticCardGridProps) {
  
  // Memoize processed columns with default configurations
  const processedColumns = useMemo(() => {
    return columns.map((col, index) => ({
      ...col,
      priority: col.priority || (index === 0 ? 'high' : 'medium'),
      showInCompact: col.showInCompact !== false,
      type: col.type || 'text'
    }));
  }, [columns]);

  // Layout-specific CSS classes
  const layoutStyles = {
    grid: {
      container: cn(
        'grid gap-4',
        // Mobile: 2 columns for better space utilization
        'grid-cols-2',
        // Tablet: 2-3 columns  
        'sm:grid-cols-2',
        'md:grid-cols-3',
        // Desktop: 3-4 columns based on variant
        variant === 'compact' ? 'lg:grid-cols-4 xl:grid-cols-5' : 'lg:grid-cols-3 xl:grid-cols-4'
      ),
      item: ''
    },
    list: {
      container: 'flex flex-col gap-3',
      item: 'w-full'
    },
    masonry: {
      container: cn(
        'columns-1 gap-4 space-y-4',
        'sm:columns-2',
        'lg:columns-3',
        'xl:columns-4'
      ),
      item: 'break-inside-avoid mb-4'
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {caption && (
          <div className="px-1">
            <h3 className="text-lg font-semibold text-foreground">{caption}</h3>
          </div>
        )}
        <div className={layoutStyles.grid.container}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse bg-muted rounded-lg h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  // Handle empty state
  if (!data || data.length === 0) {
    const defaultEmptyState = (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-4m-8 0H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No data available</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          There&apos;s no information to display at the moment. Data will appear here once available.
        </p>
      </div>
    );

    return (
      <div className="space-y-4">
        {caption && (
          <div className="px-1">
            <h3 className="text-lg font-semibold text-foreground">{caption}</h3>
          </div>
        )}
        <div className="rounded-lg border bg-card">
          {emptyState || defaultEmptyState}
        </div>
      </div>
    );
  }

  // Count of total items for display
  const totalItems = data.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Caption and Summary */}
      {caption && (
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-semibold text-foreground">{caption}</h3>
          <Badge variant="secondary" className="text-xs">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      )}

      {/* Cards Container */}
      <div 
        className={cn(
          layoutStyles[layout].container,
          'therapeutic-card-grid',
          // Add staggered animation
          '[&>*]:animate-in [&>*]:fade-in-0 [&>*]:slide-in-from-bottom-4'
        )}
      >
        {data.map((item, index) => (
          <div
            key={index}
            className={cn(
              layoutStyles[layout].item,
              // Stagger animation delay
              `[animation-delay:${index * 50}ms]`
            )}
          >
            <TherapeuticCard
              data={item}
              columns={processedColumns}
              variant={variant}
              index={index}
              onClick={() => onCardClick?.(item, index)}
              onEdit={() => onCardEdit?.(item, index)}
              onDelete={() => onCardDelete?.(item, index)}
              onView={() => onCardView?.(item, index)}
            />
          </div>
        ))}
      </div>

      {/* Footer Summary for Large Datasets */}
      {totalItems > 20 && (
        <div className="flex justify-center pt-4">
          <Badge variant="outline" className="text-xs">
            Showing all {totalItems} items
          </Badge>
        </div>
      )}
    </div>
  );
}

// Utility function to convert table-style column definitions to card column configs
export function convertTableColumnsToCardColumns(
  tableColumns: Array<{
    key: string;
    label: string;
    className?: string;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  }>
): Array<ColumnConfig> {
  return tableColumns.map((col, index) => ({
    ...col,
    priority: index === 0 ? 'high' : index < 3 ? 'medium' : 'low',
    showInCompact: index < 4, // Show first 4 columns in compact mobile view
    type: 'text' as const
  }));
}

// Pre-configured layouts for common therapeutic data types
export const therapeuticCardLayouts = {
  sessions: {
    variant: 'therapeutic' as const,
    layout: 'grid' as const,
    columns: [
      { key: 'title', label: 'Session', priority: 'high' as const },
      { key: 'date', label: 'Date', priority: 'high' as const },
      { key: 'duration', label: 'Duration', priority: 'medium' as const },
      { key: 'status', label: 'Status', priority: 'medium' as const, type: 'badge' as const },
      { key: 'notes', label: 'Notes', priority: 'low' as const, showInCompact: false }
    ] as ColumnConfig[]
  },
  
  insights: {
    variant: 'detailed' as const,
    layout: 'list' as const,
    columns: [
      { key: 'insight', label: 'Insight', priority: 'high' as const },
      { key: 'category', label: 'Category', priority: 'high' as const, type: 'badge' as const },
      { key: 'confidence', label: 'Confidence', priority: 'medium' as const },
      { key: 'timestamp', label: 'Generated', priority: 'low' as const }
    ] as ColumnConfig[]
  },

  reports: {
    variant: 'compact' as const,
    layout: 'grid' as const,
    columns: [
      { key: 'title', label: 'Report', priority: 'high' as const },
      { key: 'type', label: 'Type', priority: 'high' as const, type: 'badge' as const },
      { key: 'created', label: 'Created', priority: 'medium' as const },
      { key: 'size', label: 'Size', priority: 'low' as const }
    ] as ColumnConfig[]
  }
} as const;