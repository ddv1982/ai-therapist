'use client';

import { type Ref } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils/index';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Overlay>>;
}

function DialogOverlay({ className, ref, ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        // Apple-style backdrop with glassmorphism
        'fixed inset-0 z-50',
        'bg-black/40',
        'backdrop-blur-[12px] backdrop-saturate-[120%]',
        // Smooth fade animations
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'duration-base ease-smooth transition-all',
        className
      )}
      {...props}
    />
  );
}

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Content>>;
}

function DialogContent({ className, children, ref, ...props }: DialogContentProps) {
  const t = useTranslations('ui');

  // Note: Radix UI Dialog already implements WCAG 2.1 AA compliant focus management:
  // - Automatic focus trap when modal opens
  // - Focus returns to trigger element on close
  // - Escape key closes the dialog
  // - Tab/Shift+Tab cycles through focusable elements within the modal
  //
  // Our useFocusTrap hook provides additional customization and explicit
  // focus management for complex scenarios, but Radix handles the basics.

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Position and layout
          'fixed top-[50%] left-[50%] z-50',
          'grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
          'gap-4 p-6',
          // Apple-style appearance
          'bg-background border-border border',
          'rounded-2xl', // 16px rounded corners (Apple style)
          'shadow-apple-xl',
          // Spring animations (Apple physics)
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
          'duration-base ease-out-smooth',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="hover:bg-muted focus:ring-ring duration-fast ease-out-smooth absolute top-4 right-4 rounded-md p-1.5 opacity-70 transition-all hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
          <X className="h-5 w-5" />
          <span className="sr-only">{t('close')}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

interface DialogTitleProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Title>>;
}

function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-xl leading-none font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

interface DialogDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {
  ref?: Ref<React.ElementRef<typeof DialogPrimitive.Description>>;
}

function DialogDescription({ className, ref, ...props }: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
