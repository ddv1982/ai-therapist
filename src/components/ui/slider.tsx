import { type Ref } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  ref?: Ref<React.ElementRef<typeof SliderPrimitive.Root>>;
}

function Slider({ className, ref, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="from-primary to-accent absolute h-full bg-gradient-to-r" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="border-border bg-background shadow-apple-md block h-6 w-6 rounded-full border transition-all duration-fast hover:scale-105 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
