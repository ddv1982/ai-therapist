import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/index';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-semibold transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96]',
  {
    variants: {
      variant: {
        // 10% - Primary CTA (accent color usage) - Apple-style with colored shadow
        default:
          'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-apple-primary hover:shadow-apple-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-fast ease-out-smooth',
        // 30% - Secondary actions (neutral with accent hover)
        secondary:
          'bg-background text-foreground border border-border shadow-apple-xs hover:shadow-apple-sm hover:bg-accent hover:text-accent-foreground transition-all duration-fast ease-out-smooth',
        // 60% - Ghost/minimal (neutral backgrounds)
        ghost:
          'shadow-apple-xs hover:shadow-apple-sm hover:bg-muted hover:text-foreground transition-all duration-fast',
        // Glass variant - Apple frosted glass effect
        glass:
          'bg-glass-white backdrop-blur-glass backdrop-saturate-glass border border-glass-border text-foreground shadow-apple-md hover:shadow-apple-lg hover:bg-glass-white/90 transition-all duration-base ease-out-smooth',
        // Special cases
        destructive:
          'bg-destructive text-destructive-foreground shadow-apple-xs hover:shadow-apple-sm hover:bg-destructive/90 transition-all duration-fast ease-out-smooth',
        outline:
          'border border-input bg-background shadow-apple-xs hover:shadow-apple-sm hover:bg-accent hover:text-accent-foreground transition-all duration-fast ease-out-smooth',
        link: 'text-primary underline-offset-4 hover:underline transition-colors duration-fast',
      },
      size: {
        // 8pt grid compliant sizes with min touch target 44px (iOS guideline)
        default: 'h-12 px-4 py-2', // 48px height - divisible by 8, > 44px
        sm: 'h-8 rounded-md px-3', // 32px height - divisible by 8
        lg: 'h-16 rounded-md px-8', // 64px height - divisible by 8
        icon: 'h-12 w-12', // 48px - divisible by 8, > 44px touch target
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
