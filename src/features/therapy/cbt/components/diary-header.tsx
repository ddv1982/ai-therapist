import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import {useTranslations} from 'next-intl';
import { getStepInfo } from '@/features/therapy/cbt/utils/step-mapping';
import type { CBTStep } from '@/features/therapy/cbt/hooks/use-cbt-chat-experience';

interface DiaryHeaderProps {
  isMobile: boolean;
  isCBTActive: boolean;
  cbtCurrentStep: CBTStep;
  onBack: () => void;
}

export function DiaryHeader({ isMobile, isCBTActive, cbtCurrentStep, onBack }: DiaryHeaderProps) {
  const t = useTranslations('cbt');

  if (isMobile) {
    return (
      <div className="border-b bg-card/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={cn("flex items-center gap-1 h-8 px-2")}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{t('nav.back')}</span>
            </Button>
            {isCBTActive && cbtCurrentStep !== 'complete' && (
              <span className="text-xs text-primary">
                Step {getStepInfo(cbtCurrentStep).stepNumber}/{getStepInfo(cbtCurrentStep).totalSteps}
              </span>
            )}
          </div>
          {isCBTActive && cbtCurrentStep !== 'complete' && (
            <div className="w-full bg-muted rounded-full h-1 mt-2">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(getStepInfo(cbtCurrentStep).stepNumber / getStepInfo(cbtCurrentStep).totalSteps) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.backToChat')}</span>
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold">
                  Interactive CBT Session
                </h1>
                {isCBTActive && cbtCurrentStep !== 'complete' && (
                  <p className="text-sm text-muted-foreground capitalize mt-1">
                    {cbtCurrentStep.replace('-', ' ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiaryHeader;
