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
    <div className="bg-muted/30 border-b">
      <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-foreground text-sm font-semibold">
            {t('progress.step', { current: stepNumber, total: totalSteps })}
          </span>
          <span className="text-muted-foreground text-sm">
            {t('progress.complete', { percent })}
          </span>
        </div>
        <div className="bg-muted h-2 w-full rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        {!isMobile && (
          <div className="text-muted-foreground mt-1 flex justify-between text-sm">
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
