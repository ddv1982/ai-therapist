import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const separatorVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'h-[1px] w-full',
      vertical: 'h-full w-[1px]',
    },
    variant: {
      default: 'bg-border',
      muted: 'bg-muted',
      accent: 'bg-accent',
      therapy: 'bg-gradient-to-r from-primary/20 via-accent/40 to-primary/20',
    },
    spacing: {
      none: '',
      sm: 'my-therapy-xs',
      md: 'my-therapy-sm',
      lg: 'my-therapy-md',
      xl: 'my-therapy-lg',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
    spacing: 'md',
  },
});

interface SeparatorProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>, 'orientation'>,
    VariantProps<typeof separatorVariants> {}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    { className, orientation = 'horizontal', decorative = true, variant, spacing, ...props },
    ref
  ) => {
    const resolvedOrientation = orientation ?? 'horizontal';

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={resolvedOrientation}
        className={cn(
          separatorVariants({ orientation: resolvedOrientation, variant, spacing }),
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator, separatorVariants };
