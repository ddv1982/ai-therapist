'use client';

import { TherapeuticLayout } from '@/components/ui/therapeutic-layouts/base/therapeutic-layout';
import type { TherapeuticLayoutProps } from '../base/layout-types';

/**
 * Specialized responsive grid layout
 * Automatically adjusts columns based on screen size with staggered animations
 */
export function ResponsiveGrid({
  children,
  columns = 'responsive',
  className,
  ...props
}: TherapeuticLayoutProps) {
  return (
    <TherapeuticLayout
      layout="grid"
      columns={columns}
      gap="md"
      responsive={true}
      staggerChildren={true}
      className={className}
      {...props}
    >
      {children}
    </TherapeuticLayout>
  );
}
