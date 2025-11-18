import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { getStepInfo } from '@/features/therapy/cbt/utils/step-mapping';
import type { CBTStepType } from '@/types';

interface DiaryHeaderProps {
  isMobile: boolean;
  isCBTActive: boolean;
  cbtCurrentStep: CBTStepType;
  onBack: () => void;
}

export function DiaryHeader({ isMobile, isCBTActive, cbtCurrentStep, onBack }: DiaryHeaderProps) {
  const t = useTranslations('cbt');

  if (isMobile) {
    return (
      <div className="bg-card/70 sticky top-0 z-10 border-b backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={cn('flex h-8 items-center gap-1 px-2')}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">{t('nav.back')}</span>
            </Button>
            {isCBTActive && cbtCurrentStep !== 'complete' && (
              <span className="text-primary text-xs">
                Step {getStepInfo(cbtCurrentStep).stepNumber}/
                {getStepInfo(cbtCurrentStep).totalSteps}
              </span>
            )}
          </div>
          {isCBTActive && cbtCurrentStep !== 'complete' && (
            <div className="bg-muted mt-2 h-1 w-full rounded-full">
              <div
                className="bg-primary h-1 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(getStepInfo(cbtCurrentStep).stepNumber / getStepInfo(cbtCurrentStep).totalSteps) * 100}%`,
                }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/50 sticky top-0 z-10 border-b backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.backToChat')}</span>
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl shadow-lg">
                <Brain className="text-primary-foreground h-6 w-6" />
              </div>
              <h1 className="text-3xl font-semibold">Interactive CBT Session</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiaryHeader;
