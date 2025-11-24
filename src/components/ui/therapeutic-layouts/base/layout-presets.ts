import type { TherapeuticLayoutProps } from './layout-types';

/**
 * Pre-configured layout presets for common patterns
 * These are server-side only - no 'use client' needed
 */
export const therapeuticLayoutPresets = {
  // Main therapeutic page layout
  therapeuticPage: (props: Partial<TherapeuticLayoutProps>) => ({
    layout: 'therapeutic' as const,
    variant: 'therapeutic' as const,
    typography: 'therapeutic' as const,
    padding: 'therapeutic' as const,
    background: 'therapeutic' as const,
    maxWidth: '4xl' as const,
    centerContent: true,
    responsive: true,
    ...props,
  }),

  // CBT exercise flow
  cbtFlow: (props: Partial<TherapeuticLayoutProps>) => ({
    layout: 'cbt-flow' as const,
    variant: 'cbt' as const,
    typography: 'therapeutic' as const,
    spacing: 'therapeutic' as const,
    animated: true,
    staggerChildren: true,
    ...props,
  }),

  // Modal content layout
  modalContent: (props: Partial<TherapeuticLayoutProps>) => ({
    layout: 'modal' as const,
    variant: 'modal' as const,
    typography: 'modal' as const,
    padding: 'lg' as const,
    background: 'modal' as const,
    shadow: 'lg' as const,
    ...props,
  }),

  // Responsive card grid
  cardGrid: (props: Partial<TherapeuticLayoutProps>) => ({
    layout: 'grid' as const,
    columns: 'responsive' as const,
    gap: 'md' as const,
    staggerChildren: true,
    responsive: true,
    ...props,
  }),

  // Mobile-optimized layout
  mobileOptimized: (props: Partial<TherapeuticLayoutProps>) => ({
    layout: 'mobile' as const,
    variant: 'mobile' as const,
    spacing: 'sm' as const,
    padding: 'sm' as const,
    mobileFirst: true,
    ...props,
  }),
} as const;
