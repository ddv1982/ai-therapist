"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    avoidCollisions?: boolean
    collisionPadding?: number | Partial<Record<"top" | "bottom" | "left" | "right", number>>
  }
>(({ className, align = "center", side = "bottom", sideOffset = 4, avoidCollisions = true, collisionPadding = 8, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      side={side}
      align={align}
      sideOffset={sideOffset}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      className={cn(
        // DS: Minimal motion, soft shadow, rounded corners
        "z-50 w-72 md:w-[360px] rounded-lg border bg-popover p-2 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }