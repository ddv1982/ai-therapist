import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'flex w-full rounded-md border text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary duration-fast ease-out-smooth transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-apple-sm focus-visible:shadow-apple-md resize-y',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
      },
      size: {
        default: 'min-h-[96px] px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface TextareaProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {}

/**
 * Standard Textarea Component
 * Uses CVA for consistency with Input component.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, ...props }, ref) => (
    <textarea className={cn(textareaVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
