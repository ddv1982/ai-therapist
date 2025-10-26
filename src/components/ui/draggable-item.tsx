'use client';

import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { Grip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  onRemove?: () => void;
}

export function DraggableItem({
  id,
  children,
  className,
  onRemove,
}: DraggableItemProps) {
  return (
    <Reorder.Item value={id} id={id} className="w-full">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileDrag={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
        className={cn(
          'group relative flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing',
          className,
        )}
      >
        <Grip className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        <div className="flex-1 min-w-0">{children}</div>
        {onRemove && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
          >
            ✕
          </motion.button>
        )}
      </motion.div>
    </Reorder.Item>
  );
}

interface DraggableListProps {
  items: string[];
  onReorder: (items: string[]) => void;
  children: (item: string, index: number) => React.ReactNode;
  onRemove?: (item: string) => void;
  className?: string;
}

export function DraggableList({
  items,
  onReorder,
  children,
  onRemove,
  className,
}: DraggableListProps) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn('space-y-3 w-full', className)}
    >
      {items.map((item, index) => (
        <DraggableItem
          key={item}
          id={item}
          onRemove={() => onRemove?.(item)}
        >
          {children(item, index)}
        </DraggableItem>
      ))}
    </Reorder.Group>
  );
}
