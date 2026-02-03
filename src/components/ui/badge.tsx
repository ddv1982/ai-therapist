import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-apple-sm hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-apple-sm hover:bg-destructive/80',
        outline: 'text-foreground border-border bg-transparent',
        // Therapeutic variants using CSS tokens
        accent:
          'border-transparent bg-accent text-accent-foreground shadow-apple-sm hover:bg-accent/80',
        success:
          'border-transparent bg-therapy-success text-white shadow-apple-sm hover:opacity-90',
        warning:
          'border-transparent bg-therapy-warning text-white shadow-apple-sm hover:opacity-90',
        info: 'border-transparent bg-therapy-info text-white shadow-apple-sm hover:opacity-90',
        therapy:
          'border-transparent bg-gradient-to-r from-primary to-accent text-white shadow-apple-md',
      },
      size: {
        default: 'h-6 px-2 text-xs',
        sm: 'h-5 px-2 text-[10px]',
        lg: 'h-7 px-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge };
