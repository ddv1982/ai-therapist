'use client';

import { ReactNode } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Modal footer compound component
 * Wraps footer content with proper styling
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <>
      {/* Dialog footer */}
      <DialogFooter className={cn(className)}>{children}</DialogFooter>

      {/* Sheet footer (border-top styling) */}
      <div className={cn('border-t pt-4', className)}>{children}</div>
    </>
  );
}
