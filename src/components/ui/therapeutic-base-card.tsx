'use client';

import { useState, ReactNode, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Unified interface that consolidates all card patterns
export interface TherapeuticBaseCardProps {
  // Content and layout
  title?: ReactNode;
  subtitle?: ReactNode;
  content?: ReactNode;
  children?: ReactNode;

  // Visual variants
  variant?: 'default' | 'therapeutic' | 'modal' | 'compact' | 'interactive' | 'cbt-section';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Therapeutic features
  stepIndicator?: { current: number; total: number };
  statusBadge?: { text: string; variant?: 'default' | 'therapy' | 'success' | 'warning' };
  isDraftSaved?: boolean;

  // Interactive features
  collapsible?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;

  // Actions
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: ReactNode;
  secondaryActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'ghost' | 'outline';
  }>;

  // Animation and styling
  animationDelay?: number;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;

  // Layout options
  headerLayout?: 'default' | 'centered' | 'split' | 'minimal';
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';

  // CBT-specific props
  emotionColor?: string;
  progressPercentage?: number;

  // Responsive behavior
  mobileOptimized?: boolean;
  hideOnMobile?: boolean;
}

/**
 * Unified therapeutic card component that consolidates all card patterns
 * Replaces: TherapeuticCard, CBT chat components, session cards, modal cards
 *
 * Features:
 * - Multiple therapeutic variants with consistent styling
 * - Built-in collapsible sections and animations
 * - Step indicators and status badges
 * - Draft saving indicators
 * - Mobile optimization
 * - CBT-specific styling and features
 */
const TherapeuticBaseCardComponent = function TherapeuticBaseCard({
  title,
  subtitle,
  content,
  children,
  variant = 'default',
  size = 'md',
  stepIndicator,
  statusBadge,
  isDraftSaved,
  collapsible = false,
  defaultExpanded = true,
  onToggle,
  onAction,
  actionLabel,
  actionIcon,
  secondaryActions = [],
  animationDelay = 0,
  className,
  headerClassName,
  contentClassName,
  headerLayout = 'default',
  contentPadding = 'md',
  emotionColor,
  progressPercentage,
  mobileOptimized = true,
  hideOnMobile = false,
  ...props
}: TherapeuticBaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  // Variant-specific styling
  const cardVariants = {
    default: 'hover:shadow-md transition-all duration-200',
    therapeutic:
      'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 therapeutic-card',
    modal: 'shadow-lg border-0 bg-card',
    compact: 'shadow-sm hover:shadow-md transition-shadow duration-200',
    interactive:
      'cursor-pointer hover:shadow-xl transition-all duration-300 group relative overflow-hidden',
    'cbt-section':
      'min-h-[200px] cbt-modal-card border-primary/10 bg-gradient-to-br from-background to-muted/30',
  };

  // Size variations
  const sizeVariants = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'w-full',
  };

  // Header layout variations
  const headerLayouts = {
    default: 'flex items-start justify-between gap-3',
    centered: 'text-center',
    split: 'flex items-center justify-between',
    minimal: 'pb-2',
  };

  // Content padding variations
  const contentPaddingVariants = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  // Animation delay for stagger effects
  const animationStyle = animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined;

  return (
    <Card
      className={cn(
        cardVariants[variant],
        sizeVariants[size],
        'relative overflow-hidden border-0',
        variant === 'therapeutic' && 'therapeutic-card',
        variant === 'cbt-section' && 'cbt-section-card',
        hideOnMobile && 'hidden sm:block',
        mobileOptimized && 'mobile-optimized-card',
        className
      )}
      style={animationStyle}
      onClick={variant === 'interactive' ? onAction : undefined}
      {...props}
    >
      {/* Header Section */}
      {(title ||
        subtitle ||
        stepIndicator ||
        statusBadge ||
        collapsible ||
        secondaryActions.length > 0) && (
        <CardHeader
          className={cn(
            'pb-3',
            variant === 'compact' && 'pt-4 pb-2',
            variant === 'modal' && 'pb-4',
            variant === 'cbt-section' && 'pb-6',
            headerClassName
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

              {/* Secondary actions */}
              {secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className="h-8 px-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}

              {/* Collapse/expand toggle */}
              {collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar for CBT sections */}
          {progressPercentage !== undefined && (
            <div className="bg-muted mt-3 h-1 w-full overflow-hidden rounded-full">
              <div
                className="from-primary to-accent h-full bg-gradient-to-r transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </CardHeader>
      )}

      {/* Content Section */}
      {(content || children) && (!collapsible || isExpanded) && (
        <CardContent
          className={cn(
            'space-y-4',
            contentPaddingVariants[contentPadding],
            variant === 'compact' && 'space-y-2',
            variant === 'cbt-section' && 'space-y-6',
            contentClassName
          )}
        >
          {content || children}
        </CardContent>
      )}

      {/* Action button for interactive cards */}
      {onAction && actionLabel && variant === 'interactive' && (
        <div className="p-4 pt-0">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="w-full"
          >
            {actionIcon}
            {actionLabel}
          </Button>
        </div>
      )}

      {/* Therapeutic gradient overlay */}
      {variant === 'therapeutic' && (
        <div className="from-primary/5 to-accent/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}

      {/* CBT emotion color accent */}
      {emotionColor && (
        <div
          className="absolute top-0 bottom-0 left-0 w-1 opacity-60"
          style={{ backgroundColor: emotionColor }}
        />
      )}
    </Card>
  );
};

// Memoized export - only re-render when card props change
export const TherapeuticBaseCard = memo(TherapeuticBaseCardComponent);

// Pre-configured card variants for common therapeutic use cases
export const therapeuticCardPresets = {
  // CBT section cards
  cbtSection: (props: Partial<TherapeuticBaseCardProps>) => ({
    variant: 'cbt-section' as const,
    size: 'full' as const,
    contentPadding: 'lg' as const,
    mobileOptimized: true,
    ...props,
  }),

  // Emotion rating cards
  emotionCard: (props: Partial<TherapeuticBaseCardProps>) => ({
    variant: 'therapeutic' as const,
    size: 'md' as const,
    mobileOptimized: true,
    ...props,
  }),

  // Session report cards
  sessionCard: (props: Partial<TherapeuticBaseCardProps>) => ({
    variant: 'interactive' as const,
    size: 'lg' as const,
    headerLayout: 'split' as const,
    ...props,
  }),

  // Modal content cards
  modalCard: (props: Partial<TherapeuticBaseCardProps>) => ({
    variant: 'modal' as const,
    size: 'full' as const,
    contentPadding: 'lg' as const,
    ...props,
  }),

  // Compact list cards
  compactCard: (props: Partial<TherapeuticBaseCardProps>) => ({
    variant: 'compact' as const,
    size: 'sm' as const,
    contentPadding: 'sm' as const,
    ...props,
  }),
} as const;

// CSS classes for integration with existing styling
export const therapeuticCardClasses = {
  'therapeutic-card': 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20',
  'cbt-section-card':
    'min-h-[200px] border-primary/10 bg-gradient-to-br from-background to-muted/30',
  'mobile-optimized-card': 'transition-transform active:scale-[0.98] sm:active:scale-100',
  'cbt-modal-card': 'shadow-lg border-primary/10 bg-card',
} as const;
