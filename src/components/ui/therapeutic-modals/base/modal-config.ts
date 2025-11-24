/**
 * Modal configuration constants
 * Server-side only - no 'use client' needed
 */

// Size configurations
export const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

// Variant-specific styling
export const variantClasses = {
  default: '',
  therapeutic: 'therapeutic-modal',
  'cbt-flow': 'cbt-flow-modal min-h-[500px]',
  report: 'report-modal',
  confirm: 'confirm-modal',
};

// CSS classes for integration with existing styling
export const therapeuticModalClasses = {
  'therapeutic-modal': 'bg-gradient-to-br from-background to-muted/20 border-primary/10',
  'cbt-flow-modal': 'min-h-[500px] cbt-modal-styling',
  'report-modal': 'max-w-4xl report-modal-styling',
  'confirm-modal': 'max-w-md text-center',
} as const;
