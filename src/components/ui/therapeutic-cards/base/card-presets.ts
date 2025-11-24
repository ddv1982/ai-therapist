import type { TherapeuticBaseCardProps } from './card-types';

/**
 * Pre-configured card variants for common therapeutic use cases
 * Server-side only - no 'use client' needed
 */
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
