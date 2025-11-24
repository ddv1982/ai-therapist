'use client';

import { ReactNode } from 'react';
import { CardRoot } from '@/components/ui/therapeutic-cards/compound/card-root';
import { CardHeader } from '@/components/ui/therapeutic-cards/compound/card-header';
import { CardContent } from '@/components/ui/therapeutic-cards/compound/card-content';
import { CardProgress } from '@/components/ui/therapeutic-cards/compound/card-progress';

export interface CBTSectionCardProps {
  title: string;
  subtitle?: string;
  stepIndicator?: { current: number; total: number };
  progressPercentage?: number;
  children: ReactNode;
  className?: string;
}

/**
 * Specialized card for CBT sections
 * Pre-configured with CBT styling and features
 */
export function CBTSectionCard({
  title,
  subtitle,
  stepIndicator,
  progressPercentage,
  children,
  className,
}: CBTSectionCardProps) {
  return (
    <CardRoot variant="cbt-section" size="full" mobileOptimized={true} className={className}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        stepIndicator={stepIndicator}
        headerLayout="default"
      />

      {progressPercentage !== undefined && <CardProgress value={progressPercentage} />}

      <CardContent contentPadding="lg">{children}</CardContent>
    </CardRoot>
  );
}
