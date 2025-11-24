'use client';

import { ReactNode } from 'react';
import { CardHeader as BaseCardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCardContext } from '@/components/ui/therapeutic-cards/compound/card-root';

export interface CardHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  stepIndicator?: { current: number; total: number };
  statusBadge?: { text: string; variant?: 'default' | 'therapy' | 'success' | 'warning' };
  isDraftSaved?: boolean;
  headerLayout?: 'default' | 'centered' | 'split' | 'minimal';
  className?: string;
  children?: ReactNode;
}

/**
 * Card header compound component
 * Displays title, subtitle, step indicators, and badges
 */
export function CardHeader({
  title,
  subtitle,
  stepIndicator,
  statusBadge,
  isDraftSaved,
  headerLayout = 'default',
  className,
  children,
}: CardHeaderProps) {
  const { variant } = useCardContext();

  const headerLayouts = {
    default: 'flex items-start justify-between gap-3',
    centered: 'text-center',
    split: 'flex items-center justify-between',
    minimal: 'pb-2',
  };

  return (
    <BaseCardHeader
      className={cn(
        'pb-3',
        variant === 'compact' && 'pt-4 pb-2',
        variant === 'modal' && 'pb-4',
        variant === 'cbt-section' && 'pb-6',
        className
      )}
    >
      <div className={headerLayouts[headerLayout]}>
        {/* Title and subtitle section */}
        <div className="min-w-0 flex-1">
          {/* Step indicator */}
          {stepIndicator && (
            <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              {stepIndicator.current && (
                <span>
                  Step {stepIndicator.current} of {stepIndicator.total}
                </span>
              )}
            </div>
          )}

          {/* Main title */}
          {title && (
            <CardTitle
              className={cn(
                'truncate',
                variant === 'compact' ? 'text-base' : 'text-xl',
                variant === 'therapeutic' && 'text-primary',
                variant === 'cbt-section' && 'flex items-center gap-2 text-xl font-semibold'
              )}
            >
              {title}
            </CardTitle>
          )}

          {/* Subtitle */}
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}

          {/* Status badge */}
          {statusBadge && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={statusBadge.variant || 'therapy'} size="sm">
                {statusBadge.text}
              </Badge>
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Draft saved indicator */}
          {isDraftSaved !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 rounded px-2 py-1 text-sm transition-all duration-300',
                isDraftSaved
                  ? 'scale-100 bg-green-50 text-green-600 opacity-100 dark:bg-green-900/20 dark:text-green-400'
                  : 'scale-95 opacity-0'
              )}
            >
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              Saved
            </div>
          )}

          {/* Custom children (for actions, collapse buttons) */}
          {children}
        </div>
      </div>
    </BaseCardHeader>
  );
}
