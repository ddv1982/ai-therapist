'use client';

import * as React from 'react';
import { type Ref } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils/index';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  ref?: Ref<React.ElementRef<typeof SelectPrimitive.Trigger>>;
}

function SelectTrigger({ className, children, ref, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        // Apple-style select trigger
        'flex h-12 w-full items-center justify-between rounded-md border px-4 py-3 text-base whitespace-nowrap',
        'border-border bg-background text-foreground',
        'data-[placeholder]:text-muted-foreground',
        // Focus state with Apple-style glow
        'focus:ring-primary focus:border-primary focus:ring-2 focus:outline-none',
        // Smooth transitions
        'duration-fast ease-out-smooth transition-all',
        'shadow-apple-sm focus:shadow-apple-md',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&>span]:line-clamp-1',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="duration-fast h-4 w-4 opacity-50 transition-transform" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

interface SelectScrollUpButtonProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> {
  ref?: Ref<React.ElementRef<typeof SelectPrimitive.ScrollUpButton>>;
}

function SelectScrollUpButton({ className, ref, ...props }: SelectScrollUpButtonProps) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

interface SelectScrollDownButtonProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> {
  ref?: Ref<React.ElementRef<typeof SelectPrimitive.ScrollDownButton>>;
}

function SelectScrollDownButton({ className, ref, ...props }: SelectScrollDownButtonProps) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  ref?: Ref<React.ElementRef<typeof SelectPrimitive.Content>>;
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ref,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          // Apple-style dropdown with rounded corners
          'relative z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-lg border',
          'max-h-[--radix-select-content-available-height] origin-[--radix-select-content-transform-origin]',
          'bg-popover text-popover-foreground',
          // Apple-style shadow
          'shadow-apple-lg',
          // Spring animations
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

interface SelectLabelProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {
  ref?: Ref<React.ElementRef<typeof SelectPrimitive.Label>>;
}

function SelectLabel({ className, ref, ...props }: SelectLabelProps) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn('px-2 py-1.5 text-sm font-semibold', className)}
      {...props}
    />
  );
}

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  ref?: Ref<React.ElementRef<typeof SelectPrimitive.Item>>;
}

function SelectItem({ className, children, ref, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        // Apple-style select item with smooth transitions
        'relative flex w-full cursor-default items-center rounded-md py-2 pr-8 pl-3 text-base outline-none select-none',
        'focus:bg-accent focus:text-accent-foreground',
        'duration-fast ease-out-smooth transition-colors',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

interface SelectSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {
  ref?: Ref<React.ElementRef<typeof SelectPrimitive.Separator>>;
}

function SelectSeparator({ className, ref, ...props }: SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('bg-muted -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
