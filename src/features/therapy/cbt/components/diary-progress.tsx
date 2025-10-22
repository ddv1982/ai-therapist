import React from 'react';
import { useTranslations } from 'next-intl';
import { getStepInfo } from '@/features/therapy/cbt/utils/step-mapping';
import type { CBTStepType } from '@/types/therapy';

interface DiaryProgressProps {
  isMobile: boolean;
  isCBTActive: boolean;
  cbtCurrentStep: CBTStepType;
}

export function DiaryProgress({ isMobile, isCBTActive, cbtCurrentStep }: DiaryProgressProps) {
  const t = useTranslations('cbt');
  if (isMobile || !isCBTActive || cbtCurrentStep === 'complete') return null;

  const { stepNumber, totalSteps } = getStepInfo(cbtCurrentStep);
  const percent = Math.round((stepNumber / totalSteps) * 100);

  return (
    <div className="border-b bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">
            {t('progress.step', { current: stepNumber, total: totalSteps })}
          </span>
          <span className="text-sm text-muted-foreground">
            {t('progress.complete', { percent })}
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
            <span>{t('steps.situation.label')}</span>
            <span>{t('steps.emotions.label')}</span>
            <span>{t('steps.thoughts.label')}</span>
            <span>{t('steps.coreBelief.label')}</span>
            <span>{t('steps.challenge.label')}</span>
            <span>{t('steps.rational.label')}</span>
            <span>{t('steps.schema.label')}</span>
            <span>{t('steps.actions.label')}</span>
            <span>{t('steps.finalEmotions.label')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
