import type { TherapeuticModalProps } from './modal-types';

/**
 * Pre-configured modal presets for common therapeutic use cases
 * Server-side only - no 'use client' needed
 */
export const therapeuticModalPresets = {
  // CBT flow modal
  cbtFlow: (props: Partial<TherapeuticModalProps>) => ({
    variant: 'cbt-flow' as const,
    type: 'auto' as const,
    size: 'lg' as const,
    mobileOptimized: true,
    showProgress: true,
    ...props,
  }),

  // Session report modal
  sessionReport: (props: Partial<TherapeuticModalProps>) => ({
    variant: 'report' as const,
    type: 'dialog' as const,
    size: 'xl' as const,
    mobileAsSheet: true,
    ...props,
  }),

  // Confirmation modal
  confirmation: (props: Partial<TherapeuticModalProps>) => ({
    variant: 'confirm' as const,
    type: 'dialog' as const,
    size: 'sm' as const,
    preventClose: true,
    ...props,
  }),

  // Full-screen therapeutic modal
  therapeuticFullscreen: (props: Partial<TherapeuticModalProps>) => ({
    variant: 'therapeutic' as const,
    type: 'fullscreen' as const,
    size: 'full' as const,
    mobileOptimized: true,
    ...props,
  }),

  // Mobile sheet
  mobileSheet: (props: Partial<TherapeuticModalProps>) => ({
    type: 'sheet' as const,
    variant: 'default' as const,
    mobileOptimized: true,
    ...props,
  }),
} as const;
