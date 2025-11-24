'use client';

import { ReactNode } from 'react';
import { TherapeuticLayout } from '@/components/ui/therapeutic-layouts';

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Modal content compound component
 * Wraps content with therapeutic layout
 */
export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <TherapeuticLayout layout="stack" spacing="md" padding="none" className={className}>
      {children}
    </TherapeuticLayout>
  );
}
