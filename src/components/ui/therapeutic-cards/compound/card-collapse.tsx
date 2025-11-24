'use client';

import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCardContext } from '@/components/ui/therapeutic-cards/compound/card-root';

export interface CardCollapseProps {
  className?: string;
}

/**
 * Card collapse compound component
 * Toggles card expand/collapse state
 */
export function CardCollapse({ className }: CardCollapseProps) {
  const { isExpanded, setIsExpanded, onToggle } = useCardContext();

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleToggle();
      }}
      className={`h-8 w-8 p-0 ${className || ''}`}
    >
      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </Button>
  );
}
