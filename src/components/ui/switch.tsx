import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // iOS-inspired switch (Apple style)
      'peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
      // Colors with smooth gradient
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
      // Smooth transitions with Apple spring physics
      'transition-all duration-base ease-out-smooth',
      // Focus state
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      // Disabled state
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Apple-style thumb with shadow
        'pointer-events-none block h-7 w-7 rounded-full ring-0',
        'bg-background shadow-apple-md',
        // Smooth slide animation with spring physics
        'transition-transform duration-base ease-spring',
        'data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
