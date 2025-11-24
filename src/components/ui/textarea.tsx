import { type Ref } from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  placeholder?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

function Textarea({ className, ref, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        // Apple-style textarea matching Input component
        'flex min-h-[96px] w-full rounded-md border px-4 py-3 text-base',
        'border-border bg-background text-foreground',
        'placeholder:text-muted-foreground',
        // Focus state with Apple-style glow (no ring-offset to avoid white line)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'focus-visible:border-primary',
        // Smooth transitions
        'transition-all duration-fast ease-out-smooth',
        'shadow-apple-sm focus-visible:shadow-apple-md',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Resize handle styling
        'resize-y',
        className
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Textarea };
