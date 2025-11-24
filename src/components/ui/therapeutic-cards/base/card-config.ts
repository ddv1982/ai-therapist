/**
 * Card configuration constants
 * Server-side only - no 'use client' needed
 */

// Variant-specific styling
export const cardVariants = {
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
export const sizeVariants = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'w-full',
};

// Header layout variations
export const headerLayouts = {
  default: 'flex items-start justify-between gap-3',
  centered: 'text-center',
  split: 'flex items-center justify-between',
  minimal: 'pb-2',
};

// Content padding variations
export const contentPaddingVariants = {
  none: 'p-0',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

// CSS classes for integration with existing styling
export const therapeuticCardClasses = {
  'therapeutic-card': 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20',
  'cbt-section-card':
    'min-h-[200px] border-primary/10 bg-gradient-to-br from-background to-muted/30',
  'mobile-optimized-card': 'transition-transform active:scale-[0.98] sm:active:scale-100',
  'cbt-modal-card': 'shadow-lg border-primary/10 bg-card',
} as const;
