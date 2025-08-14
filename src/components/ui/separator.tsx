import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const separatorVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "h-[1px] w-full",
      vertical: "h-full w-[1px]",
    },
    variant: {
      default: "bg-border",
      muted: "bg-muted",
      accent: "bg-accent",
      therapy: "bg-gradient-to-r from-primary/20 via-accent/40 to-primary/20",
    },
    spacing: {
      none: "",
      sm: "my-therapy-xs",
      md: "my-therapy-sm",
      lg: "my-therapy-md",
      xl: "my-therapy-lg",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    variant: "default",
    spacing: "md",
  },
});

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> &
    VariantProps<typeof separatorVariants>
>(
  (
    { className, orientation = "horizontal", decorative = true, variant, spacing, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(separatorVariants({ orientation, variant, spacing }), className)}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator, separatorVariants };