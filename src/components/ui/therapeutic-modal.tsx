'use client';

import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TherapeuticButton } from './therapeutic-button';
import { TherapeuticLayout } from './therapeutic-layout';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: string;
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: string;
    loading?: boolean;
    disabled?: boolean;
  }>;
  
  // Modal-specific features
  preventClose?: boolean; // Prevent closing via escape/backdrop
  hideCloseButton?: boolean;
  showProgress?: boolean;
  progressValue?: number;
  
  // Therapeutic features
  stepIndicator?: { current: number; total: number };
  therapeuticIcon?: ReactNode;
  
  // Mobile optimization
  mobileOptimized?: boolean;
  mobileAsSheet?: boolean; // Force sheet on mobile
  
  // Styling
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  
  // Accessibility
  role?: string;
  ariaLabel?: string;
  
  // Event handlers
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Unified therapeutic modal component that consolidates all modal patterns
 * Replaces: Dialog, Sheet, SessionReportModal, MobileCBTSheet (TherapyFlowModal deleted)
 * 
 * Features:
 * - Auto-responsive (dialog on desktop, sheet on mobile)
 * - Multiple therapeutic variants
 * - Built-in action buttons and progress indicators
 * - Step indicators for CBT flows
 * - Mobile optimization
 * - Consistent therapeutic styling
 */
export function TherapeuticModal({
  trigger,
  open,
  onOpenChange,
  title,
  subtitle,
  description,
  children,
  type = 'auto',
  variant = 'default',
  size = 'md',
  primaryAction,
  secondaryAction,
  actions = [],
  preventClose = false,
  hideCloseButton = false,
  showProgress = false,
  progressValue = 0,
  stepIndicator,
  therapeuticIcon,
  mobileOptimized = true,
  mobileAsSheet = true,
  className: _className,
  contentClassName,
  headerClassName,
  footerClassName,
  role,
  ariaLabel,
  onClose,
  onConfirm: _onConfirm,
  onCancel: _onCancel,
  ...props
}: TherapeuticModalProps) {

  // Determine which component to use
  const useSheet = type === 'sheet' || 
                  (type === 'auto' && mobileOptimized && mobileAsSheet) ||
                  type === 'fullscreen';
  
  // Size configurations
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg', 
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  // Variant-specific styling
  const variantClasses = {
    default: '',
    therapeutic: 'therapeutic-modal',
    'cbt-flow': 'cbt-flow-modal min-h-[500px]',
    report: 'report-modal',
    confirm: 'confirm-modal'
  };

  // Handle close events
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !preventClose) {
      onClose?.();
    }
    onOpenChange?.(isOpen);
  };

  // Combined actions
  const allActions = [
    ...(primaryAction ? [{ ...primaryAction, isPrimary: true }] : []),
    ...(secondaryAction ? [{ ...secondaryAction, isSecondary: true }] : []),
    ...actions
  ];

  // Header content
  const headerContent = (
    <>
      {/* Step indicator */}
      {stepIndicator && (
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
            <span>Step {stepIndicator.current} of {stepIndicator.total}</span>
          </div>
        </div>
      )}

      {/* Title with therapeutic icon */}
      <div className="flex items-center gap-3">
        {therapeuticIcon && (
          <div className="flex-shrink-0">{therapeuticIcon}</div>
        )}
        <div className="flex-1">
          {title && (
            <h2 className={cn(
              "text-lg font-semibold",
              variant === 'therapeutic' && "text-primary",
              variant === 'cbt-flow' && "text-xl"
            )}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progressValue))}%` }}
          />
        </div>
      )}
    </>
  );

  // Footer content
  const footerContent = allActions.length > 0 && (
    <div className="flex gap-2 justify-end flex-wrap">
      {allActions.map((action, index) => (
        <TherapeuticButton
          key={index}
          variant={
            ('isPrimary' in action && action.isPrimary) ? 'therapeutic' : 
            ('isSecondary' in action && action.isSecondary) ? 'outline' :
            (action.variant as 'outline' | 'ghost' | 'destructive') || 'ghost'
          }
          onClick={action.onClick}
          loading={'loading' in action ? action.loading : false}
          disabled={'disabled' in action ? action.disabled : false}
          size={mobileOptimized ? 'mobile-touch' : 'default'}
        >
          {action.label}
        </TherapeuticButton>
      ))}
    </div>
  );

  // Sheet implementation for mobile
  if (useSheet) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange} {...props}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent
          side="bottom"
          className={cn(
            'max-h-[90vh] overflow-y-auto',
            variantClasses[variant],
            contentClassName
          )}
          role={role}
          aria-label={ariaLabel}
        >
          <SheetHeader className={cn('space-y-4', headerClassName)}>
            {headerContent}
            {description && (
              <SheetDescription className="text-left">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>

          <TherapeuticLayout
            layout="stack"
            spacing="md"
            padding="none"
            className="py-6"
          >
            {children}
          </TherapeuticLayout>

          {footerContent && (
            <div className={cn('pt-4 border-t', footerClassName)}>
              {footerContent}
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  // Dialog implementation for desktop
  return (
    <Dialog 
      open={open} 
      onOpenChange={handleOpenChange}
      {...props}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          'max-h-[90vh] overflow-y-auto',
          variant === 'cbt-flow' && 'min-h-[500px]',
          contentClassName
        )}
        role={role}
        aria-label={ariaLabel}
        onEscapeKeyDown={preventClose ? (e) => e.preventDefault() : undefined}
        onPointerDownOutside={preventClose ? (e) => e.preventDefault() : undefined}
      >
        {/* Custom close button for therapeutic variants */}
        {!hideCloseButton && variant === 'therapeutic' && (
          <button
            onClick={() => handleOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}

        <DialogHeader className={cn('space-y-4', headerClassName)}>
          {headerContent}
          {description && (
            <DialogDescription className="text-left">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <TherapeuticLayout
          layout="stack"
          spacing="md"
          padding="none"
          className="py-6"
        >
          {children}
        </TherapeuticLayout>

        {footerContent && (
          <DialogFooter className={cn(footerClassName)}>
            {footerContent}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Pre-configured modal presets for common therapeutic use cases
export const therapeuticModalPresets = {
  // CBT flow modal
  cbtFlow: (props: Partial<TherapeuticModalProps>) => ({
    variant: 'cbt-flow' as const,
    type: 'auto' as const,
    size: 'lg' as const,
    mobileOptimized: true,
    showProgress: true,
    ...props
  }),

  // Session report modal
  sessionReport: (props: Partial<TherapeuticModalProps>) => ({
    variant: 'report' as const,
    type: 'dialog' as const,
    size: 'xl' as const,
    mobileAsSheet: true,
    ...props
  }),

  // Confirmation modal
  confirmation: (props: Partial<TherapeuticModalProps>) => ({
    variant: 'confirm' as const,
    type: 'dialog' as const,
    size: 'sm' as const,
    preventClose: true,
    ...props
  }),

  // Full-screen therapeutic modal
  therapeuticFullscreen: (props: Partial<TherapeuticModalProps>) => ({
    variant: 'therapeutic' as const,
    type: 'fullscreen' as const,
    size: 'full' as const,
    mobileOptimized: true,
    ...props
  }),

  // Mobile sheet
  mobileSheet: (props: Partial<TherapeuticModalProps>) => ({
    type: 'sheet' as const,
    variant: 'default' as const,
    mobileOptimized: true,
    ...props
  })
} as const;

// Quick confirmation modal hook
export function useTherapeuticConfirm() {
  return (options: {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
  }) => {
    // Implementation would use a context provider for global modals
    // For now, return the modal props
    return {
      ...therapeuticModalPresets.confirmation({}),
      title: options.title,
      description: options.description,
      primaryAction: {
        label: options.confirmText || 'Confirm',
        onClick: options.onConfirm,
        variant: options.variant === 'destructive' ? 'destructive' : 'therapeutic'
      },
      secondaryAction: {
        label: options.cancelText || 'Cancel',
        onClick: () => {},
        variant: 'ghost'
      }
    };
  };
}

// CSS classes for integration with existing styling
export const therapeuticModalClasses = {
  'therapeutic-modal': 'bg-gradient-to-br from-background to-muted/20 border-primary/10',
  'cbt-flow-modal': 'min-h-[500px] cbt-modal-styling',
  'report-modal': 'max-w-4xl report-modal-styling',
  'confirm-modal': 'max-w-md text-center'
} as const;