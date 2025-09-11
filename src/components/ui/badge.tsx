import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-1 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Therapeutic variants
        accent: "border-transparent bg-accent text-accent-foreground shadow hover:bg-accent/80",
        success: "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80",
        warning: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80",
        info: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-500/80",
        therapy: "border-transparent bg-gradient-to-r from-primary to-accent text-white shadow-md",
      },
      size: {
        default: "h-6 px-1 text-sm",
        sm: "h-4 px-1.5 text-[10px]",
        lg: "h-6 px-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };