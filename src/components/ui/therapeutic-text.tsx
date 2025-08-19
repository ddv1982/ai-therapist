/**
 * Therapeutic Text Component
 * 
 * A wrapper component that applies enhanced typography and layout
 * for therapeutic content including better text wrapping, list formatting,
 * and readability improvements.
 */

import React from 'react';
import { cn } from '@/lib/utils/utils';

interface TherapeuticTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'technique' | 'collaborative' | 'exposure';
}

export function TherapeuticText({ 
  children, 
  className,
  variant = 'default' 
}: TherapeuticTextProps) {
  const variantClasses = {
    default: 'therapeutic-content',
    technique: 'therapeutic-content therapeutic-technique',
    collaborative: 'therapeutic-content collaborative-content',
    exposure: 'therapeutic-content exposure-technique'
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  );
}

/**
 * Therapeutic Term Component
 * For highlighting important therapeutic terms with proper text wrapping
 */
interface TherapeuticTermProps {
  term: string;
  definition?: string;
  className?: string;
}

export function TherapeuticTerm({ 
  term, 
  definition, 
  className 
}: TherapeuticTermProps) {
  return (
    <div className={cn('therapeutic-term', className)}>
      <span className="technique-name">{term}</span>
      {definition && (
        <div className="therapeutic-definition">{definition}</div>
      )}
    </div>
  );
}

export default TherapeuticText;