import { ReactNode } from 'react';

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
