'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { TherapeuticLayoutProps } from './layout-types';
import {
  spacingClasses,
  paddingClasses,
  gridClasses,
  gapClasses,
  typographyClasses,
  variantClasses,
  backgroundClasses,
  shadowClasses,
  maxWidthClasses,
} from './layout-classes';

/**
 * Unified therapeutic layout component that consolidates all layout patterns
 * Replaces: Various grid layouts, spacing patterns, responsive containers
 *
 * Features:
 * - Standardized 8pt grid system
 * - Typography hierarchy enforcement
 * - Multiple therapeutic layout variants
 * - Built-in responsive behavior
 * - Animation and stagger effects
 * - Consistent spacing and padding
 */
const TherapeuticLayoutComponent = function TherapeuticLayout({
  children,
  layout = 'stack',
  spacing = 'md',
  padding = 'none',
  columns = 'responsive',
  gap = 'md',
  typography = 'default',
  variant = 'default',
  background = 'none',
  border = false,
  shadow = 'none',
  responsive = true,
  mobileFirst = true,
  animated = false,
  staggerChildren = false,
  animationDelay = 0,
  role,
  ariaLabel,
  className,
  containerClassName,
  maxWidth = 'none',
  centerContent = false,
  fullHeight = false,
  ...props
}: TherapeuticLayoutProps) {
  // Layout-specific classes
  const layoutClasses = {
    stack: cn('flex flex-col', spacingClasses[spacing]),
    grid: cn('grid', gridClasses[columns], gapClasses[gap]),
    therapeutic: cn('flex flex-col', spacingClasses.therapeutic, 'max-w-4xl mx-auto'),
    modal: cn('flex flex-col space-y-6 max-w-2xl mx-auto'),
    mobile: cn('flex flex-col space-y-4 px-4'),
    'cbt-flow': cn('flex flex-col space-y-8 max-w-4xl mx-auto px-4'),
    sidebar: cn('flex gap-6 h-full'),
    centered: cn('flex flex-col items-center justify-center min-h-screen text-center'),
    split: cn('grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'),
  };

  // Animation styles
  const animationStyle = animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined;

  return (
    <div
      className={cn(
        // Base layout
        layoutClasses[layout],

        // Padding
        paddingClasses[padding],

        // Visual variant
        variantClasses[variant],

        // Background and styling
        backgroundClasses[background],
        border && 'border-border border',
        shadowClasses[shadow],

        // Typography
        typographyClasses[typography],

        // Max width and centering
        maxWidthClasses[maxWidth],
        centerContent && 'mx-auto',
        fullHeight && 'min-h-screen',

        // Animation
        animated && 'animate-in fade-in slide-in-from-bottom-4',
        staggerChildren && '[&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-4',

        // Responsive optimizations
        responsive && 'responsive-layout',
        mobileFirst && 'mobile-first-layout',

        containerClassName
      )}
      style={animationStyle}
      role={role}
      aria-label={ariaLabel}
      {...props}
    >
      <div className={cn('w-full', className)}>{children}</div>
    </div>
  );
};

// Memoized export - only re-render when layout props change
export const TherapeuticLayout = memo(TherapeuticLayoutComponent);
