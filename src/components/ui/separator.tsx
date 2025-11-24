import { type Ref } from 'react';
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

interface SeparatorProps extends VariantProps<typeof separatorVariants> {
  ref?: Ref<React.ElementRef<typeof SeparatorPrimitive.Root>>;
  className?: string;
  decorative?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  variant,
  spacing,
  ref,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(separatorVariants({ orientation, variant, spacing }), className)}
      {...props}
    />
  );
}

export { Separator, separatorVariants };
