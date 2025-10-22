import React from 'react';
import { useTranslations } from 'next-intl';
import { CBT_STEP_CONFIG } from '@/features/therapy/cbt/flow/config';
import type { CBTStepId } from '@/features/therapy/cbt/flow';

interface FooterInfoProps {
  isStreaming: boolean;
  isCBTActive: boolean;
  cbtCurrentStep: CBTStepId | 'complete';
  hasStarted: boolean;
}

export function FooterInfo({ isStreaming, isCBTActive, cbtCurrentStep, hasStarted }: FooterInfoProps) {
  const t = useTranslations('cbt');

  const STEP_I18N_MAP: Record<string, string> = {
    'situation': 'situation',
    'emotions': 'emotions',
    'thoughts': 'thoughts',
    'core-belief': 'coreBelief',
    'challenge-questions': 'challenge',
    'rational-thoughts': 'rational',
    'schema-modes': 'schema',
    'actions': 'actions',
    'final-emotions': 'finalEmotions',
  };
  const stepKey = STEP_I18N_MAP[cbtCurrentStep as keyof typeof STEP_I18N_MAP];
  const stepTitle = (() => {
    if (stepKey) return t(`steps.${stepKey}.title`);
    if (cbtCurrentStep !== 'complete' && cbtCurrentStep !== 'final-emotions') {
      const id: CBTStepId = cbtCurrentStep;
      return CBT_STEP_CONFIG[id].metadata.title.defaultText;
    }
    return String(cbtCurrentStep).replace('-', ' ');
  })();

  return (
    <div className="border-t bg-card/50 backdrop-blur-md">
      <div className={"max-w-4xl mx-auto py-4 text-center px-4 sm:px-6"}>
        <div className="text-sm text-muted-foreground">
          {isStreaming ? (
            <span>🔄 {t('footer.analyzing')}</span>
          ) : isCBTActive && cbtCurrentStep !== 'complete' && cbtCurrentStep !== 'final-emotions' ? (
            <span>💙 {t('footer.completeStep', { step: stepTitle })}</span>
          ) : isCBTActive && cbtCurrentStep === 'final-emotions' ? (
            <span>💙 {t('footer.reflectAndSend')}</span>
          ) : hasStarted ? (
            <span>💙 {t('footer.autoSaved')}</span>
          ) : (
            <span>💙 {t('footer.start')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
