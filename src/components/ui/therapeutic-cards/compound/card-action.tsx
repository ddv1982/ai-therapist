'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useCardContext } from '@/components/ui/therapeutic-cards/compound/card-root';

export interface CardActionProps {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * Card action compound component
 * Primary action button for interactive cards
 */
export function CardAction({ onClick, label, icon, className }: CardActionProps) {
  const { variant } = useCardContext();

  if (variant !== 'interactive') return null;

  return (
    <div className="p-4 pt-0">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`w-full ${className || ''}`}
      >
        {icon}
        {label}
      </Button>
    </div>
  );
}
