'use client';

import { ReactNode } from 'react';
import { TherapeuticLayout } from '@/components/ui/therapeutic-layouts/base/therapeutic-layout';
import type { TherapeuticLayoutProps } from '../base/layout-types';

export interface TherapeuticSectionProps extends TherapeuticLayoutProps {
  title?: ReactNode;
  subtitle?: ReactNode;
}

/**
 * Specialized layout for therapeutic sections with title and subtitle
 * Common in therapy exercises and CBT modules
 */
export function TherapeuticSection({
  title,
  subtitle,
  children,
  className,
  ...props
}: TherapeuticSectionProps) {
  return (
    <TherapeuticLayout
      layout="therapeutic"
      typography="therapeutic"
      variant="therapeutic"
      padding="therapeutic"
      className={className}
      {...props}
    >
      {title && (
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-primary text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mx-auto max-w-2xl">{subtitle}</p>}
        </div>
      )}
      {children}
    </TherapeuticLayout>
  );
}
