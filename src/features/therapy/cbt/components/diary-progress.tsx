import React from 'react';
import { getStepInfo } from '@/features/therapy/cbt/utils/step-mapping';
import type { CBTStepType } from '@/types/therapy';

interface DiaryProgressProps {
  isMobile: boolean;
  isCBTActive: boolean;
  cbtCurrentStep: CBTStepType;
}

export function DiaryProgress({ isMobile, isCBTActive, cbtCurrentStep }: DiaryProgressProps) {
  if (isMobile || !isCBTActive || cbtCurrentStep === 'complete') return null;

  const { stepNumber, totalSteps } = getStepInfo(cbtCurrentStep);
  const percent = Math.round((stepNumber / totalSteps) * 100);

  return (
    <div className="border-b bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">
            Step {stepNumber} of {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {percent}% Complete
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        {!isMobile && (
          <div className="flex justify-between mt-1 text-sm text-muted-foreground">
            <span>Situation</span>
            <span>Emotions</span>
            <span>Thoughts</span>
            <span>Core Belief</span>
            <span>Challenge</span>
            <span>Rational</span>
            <span>Schema</span>
            <span>Actions</span>
            <span>Final Emotions</span>
          </div>
        )}
      </div>
    </div>
  );
}
