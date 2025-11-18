'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TherapySlider } from '@/features/therapy/components/ui/therapy-slider';
import { CBTStepWrapper } from '@/features/therapy/components/cbt-step-wrapper';
import { Target } from 'lucide-react';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { CBTStepType, CoreBeliefData } from '@/types';
// Removed chat bridge imports - individual data no longer sent during session
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { therapeuticTypography } from '@/lib/ui/design-tokens';

interface CoreBeliefProps {
  onComplete: (data: CoreBeliefData) => void;
  initialData?: CoreBeliefData;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
  onNavigateStep?: (step: CBTStepType) => void;
}

export function CoreBelief({
  onComplete,
  initialData,
  className,
  onNavigateStep,
}: CoreBeliefProps) {
  const t = useTranslations('cbt');
  const { sessionData, beliefActions } = useCBTDataManager();
  const skipNextRehydrateRef = useRef<boolean>(false);

  // Get core beliefs data from unified CBT hook
  const coreBelifsData = sessionData?.coreBeliefs;

  // Default core belief data
  const defaultBeliefData: CoreBeliefData = {
    coreBeliefText: '',
    coreBeliefCredibility: 5,
  };

  const [beliefData, setBeliefData] = useState<CoreBeliefData>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData) {
      return initialData;
    }

    // Return first Redux core belief if it exists, otherwise default
    return coreBelifsData && coreBelifsData.length > 0 ? coreBelifsData[0] : defaultBeliefData;
  });

  // Auto-save to unified CBT state when belief data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      beliefActions.updateCoreBeliefs([beliefData]);
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [beliefData, beliefData.coreBeliefText, beliefData.coreBeliefCredibility, beliefActions]);

  // Rehydrate local state if unified session data changes while mounted
  useEffect(() => {
    const source = coreBelifsData && coreBelifsData.length > 0 ? coreBelifsData[0] : null;
    if (!source) return;
    const prompts = (t.raw('coreBelief.prompts') as string[]) || [];
    setSelectedPrompt(prompts.includes(source.coreBeliefText) ? source.coreBeliefText : '');

    if (skipNextRehydrateRef.current) {
      // A local change just occurred; skip a single rehydrate pass so slider/text edits persist
      skipNextRehydrateRef.current = false;
      return;
    }

    setBeliefData((prev) => {
      const isSame =
        source.coreBeliefText === prev.coreBeliefText &&
        source.coreBeliefCredibility === prev.coreBeliefCredibility;
      if (isSame) return prev;
      return {
        coreBeliefText: source.coreBeliefText,
        coreBeliefCredibility:
          typeof source.coreBeliefCredibility === 'number'
            ? source.coreBeliefCredibility
            : (prev.coreBeliefCredibility ?? 5),
      };
    });
  }, [coreBelifsData, beliefData.coreBeliefText, beliefData.coreBeliefCredibility, t]);

  // Note: Chat bridge no longer used - data sent only in final comprehensive summary

  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleBeliefChange = useCallback((value: string) => {
    setBeliefData((prev) => ({ ...prev, coreBeliefText: value }));
    skipNextRehydrateRef.current = true;
    // If user types or value differs from selected prompt, clear highlight
    setSelectedPrompt((prev) => (prev === value ? prev : ''));
  }, []);

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      setSelectedPrompt(prompt);
      const next = { ...beliefData, coreBeliefText: prompt };
      setBeliefData(next);
      beliefActions.updateCoreBeliefs([next]);
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const len = prompt.length;
        try {
          el.setSelectionRange(len, len);
        } catch {}
      }
    },
    [beliefData, beliefActions]
  );

  const handleCredibilityChange = useCallback((value: number) => {
    setBeliefData((prev) => ({ ...prev, coreBeliefCredibility: value }));
    skipNextRehydrateRef.current = true;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (beliefData.coreBeliefText.trim()) {
      // Update unified CBT state with final data
      beliefActions.updateCoreBeliefs([beliefData]);

      // Note: Individual core belief data is no longer sent to chat during session.
      // All data will be included in the comprehensive summary at the end.

      onComplete(beliefData);
    }
  }, [beliefData, beliefActions, onComplete]);

  const isValid = beliefData.coreBeliefText.trim().length > 0;

  // Validation logic - keeps form functional without showing error messages

  const handleNext = useCallback(async () => {
    await handleSubmit();
  }, [handleSubmit]);

  // Common belief prompts
  const beliefPrompts = [...((t.raw('coreBelief.prompts') as string[]) || [])];

  return (
    <CBTStepWrapper
      step="core-belief"
      title={t('coreBelief.title')}
      subtitle={t('coreBelief.subtitle')}
      icon={<Target className="h-5 w-5" />}
      isValid={isValid}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={t('coreBelief.next')}
      helpText={t('coreBelief.help')}
      hideProgressBar={true}
      className={className}
      onNavigateStep={onNavigateStep}
    >
      <div className="space-y-6">
        {/* Quick Belief Prompts */}
        <div className="space-y-2">
          <p className={therapeuticTypography.smallSecondary}>{t('coreBelief.promptLabel')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {beliefPrompts.map((prompt, index) => {
              const isSelected = selectedPrompt === prompt;
              return (
                <Button
                  type="button"
                  key={index}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePromptSelect(prompt)}
                  className={cn(
                    'h-8 justify-start px-3 text-left text-sm',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground border-dashed'
                  )}
                >
                  {prompt}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Core Belief Input */}
        <div className="space-y-2">
          <Textarea
            placeholder={t('coreBelief.placeholder')}
            value={beliefData.coreBeliefText}
            onChange={(e) => handleBeliefChange(e.target.value)}
            ref={(el) => {
              textareaRef.current = el;
            }}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <div
            className={cn(
              'flex items-center justify-between',
              therapeuticTypography.smallSecondary
            )}
          >
            <span>
              {beliefData.coreBeliefText.length < 3
                ? t('coreBelief.moreDetails')
                : t('coreBelief.lookingGood')}
            </span>
            <span>{beliefData.coreBeliefText.length}/500</span>
          </div>
        </div>

        {/* Credibility Slider */}
        {isValid && (
          <TherapySlider
            type="credibility"
            label={t('coreBelief.credibility')}
            value={beliefData.coreBeliefCredibility}
            onChange={handleCredibilityChange}
          />
        )}
      </div>
    </CBTStepWrapper>
  );
}
