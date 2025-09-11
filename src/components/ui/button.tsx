import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/index"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // 10% - Primary CTA (accent color usage) - unified gradient style
        default:
          "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:from-primary/90 hover:to-accent/90 active:from-primary/80 active:to-accent/80",
        // 30% - Secondary actions (neutral with accent hover)
        secondary:
          "bg-background text-foreground border border-border hover:bg-accent hover:text-accent-foreground",
        // 60% - Ghost/minimal (neutral backgrounds)
        ghost: "hover:bg-muted hover:text-foreground",
        // Special cases
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // 8pt grid compliant sizes
        default: "h-12 px-4 py-2", // 48px height - divisible by 8
        sm: "h-8 rounded-md px-3", // 32px height - divisible by 8
        lg: "h-16 rounded-md px-8", // 64px height - divisible by 8  
        icon: "h-12 w-12", // 48px - divisible by 8
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
