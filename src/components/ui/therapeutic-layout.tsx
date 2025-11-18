'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Unified interface for all layout patterns
export interface TherapeuticLayoutProps {
  children: ReactNode;

  // Layout types
  layout?:
    | 'stack'
    | 'grid'
    | 'therapeutic'
    | 'modal'
    | 'mobile'
    | 'cbt-flow'
    | 'sidebar'
    | 'centered'
    | 'split';

  // Spacing system (8pt grid)
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'therapeutic';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'therapeutic';

  // Grid-specific options
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 'auto' | 'responsive';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // Typography hierarchy
  typography?: 'none' | 'default' | 'therapeutic' | 'modal' | 'compact';

  // Visual variants
  variant?: 'default' | 'therapeutic' | 'modal' | 'mobile' | 'cbt' | 'elevated';

  // Background and styling
  background?: 'none' | 'default' | 'therapeutic' | 'modal' | 'muted' | 'gradient';
  border?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'therapeutic';

  // Responsive behavior
  responsive?: boolean;
  mobileFirst?: boolean;

  // Animation and effects
  animated?: boolean;
  staggerChildren?: boolean;
  animationDelay?: number;

  // Accessibility
  role?: string;
  ariaLabel?: string;

  // Custom styling
  className?: string;
  containerClassName?: string;

  // Layout-specific props
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  centerContent?: boolean;
  fullHeight?: boolean;
}

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
export function TherapeuticLayout({
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
  // Spacing system (8pt grid)
  const spacingClasses = {
    none: 'space-y-0',
    xs: 'space-y-1', // 4px
    sm: 'space-y-2', // 8px
    md: 'space-y-4', // 16px
    lg: 'space-y-6', // 24px
    xl: 'space-y-8', // 32px
    therapeutic: 'space-y-6 md:space-y-8', // Responsive therapeutic spacing
  };

  const paddingClasses = {
    none: '',
    xs: 'p-1', // 4px
    sm: 'p-2', // 8px
    md: 'p-4', // 16px
    lg: 'p-6', // 24px
    xl: 'p-8', // 32px
    therapeutic: 'p-4 md:p-6 lg:p-8', // Responsive therapeutic padding
  };

  // Grid configurations
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    auto: 'grid-cols-auto-fit',
    responsive: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

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

  // Typography hierarchy
  const typographyClasses = {
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
  const variantClasses = {
    default: '',
    therapeutic: 'therapeutic-layout',
    modal: 'modal-layout bg-background',
    mobile: 'mobile-layout touch-pan-y',
    cbt: 'cbt-layout therapeutic-spacing',
    elevated: 'elevated-layout',
  };

  // Background options
  const backgroundClasses = {
    none: '',
    default: 'bg-background',
    therapeutic: 'bg-gradient-to-br from-background via-background to-muted/20',
    modal: 'bg-card',
    muted: 'bg-muted/30',
    gradient: 'bg-gradient-to-br from-primary/5 via-background to-accent/5',
  };

  // Shadow options
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    therapeutic: 'shadow-lg shadow-primary/5',
  };

  // Max width options
  const maxWidthClasses = {
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
}

// Specialized layout components for common patterns
export function TherapeuticSection({
  title,
  subtitle,
  children,
  className,
  ...props
}: TherapeuticLayoutProps & {
  title?: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <TherapeuticLayout
      layout="therapeutic"
      typography="therapeutic"
      variant="therapeutic"
      padding="therapeutic"
      className={className}
      {...props}
    >
      {title && (
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-primary text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mx-auto max-w-2xl">{subtitle}</p>}
        </div>
      )}
      {children}
    </TherapeuticLayout>
  );
}

export function CBTFlowLayout({
  children,
  currentStep,
  totalSteps,
  className,
  ...props
}: TherapeuticLayoutProps & {
  currentStep?: number;
  totalSteps?: number;
}) {
  return (
    <TherapeuticLayout
      layout="cbt-flow"
      variant="cbt"
      typography="therapeutic"
      responsive={true}
      className={className}
      {...props}
    >
      {currentStep && totalSteps && (
        <div className="mb-6 text-center">
          <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      )}
      {children}
    </TherapeuticLayout>
  );
}

export function ModalLayout({
  children,
  title,
  className,
  ...props
}: TherapeuticLayoutProps & {
  title?: ReactNode;
}) {
  return (
    <TherapeuticLayout
      layout="modal"
      variant="modal"
      typography="modal"
      padding="lg"
      background="modal"
      shadow="lg"
      maxWidth="2xl"
      className={className}
      {...props}
    >
      {title && (
        <div className="border-border border-b pb-6 text-center">
          <h2 className="text-3xl font-semibold">{title}</h2>
        </div>
      )}
      {children}
    </TherapeuticLayout>
  );
}

export function ResponsiveGrid({
  children,
  columns = 'responsive',
  className,
  ...props
}: TherapeuticLayoutProps) {
  return (
    <TherapeuticLayout
      layout="grid"
      columns={columns}
      gap="md"
      responsive={true}
      staggerChildren={true}
      className={className}
      {...props}
    >
      {children}
    </TherapeuticLayout>
  );
}

// Pre-configured layout presets
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
