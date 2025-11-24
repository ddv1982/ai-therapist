import { ReactNode } from 'react';

// Unified interface for all modal patterns
export interface TherapeuticModalProps {
  // Trigger and state
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Content
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;

  // Modal type and behavior
  type?: 'dialog' | 'sheet' | 'fullscreen' | 'auto'; // Auto uses sheet on mobile
  variant?: 'default' | 'therapeutic' | 'cbt-flow' | 'report' | 'confirm';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Actions
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  actions?: ModalAction[];

  // Modal-specific features
  preventClose?: boolean;
  hideCloseButton?: boolean;
  showProgress?: boolean;
  progressValue?: number;

  // Therapeutic features
  stepIndicator?: { current: number; total: number };
  therapeuticIcon?: ReactNode;

  // Mobile optimization
  mobileOptimized?: boolean;
  mobileAsSheet?: boolean;

  // Styling
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;

  // Accessibility
  role?: string;
  ariaLabel?: string;

  // Event handlers
  onClose?: () => void;
}

export interface ModalAction {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: string;
}

export interface ModalContextValue {
  variant: TherapeuticModalProps['variant'];
  size: TherapeuticModalProps['size'];
  mobileOptimized: boolean;
  onClose?: () => void;
}
