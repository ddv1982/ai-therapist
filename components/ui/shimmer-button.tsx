import React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends ButtonProps {
  shimmerColor?: string;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ children, className, shimmerColor = "via-white/20 dark:via-white/10", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("relative overflow-hidden group", className)}
        {...props}
      >
        {/* Shimmer effect */}
        <div className={cn(
          "absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent to-transparent",
          shimmerColor
        )} />
        
        {/* Content with z-index to stay above shimmer */}
        <div className="relative z-10 flex items-center justify-center gap-2 w-full">
          {children}
        </div>
      </Button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';