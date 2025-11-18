'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TherapeuticLayout, TherapeuticLayoutProps } from '@/components/ui/therapeutic-layout';

interface ModalLayoutProps extends Omit<TherapeuticLayoutProps, 'layout' | 'variant'> {
  title?: ReactNode;
  children: ReactNode;
}

/**
 * Specialized layout for modal content.
 * Handles headers, padding, and contained scrolling.
 */
export function ModalLayout({ children, title, className, ...props }: ModalLayoutProps) {
  return (
    <TherapeuticLayout
      layout="modal"
      variant="modal"
      typography="modal"
      padding="lg"
      background="modal"
      shadow="none"
      maxWidth="2xl"
      className={cn('h-full overflow-y-auto md:h-auto md:max-h-[85vh]', className)}
      {...props}
    >
      {title && (
        <div className="border-border sticky top-0 z-10 border-b bg-inherit pb-4 pt-2">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
      )}
      <div className="mt-4">{children}</div>
    </TherapeuticLayout>
  );
}
