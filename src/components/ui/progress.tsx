'use client';

import { type Ref } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils/index';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  ref?: Ref<React.ElementRef<typeof ProgressPrimitive.Root>>;
}

function Progress({ className, value, ref, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('bg-muted relative h-2 w-full overflow-hidden rounded-full shadow-inner', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="from-primary to-accent h-full w-full flex-1 bg-gradient-to-r transition-all duration-base ease-out-smooth"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
