'use client';

import { memo, createContext, useContext } from 'react';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { TherapeuticModalProps, ModalContextValue } from '../base/modal-types';
import { sizeClasses, variantClasses } from '../base/modal-config';

// Context for compound components
const ModalContext = createContext<ModalContextValue | null>(null);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within TherapeuticModal');
  }
  return context;
};

/**
 * Root modal component - handles Dialog vs Sheet logic
 * Part of Compound Components pattern
 */
const ModalRootComponent = function ModalRoot({
  trigger,
  open,
  onOpenChange,
  children,
  type = 'auto',
  variant = 'default',
  size = 'md',
  preventClose = false,
  mobileOptimized = true,
  mobileAsSheet = true,
  contentClassName,
  role,
  ariaLabel,
  onClose,
  ...props
}: TherapeuticModalProps) {
  // Determine which component to use
  const useSheet =
    type === 'sheet' ||
    (type === 'auto' && mobileOptimized && mobileAsSheet) ||
    type === 'fullscreen';

  // Handle close events
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !preventClose) {
      onClose?.();
    }
    onOpenChange?.(isOpen);
  };

  const contextValue: ModalContextValue = {
    variant,
    size,
    mobileOptimized,
    onClose: () => handleOpenChange(false),
  };

  // Sheet implementation for mobile
  if (useSheet) {
    return (
      <ModalContext value={contextValue}>
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
            {children}
          </SheetContent>
        </Sheet>
      </ModalContext>
    );
  }

  // Dialog implementation for desktop
  return (
    <ModalContext value={contextValue}>
      <Dialog open={open} onOpenChange={handleOpenChange} {...props}>
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
          {children}
        </DialogContent>
      </Dialog>
    </ModalContext>
  );
};

export const ModalRoot = memo(ModalRootComponent);
