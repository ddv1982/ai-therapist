import { type Ref } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

function Input({ className, type, ref, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        // Base styles with Apple-inspired design
        'flex h-12 w-full rounded-md border px-4 py-3 text-base',
        // Colors and backgrounds
        'border-border bg-background text-foreground',
        'placeholder:text-muted-foreground',
        // Focus state with Apple-style glow (no ring-offset to avoid white line)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'focus-visible:border-primary',
        // Smooth transitions (Apple spring physics)
        'transition-all duration-fast ease-out-smooth',
        // File input styling
        'file:border-0 file:bg-transparent file:text-sm file:font-semibold',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Shadow for depth (subtle Apple style)
        'shadow-apple-sm focus-visible:shadow-apple-md',
        className
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Input };
