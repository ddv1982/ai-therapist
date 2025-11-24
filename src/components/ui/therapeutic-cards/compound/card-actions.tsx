'use client';

import { Button } from '@/components/ui/button';
import type { CardAction } from '../base/card-types';

export interface CardActionsProps {
  actions?: CardAction[];
}

/**
 * Card actions compound component
 * Renders secondary action buttons
 */
export function CardActions({ actions = [] }: CardActionsProps) {
  if (actions.length === 0) return null;

  return (
    <>
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'ghost'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className="h-8 px-2"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </>
  );
}
