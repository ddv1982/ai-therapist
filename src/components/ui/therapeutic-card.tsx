'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardFieldDisplay, getFieldVariant } from './card-field-display';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnConfig {
  key: string;
  label: string;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
  type?: 'badge' | 'status' | 'text';
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  showInCompact?: boolean; // Whether to show in compact mobile view
}

export interface TherapeuticCardProps {
  data: Record<string, unknown>;
  columns: Array<ColumnConfig>;
  variant?: 'default' | 'therapeutic' | 'compact' | 'detailed';
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
  index?: number; // For stagger animations
}

/**
 * Individual therapeutic card component with responsive design
 * Handles different variants and provides mobile-optimized layouts
 */
export function TherapeuticCard(props: TherapeuticCardProps) {
  const {
    data,
    columns,
    variant = 'default',
    onClick,
    className,
    index = 0
  } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine which columns to show based on variant and screen size
  const primaryColumns = columns.filter(col => col.priority === 'high' || col.showInCompact !== false).slice(0, 3);
  const secondaryColumns = columns.filter(col => !primaryColumns.includes(col));
  const hasSecondaryData = secondaryColumns.length > 0;

  // Get the primary field for the card title (first high priority or first column)
  const titleColumn = columns.find(col => col.priority === 'high') || columns[0];
  const titleValue = titleColumn ? data[titleColumn.key] : '';

  // Variant-specific styling
  const cardVariants = {
    default: 'hover:shadow-md transition-all duration-200',
    therapeutic: 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300',
    compact: 'shadow-sm hover:shadow-md transition-shadow duration-200',
    detailed: 'hover:shadow-xl transition-all duration-300 min-h-[200px]'
  };

  // Animation delay for stagger effect
  const animationDelay = `${index * 50}ms`;

  return (
    <Card 
      className={cn(
        cardVariants[variant],
        'cursor-pointer group relative overflow-hidden border-0',
        variant === 'therapeutic' && 'therapeutic-card',
        className
      )}
      onClick={onClick}
      style={{ animationDelay }}
    >
      {/* Card Header with Title and Badge */}
      <CardHeader className={cn(
        'pb-3',
        variant === 'compact' && 'pb-2 pt-4',
        variant === 'detailed' && 'pb-4'
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className={cn(
              'truncate',
              variant === 'compact' ? 'text-base' : 'text-xl',
              variant === 'therapeutic' && 'text-primary'
            )}>
              {titleColumn?.render ? titleColumn.render(titleValue, data) : String(titleValue || 'Untitled')}
            </CardTitle>
            
            {/* Primary badge if available */}
            {primaryColumns.find(col => col.type === 'badge') && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {primaryColumns
                  .filter(col => col.type === 'badge')
                  .map((col) => (
                    <Badge key={col.key} variant="therapy" size="sm">
                      {col.render ? col.render(data[col.key], data) : String(data[col.key] || '')}
                    </Badge>
                  ))
                }
              </div>
            )}
          </div>

        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className={cn(
        'space-y-3',
        variant === 'compact' && 'space-y-2 py-2',
        variant === 'detailed' && 'space-y-4'
      )}>
        {/* Primary Fields - Always Visible */}
        <div className="space-y-2">
          {primaryColumns
            .filter(col => col.type !== 'badge' && col.key !== titleColumn?.key)
            .map((column) => (
              <CardFieldDisplay
                key={column.key}
                label={column.label}
                value={data[column.key]}
                render={column.render ? (value, row) => column.render!(value, row || data) : undefined}
                row={data}
                variant={getFieldVariant(column.key, column)}
              />
            ))
          }
        </div>

        {/* Secondary Fields - Collapsible on Mobile */}
        {hasSecondaryData && (
          <>
            {/* Mobile: Collapsible Section */}
            <div className="md:hidden">
              {isExpanded && (
                <div className="space-y-2 pt-2 border-t border-border">
                  {secondaryColumns.map((column) => (
                    <CardFieldDisplay
                      key={column.key}
                      label={column.label}
                      value={data[column.key]}
                      render={column.render ? (value, row) => column.render!(value, row || data) : undefined}
                      row={data}
                      variant="secondary"
                    />
                  ))}
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="w-full mt-2 h-8 text-sm text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show More ({secondaryColumns.length} more)
                  </>
                )}
              </Button>
            </div>

            {/* Desktop: Always Visible */}
            <div className="hidden md:block space-y-2 pt-2 border-t border-border">
              {secondaryColumns.map((column) => (
                <CardFieldDisplay
                  key={column.key}
                  label={column.label}
                  value={data[column.key]}
                  render={column.render ? (value, row) => column.render!(value, row || data) : undefined}
                  row={data}
                  variant="secondary"
                />
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Therapeutic gradient overlay for enhanced variant */}
      {variant === 'therapeutic' && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </Card>
  );
}