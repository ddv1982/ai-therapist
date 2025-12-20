import { type Ref } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  ref?: Ref<React.ElementRef<typeof TabsPrimitive.List>>;
}

function TabsList({ className, ref, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'bg-muted/50 text-muted-foreground inline-flex h-11 items-center justify-center rounded-lg p-1 backdrop-blur-sm',
        className
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  ref?: Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>;
}

function TabsTrigger({ className, ref, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-fast focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-apple-sm',
        className
      )}
      {...props}
    />
  );
}

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  ref?: Ref<React.ElementRef<typeof TabsPrimitive.Content>>;
}

function TabsContent({ className, ref, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
