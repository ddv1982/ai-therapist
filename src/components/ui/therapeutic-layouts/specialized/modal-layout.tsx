'use client';

import { ReactNode } from 'react';
import { TherapeuticLayout } from '@/components/ui/therapeutic-layouts/base/therapeutic-layout';
import type { TherapeuticLayoutProps } from '../base/layout-types';

export interface ModalLayoutProps extends TherapeuticLayoutProps {
  title?: ReactNode;
}

/**
 * Specialized layout for modal content
 * Provides consistent styling for dialog and modal components
 */
export function ModalLayout({
  children,
  title,
  className,
  ...props
}: ModalLayoutProps) {
  return (
    <TherapeuticLayout
      layout="modal"
      variant="modal"
      typography="modal"
      padding="lg"
      background="modal"
      shadow="lg"
      maxWidth="2xl"
      className={className}
      {...props}
    >
      {title && (
        <div className="border-border border-b pb-6 text-center">
          <h2 className="text-3xl font-semibold">{title}</h2>
        </div>
      )}
      {children}
    </TherapeuticLayout>
  );
}
