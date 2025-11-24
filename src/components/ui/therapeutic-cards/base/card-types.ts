import { ReactNode } from 'react';

// Unified interface that consolidates all card patterns
export interface TherapeuticBaseCardProps {
  // Content and layout
  title?: ReactNode;
  subtitle?: ReactNode;
  content?: ReactNode;
  children?: ReactNode;

  // Visual variants
  variant?: 'default' | 'therapeutic' | 'modal' | 'compact' | 'interactive' | 'cbt-section';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Therapeutic features
  stepIndicator?: { current: number; total: number };
  statusBadge?: { text: string; variant?: 'default' | 'therapy' | 'success' | 'warning' };
  isDraftSaved?: boolean;

  // Interactive features
  collapsible?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;

  // Actions
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: ReactNode;
  secondaryActions?: CardAction[];

  // Animation and styling
  animationDelay?: number;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;

  // Layout options
  headerLayout?: 'default' | 'centered' | 'split' | 'minimal';
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';

  // CBT-specific props
  emotionColor?: string;
  progressPercentage?: number;

  // Responsive behavior
  mobileOptimized?: boolean;
  hideOnMobile?: boolean;
}

export interface CardAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'ghost' | 'outline';
}

export interface CardContextValue {
  variant: TherapeuticBaseCardProps['variant'];
  size: TherapeuticBaseCardProps['size'];
  mobileOptimized: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  onToggle?: (expanded: boolean) => void;
}
