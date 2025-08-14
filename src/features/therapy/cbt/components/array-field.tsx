'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface ArrayFieldProps<T = unknown> {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number, onChange: (index: number, field: string, value: unknown) => void) => React.ReactNode;
  addButtonText: string;
  emptyMessage: string;
  maxItems?: number;
}

export const ArrayField = <T,>({ 
  items, 
  onAdd, 
  onRemove, 
  renderItem, 
  addButtonText, 
  emptyMessage,
  maxItems = 10 
}: ArrayFieldProps<T>) => {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 italic">
          {emptyMessage}
        </p>
      ) : (
        items.map((item, index) => (
          <div key={index} className="relative p-4 border border-border/30 rounded-lg bg-card/50">
            {renderItem(item, index, () => {})}
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Minus className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))
      )}
      
      {items.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full h-12 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {addButtonText}
        </Button>
      )}
    </div>
  );
};