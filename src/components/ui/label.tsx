'use client';

import { type Ref } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/index';

const labelVariants = cva(
  'text-sm font-semibold leading-none tracking-wide peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  ref?: Ref<React.ElementRef<typeof LabelPrimitive.Root>>;
}

function Label({ className, ref, ...props }: LabelProps) {
  return <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />;
}

export { Label };
