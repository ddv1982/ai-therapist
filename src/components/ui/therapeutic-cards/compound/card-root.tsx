'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CardContextValue, TherapeuticBaseCardProps } from '../base/card-types';
import { cardVariants, sizeVariants } from '../base/card-config';

// Context for compound components
const CardContext = createContext<CardContextValue | null>(null);

export const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card compound components must be used within TherapeuticCard');
  }
  return context;
};

export interface CardRootProps {
  children: ReactNode;
  variant?: TherapeuticBaseCardProps['variant'];
  size?: TherapeuticBaseCardProps['size'];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  onAction?: () => void;
  mobileOptimized?: boolean;
  hideOnMobile?: boolean;
  emotionColor?: string;
  animationDelay?: number;
  className?: string;
}

/**
 * Root card component - provides context for compound components
 * Part of Compound Components pattern
 */
export function CardRoot({
  children,
  variant = 'default',
  size = 'md',
  collapsible: _collapsible = false,
  defaultExpanded = true,
  onToggle,
  onAction,
  mobileOptimized = true,
  hideOnMobile = false,
  emotionColor,
  animationDelay = 0,
  className,
  ...props
}: CardRootProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const contextValue: CardContextValue = {
    variant,
    size,
    mobileOptimized,
    isExpanded,
    setIsExpanded,
    onToggle,
  };

  const animationStyle = animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined;

  return (
    <CardContext value={contextValue}>
      <Card
        className={cn(
          cardVariants[variant],
          sizeVariants[size],
          'relative overflow-hidden border-0',
          variant === 'therapeutic' && 'therapeutic-card',
          variant === 'cbt-section' && 'cbt-section-card',
          hideOnMobile && 'hidden sm:block',
          mobileOptimized && 'mobile-optimized-card',
          className
        )}
        style={animationStyle}
        onClick={variant === 'interactive' ? onAction : undefined}
        {...props}
      >
        {children}

        {/* Therapeutic gradient overlay */}
        {variant === 'therapeutic' && (
          <div className="from-primary/5 to-accent/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}

        {/* CBT emotion color accent */}
        {emotionColor && (
          <div
            className="absolute top-0 bottom-0 left-0 w-1 opacity-60"
            style={{ backgroundColor: emotionColor }}
          />
        )}
      </Card>
    </CardContext>
  );
}
