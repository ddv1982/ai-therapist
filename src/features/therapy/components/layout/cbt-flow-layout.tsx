'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TherapeuticLayout, TherapeuticLayoutProps } from '@/components/ui/therapeutic-layouts';

interface CBTFlowLayoutProps extends Omit<TherapeuticLayoutProps, 'layout' | 'variant'> {
  currentStep?: number;
  totalSteps?: number;
  children: ReactNode;
}

/**
 * Specialized layout for CBT exercise flows.
 * Includes step indicators and optimized spacing for forms.
 */
export function CBTFlowLayout({
  children,
  currentStep,
  totalSteps,
  className,
  ...props
}: CBTFlowLayoutProps) {
  return (
    <TherapeuticLayout
      layout="cbt-flow"
      variant="cbt"
      typography="therapeutic"
      spacing="therapeutic"
      responsive={true}
      animated={true}
      staggerChildren={true}
      maxWidth="4xl"
      centerContent={true}
      className={cn('py-8', className)}
      {...props}
    >
      {currentStep && totalSteps && (
        <div className="mb-8 flex justify-center">
          <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      )}
      <div className="relative">{children}</div>
    </TherapeuticLayout>
  );
}
