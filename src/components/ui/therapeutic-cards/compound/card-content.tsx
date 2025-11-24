'use client';

import { ReactNode } from 'react';
import { CardContent as BaseCardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCardContext } from '@/components/ui/therapeutic-cards/compound/card-root';

export interface CardContentProps {
  children: ReactNode;
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Card content compound component
 * Wraps content with proper spacing
 */
export function CardContent({
  children,
  contentPadding = 'md',
  className,
}: CardContentProps) {
  const { variant, isExpanded } = useCardContext();

  const contentPaddingVariants = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  // Don't render if collapsed
  if (!isExpanded) return null;

  return (
    <BaseCardContent
      className={cn(
        'space-y-4',
        contentPaddingVariants[contentPadding],
        variant === 'compact' && 'space-y-2',
        variant === 'cbt-section' && 'space-y-6',
        className
      )}
    >
      {children}
    </BaseCardContent>
  );
}
