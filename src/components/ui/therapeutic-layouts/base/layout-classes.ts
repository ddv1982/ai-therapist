/**
 * CSS class mappings for therapeutic layouts
 * These are server-side only - no 'use client' needed
 */

// Spacing system (8pt grid)
export const spacingClasses = {
  none: 'space-y-0',
  xs: 'space-y-1', // 4px
  sm: 'space-y-2', // 8px
  md: 'space-y-4', // 16px
  lg: 'space-y-6', // 24px
  xl: 'space-y-8', // 32px
  therapeutic: 'space-y-6 md:space-y-8', // Responsive therapeutic spacing
};

export const paddingClasses = {
  none: '',
  xs: 'p-1', // 4px
  sm: 'p-2', // 8px
  md: 'p-4', // 16px
  lg: 'p-6', // 24px
  xl: 'p-8', // 32px
  therapeutic: 'p-4 md:p-6 lg:p-8', // Responsive therapeutic padding
};

// Grid configurations
export const gridClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  auto: 'grid-cols-auto-fit',
  responsive: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

export const gapClasses = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

// Typography hierarchy
export const typographyClasses = {
  none: '',
  default:
    '[&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-base [&_.meta]:text-sm',
  therapeutic:
    '[&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-primary [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-base [&_.meta]:text-sm [&_.meta]:text-muted-foreground',
  modal: '[&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-sm',
  compact:
    '[&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_p]:text-sm [&_.meta]:text-sm',
};

// Visual variants
export const variantClasses = {
  default: '',
  therapeutic: 'therapeutic-layout',
  modal: 'modal-layout bg-background',
  mobile: 'mobile-layout touch-pan-y',
  cbt: 'cbt-layout therapeutic-spacing',
  elevated: 'elevated-layout',
};

// Background options
export const backgroundClasses = {
  none: '',
  default: 'bg-background',
  therapeutic: 'bg-gradient-to-br from-background via-background to-muted/20',
  modal: 'bg-card',
  muted: 'bg-muted/30',
  gradient: 'bg-gradient-to-br from-primary/5 via-background to-accent/5',
};

// Shadow options
export const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  therapeutic: 'shadow-lg shadow-primary/5',
};

// Max width options
export const maxWidthClasses = {
  none: '',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-full',
};

// CSS classes for integration with globals.css
export const therapeuticLayoutClasses = {
  'therapeutic-layout': 'max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8',
  'cbt-layout': 'space-y-8 therapeutic-spacing',
  'therapeutic-spacing': '[&>*+*]:mt-6 md:[&>*+*]:mt-8',
  'modal-layout': 'bg-background rounded-lg shadow-xl border border-border',
  'mobile-layout': 'px-4 py-4 touch-pan-y',
  'elevated-layout': 'bg-card shadow-lg rounded-lg border border-border/50',
  'responsive-layout': 'responsive-container',
  'mobile-first-layout': 'mobile-first-responsive',
} as const;
