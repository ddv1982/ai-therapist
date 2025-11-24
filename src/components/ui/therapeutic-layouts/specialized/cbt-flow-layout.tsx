'use client';

import { TherapeuticLayout } from '@/components/ui/therapeutic-layouts/base/therapeutic-layout';
import type { TherapeuticLayoutProps } from '../base/layout-types';

export interface CBTFlowLayoutProps extends TherapeuticLayoutProps {
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Specialized layout for CBT exercise flows with step indicators
 * Provides visual feedback on progress through multi-step exercises
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
      responsive={true}
      className={className}
      {...props}
    >
      {currentStep && totalSteps && (
        <div className="mb-6 text-center">
          <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      )}
      {children}
    </TherapeuticLayout>
  );
}
