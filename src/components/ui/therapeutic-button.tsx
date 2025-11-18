'use client';

import { forwardRef, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Enhanced button variants that consolidate all button patterns
const therapeuticButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden',
  {
    variants: {
      variant: {
        // Standard variants
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',

        // Therapeutic variants
        therapeutic:
          'bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg hover:shadow-xl hover:from-primary/90 hover:to-accent/90 transition-all duration-300 group',
        'therapeutic-outline':
          'border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 text-primary hover:border-primary/40 hover:shadow-md transition-all duration-300',
        'therapeutic-ghost':
          'text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200',

        // Action variants
        action: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        'action-primary':
          'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
        'action-destructive':
          'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground',

        // Mobile-optimized variants
        mobile:
          'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 min-h-[44px]',
        'mobile-ghost':
          'hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all duration-150 min-h-[44px]',

        // Special effect variants (shimmer removed)
        gradient:
          'bg-gradient-to-r from-primary via-accent to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-semibold shadow-lg transition-all duration-500',
      },

      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-sm',
        lg: 'h-10 rounded-md px-8 text-base',
        xl: 'h-12 rounded-lg px-10 text-xl font-semibold',
        icon: 'h-9 w-9',
        'mobile-touch': 'h-12 px-6 text-base min-w-[120px]', // Mobile-friendly size
        compact: 'h-6 px-2 text-sm',
        full: 'w-full h-12 text-base font-semibold',
      },

      animation: {
        none: '',
        hover: 'hover:brightness-110',
        press: 'active:scale-95',
        bounce: 'hover:animate-bounce',
        pulse: 'animate-pulse',
        spin: 'hover:animate-spin',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'press',
    },
  }
);

// Enhanced interface with therapeutic-specific props
export interface TherapeuticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof therapeuticButtonVariants> {
  asChild?: boolean;

  // Visual enhancements
  icon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  loadingText?: string;

  // Therapeutic features
  shimmerEffect?: boolean;
  gradientAnimation?: boolean;
  therapeuticFeedback?: boolean; // Haptic-like visual feedback

  // Progress and status
  progress?: number; // 0-100 for progress buttons
  badge?: string | number;

  // Mobile optimization
  mobileOptimized?: boolean;
  preventZoom?: boolean; // Prevent mobile zoom on focus

  // Advanced styling
  glowEffect?: boolean;
  customGradient?: string;
  animationDelay?: number;

  // Accessibility enhancements
  tooltipText?: string;
  ariaExpanded?: boolean;
}

/**
 * Unified therapeutic button component that consolidates all button patterns
 * Replaces: Regular buttons, gradient buttons, mobile buttons, action buttons
 *
 * Features:
 * - Multiple therapeutic variants with consistent styling
 * - Built-in loading states and progress indicators
 * - Mobile optimization with proper touch targets
 * - Shimmer and gradient effects
 * - Enhanced accessibility
 * - Therapeutic visual feedback
 */
const TherapeuticButton = forwardRef<HTMLButtonElement, TherapeuticButtonProps>(
  (
    {
      className,
      variant,
      size,
      animation,
      asChild = false,
      icon,
      rightIcon,
      loading = false,
      loadingText = 'Loading...',
      shimmerEffect = false,
      gradientAnimation = false,
      therapeuticFeedback = false,
      progress,
      badge,
      mobileOptimized = false,
      preventZoom = false,
      glowEffect = false,
      customGradient,
      animationDelay = 0,
      tooltipText,
      ariaExpanded,
      children,
      style,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Auto-apply mobile variant if mobile optimized
    const finalVariant = mobileOptimized && variant === 'default' ? 'mobile' : variant;
    const finalSize = mobileOptimized && size === 'default' ? 'mobile-touch' : size;

    // Combine styles with custom properties
    const combinedStyle = {
      ...style,
      ...(animationDelay > 0 && { animationDelay: `${animationDelay}ms` }),
      ...(customGradient && { background: customGradient }),
      ...(preventZoom && { fontSize: '16px' }), // Prevent iOS zoom
    };

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          therapeuticButtonVariants({ variant: finalVariant, size: finalSize, animation }),
          // Additional therapeutic effects
          shimmerEffect && '',
          gradientAnimation && 'gradient-animation',
          glowEffect && 'glow-effect',
          therapeuticFeedback && 'therapeutic-feedback',
          loading && 'cursor-not-allowed opacity-70',
          progress !== undefined && 'progress-button',
          // Mobile optimizations
          mobileOptimized && 'mobile-optimized-button',
          className
        )}
        style={combinedStyle}
        title={tooltipText}
        aria-expanded={ariaExpanded}
        {...props}
      >
        {/* Progress indicator background */}
        {progress !== undefined && (
          <div
            className="bg-primary/20 absolute inset-0 rounded-md transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-inherit">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {loadingText && <span className="ml-2 text-sm">{loadingText}</span>}
          </div>
        )}

        {/* Button content */}
        <div
          className={cn(
            'relative z-10 flex items-center justify-center gap-2',
            loading && 'opacity-0'
          )}
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}

          {/* Badge */}
          {badge && (
            <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-sm">
              {badge}
            </span>
          )}
        </div>

        {/* Shimmer effect removed */}

        {/* Therapeutic glow effect */}
        {glowEffect && (
          <div className="bg-primary/20 absolute inset-0 -z-10 scale-110 rounded-md opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
        )}
      </Comp>
    );
  }
);

TherapeuticButton.displayName = 'TherapeuticButton';

// Pre-configured button presets for common therapeutic use cases
export const therapeuticButtonPresets = {
  // Primary action buttons
  primaryAction: (props: Partial<TherapeuticButtonProps>) => ({
    variant: 'therapeutic' as const,
    size: 'lg' as const,
    shimmerEffect: false,
    therapeuticFeedback: true,
    ...props,
  }),

  // Submit buttons with progress
  submit: (props: Partial<TherapeuticButtonProps>) => ({
    variant: 'therapeutic' as const,
    size: 'full' as const,
    shimmerEffect: false,
    animation: 'hover' as const,
    ...props,
  }),

  // Mobile-optimized buttons
  mobile: (props: Partial<TherapeuticButtonProps>) => ({
    variant: 'mobile' as const,
    size: 'mobile-touch' as const,
    mobileOptimized: true,
    preventZoom: true,
    ...props,
  }),

  // Ghost action buttons
  ghostAction: (props: Partial<TherapeuticButtonProps>) => ({
    variant: 'therapeutic-ghost' as const,
    size: 'sm' as const,
    animation: 'hover' as const,
    ...props,
  }),

  // Destructive confirmation
  destructive: (props: Partial<TherapeuticButtonProps>) => ({
    variant: 'destructive' as const,
    size: 'default' as const,
    therapeuticFeedback: true,
    ...props,
  }),

  // Add/remove buttons
  addButton: (props: Partial<TherapeuticButtonProps>) => ({
    variant: 'outline' as const,
    size: 'default' as const,
    className: 'border-dashed',
    ...props,
  }),

  removeButton: (props: Partial<TherapeuticButtonProps>) => ({
    variant: 'action-destructive' as const,
    size: 'sm' as const,
    animation: 'hover' as const,
    ...props,
  }),
} as const;

export { TherapeuticButton, therapeuticButtonVariants };

// Additional CSS classes for integration with globals.css
export const therapeuticButtonClasses = {
  // shimmer-button removed

  'gradient-animation': `
    bg-gradient-to-r from-primary via-accent to-primary bg-size-200 bg-pos-0
    hover:bg-pos-100 transition-all duration-500
  `,

  'therapeutic-feedback': `
    active:scale-95 active:shadow-inner transition-all duration-150
    hover:shadow-lg hover:-translate-y-0.5
  `,

  'mobile-optimized-button': `
    min-height: 44px touch-manipulation
    active:scale-98 transition-transform duration-150
  `,

  'glow-effect': `
    hover:shadow-primary/25 hover:shadow-2xl transition-shadow duration-300
  `,

  'progress-button': `
    relative overflow-hidden
  `,
} as const;
