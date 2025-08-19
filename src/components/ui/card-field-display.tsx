'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CardFieldDisplayProps {
  label: string;
  value: unknown;
  render?: (value: unknown, row?: Record<string, unknown>) => React.ReactNode;
  variant?: 'primary' | 'secondary' | 'badge' | 'status';
  className?: string;
  row?: Record<string, unknown>; // Full row data for render function
}

/**
 * Reusable component for displaying field data within therapeutic cards
 * Handles different data types and provides consistent styling
 */
export function CardFieldDisplay({
  label,
  value,
  render,
  variant = 'secondary',
  className,
  row
}: CardFieldDisplayProps) {
  // Handle empty or null values
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Use custom render function if provided
  const renderedValue = render ? render(value, row) : String(value);

  // Variant-specific styling
  const variantStyles = {
    primary: 'text-base font-semibold text-foreground',
    secondary: 'text-sm text-muted-foreground',
    badge: 'text-xs',
    status: 'text-sm font-medium'
  };

  const labelStyles = {
    primary: 'text-sm font-medium text-muted-foreground mb-1',
    secondary: 'text-xs text-muted-foreground/80',
    badge: 'text-xs text-muted-foreground/80',
    status: 'text-xs text-muted-foreground/80 mb-1'
  };

  // Special handling for badge variant
  if (variant === 'badge') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <span className={labelStyles[variant]}>
            {label}
          </span>
        )}
        <Badge variant="therapy" size="sm">
          {renderedValue}
        </Badge>
      </div>
    );
  }

  // Status variant with prominent display
  if (variant === 'status') {
    return (
      <div className={cn('flex flex-col', className)}>
        {label && (
          <span className={labelStyles[variant]}>
            {label}
          </span>
        )}
        <div className={cn(variantStyles[variant])}>
          {renderedValue}
        </div>
      </div>
    );
  }

  // Primary variant - larger, more prominent
  if (variant === 'primary') {
    return (
      <div className={cn('flex flex-col space-y-1', className)}>
        <span className={labelStyles[variant]}>
          {label}
        </span>
        <div className={cn(variantStyles[variant])}>
          {renderedValue}
        </div>
      </div>
    );
  }

  // Default secondary variant - compact inline display
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <span className={labelStyles[variant]}>
        {label}:
      </span>
      <div className={cn(variantStyles[variant])}>
        {renderedValue}
      </div>
    </div>
  );
}

// Utility function to determine appropriate variant based on column configuration
export function getFieldVariant(
  columnKey: string,
  columnConfig?: { key: string; priority?: 'high' | 'medium' | 'low'; type?: 'badge' | 'status' | 'text' }
): 'primary' | 'secondary' | 'badge' | 'status' {
  if (!columnConfig) return 'secondary';
  
  if (columnConfig.type === 'badge') return 'badge';
  if (columnConfig.type === 'status') return 'status';
  
  switch (columnConfig.priority) {
    case 'high':
      return 'primary';
    case 'medium':
      return 'status';
    default:
      return 'secondary';
  }
}