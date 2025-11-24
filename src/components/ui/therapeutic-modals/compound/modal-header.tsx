'use client';

import { ReactNode } from 'react';
import { DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { SheetHeader, SheetDescription } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModalContext } from '@/components/ui/therapeutic-modals/compound/modal-root';

export interface ModalHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  therapeuticIcon?: ReactNode;
  stepIndicator?: { current: number; total: number };
  showProgress?: boolean;
  progressValue?: number;
  hideCloseButton?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Modal header compound component
 * Displays title, subtitle, step indicators, and progress
 */
export function ModalHeader({
  title,
  subtitle,
  description,
  therapeuticIcon,
  stepIndicator,
  showProgress = false,
  progressValue = 0,
  hideCloseButton = false,
  className,
  children,
}: ModalHeaderProps) {
  const { variant, onClose } = useModalContext();

  const headerContent = (
    <>
      {/* Step indicator */}
      {stepIndicator && (
        <div className="mb-4 flex justify-center">
          <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            <span>
              Step {stepIndicator.current} of {stepIndicator.total}
            </span>
          </div>
        </div>
      )}

      {/* Title with therapeutic icon */}
      <div className="flex items-center gap-3">
        {therapeuticIcon && <div className="shrink-0">{therapeuticIcon}</div>}
        <div className="flex-1">
          {title && (
            <h2
              className={cn(
                'text-xl font-semibold',
                variant === 'therapeutic' && 'text-primary',
                variant === 'cbt-flow' && 'text-xl'
              )}
            >
              {title}
            </h2>
          )}
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="bg-muted mt-4 h-2 w-full overflow-hidden rounded-full">
          <div
            className="from-primary to-accent h-full bg-linear-to-r transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progressValue))}%` }}
          />
        </div>
      )}

      {/* Custom children */}
      {children}
    </>
  );

  // Custom close button for therapeutic variants
  const closeButton = !hideCloseButton && variant === 'therapeutic' && (
    <button
      onClick={onClose}
      className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );

  return (
    <>
      {closeButton}
      <DialogHeader className={cn('space-y-4', className)}>
        <SheetHeader className={cn('space-y-4', className)}>
          {headerContent}
          {description && (
            <>
              <DialogDescription className="text-left">{description}</DialogDescription>
              <SheetDescription className="text-left">{description}</SheetDescription>
            </>
          )}
        </SheetHeader>
      </DialogHeader>
    </>
  );
}
