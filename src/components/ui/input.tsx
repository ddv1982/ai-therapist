import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary duration-fast ease-out-smooth transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-apple-sm focus-visible:shadow-apple-md',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
      },
      size: {
        default: 'h-12 px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

/**
 * Standard Input Component
 * Uses CVA for consistent variant and size management.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(inputVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input, inputVariants };
