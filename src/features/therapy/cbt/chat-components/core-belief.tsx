'use client';

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useActionState,
  startTransition,
  useMemo,
} from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TherapySlider } from '@/features/therapy/components/ui/therapy-slider';
import { CBTStepWrapper } from '@/features/therapy/components/cbt-step-wrapper';
import { Target } from 'lucide-react';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { CBTStepType, CoreBeliefData } from '@/types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { therapeuticTypography } from '@/lib/ui/design-tokens';
import { useDraftSaving } from '@/hooks/use-draft-saving';
import { TIMING } from '@/constants/ui';
import { usePromptSelection } from '@/features/therapy/cbt/hooks/use-prompt-selection';

type CoreBeliefFormState = {
  message: string;
  errors?: {
    coreBeliefText?: string[];
    _form?: string[];
  };
  success?: boolean;
};

const initialFormState: CoreBeliefFormState = { message: '' };

interface CoreBeliefProps {
  value?: CoreBeliefData | null;
  onChange?: (data: CoreBeliefData) => void;
  onComplete: (data: CoreBeliefData) => void;
  onNavigateStep?: (step: CBTStepType) => void;
  initialData?: CoreBeliefData;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

export function CoreBelief({
  value,
  onChange,
  onComplete,
  onNavigateStep,
  initialData,
  className,
}: CoreBeliefProps) {
  const t = useTranslations('cbt');
  const { sessionData, beliefActions } = useCBTDataManager();
  const skipNextRehydrateRef = useRef<boolean>(false);

  const coreBelifsData = value ? [value] : sessionData?.coreBeliefs;
  const defaultBeliefData: CoreBeliefData = {
    coreBeliefText: '',
    coreBeliefCredibility: 5,
  };

  const [beliefData, setBeliefData] = useState<CoreBeliefData>(() => {
    if (value) return value;
    if (initialData) return initialData;
    return coreBelifsData && coreBelifsData.length > 0 ? coreBelifsData[0] : defaultBeliefData;
  });

  const beliefPrompts = useMemo(() => (t.raw('coreBelief.prompts') as string[]) || [], [t]);
  const initialBeliefText =
    value?.coreBeliefText ?? initialData?.coreBeliefText ?? coreBelifsData?.[0]?.coreBeliefText;
  const {
    selected: selectedPrompt,
    setSelected: setSelectedPrompt,
    matchPrompt,
  } = usePromptSelection(beliefPrompts, initialBeliefText);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { saveDraft } = useDraftSaving<CoreBeliefData>({
    onSave: (data) => {
      skipNextRehydrateRef.current = true;
      beliefActions.updateCoreBeliefs([data]);
      onChange?.(data);
    },
    debounceMs: TIMING.DEBOUNCE.DEFAULT,
    enabled: true,
  });

  // Rehydrate local state only when NOT in controlled mode (no value prop)
  useEffect(() => {
    if (value !== undefined) return;

    const source = coreBelifsData && coreBelifsData.length > 0 ? coreBelifsData[0] : null;
    if (!source) return;

    setSelectedPrompt(matchPrompt(source.coreBeliefText));

    if (skipNextRehydrateRef.current) {
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
  }, [coreBelifsData, value, matchPrompt, setSelectedPrompt]);

  const handleBeliefChange = useCallback(
    (value: string) => {
      const updated = { ...beliefData, coreBeliefText: value };
      setBeliefData(updated);
      saveDraft(updated);
      setSelectedPrompt(matchPrompt(value));
    },
    [beliefData, saveDraft, matchPrompt, setSelectedPrompt]
  );

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      setSelectedPrompt(prompt);
      const updated = { ...beliefData, coreBeliefText: prompt };
      setBeliefData(updated);
      saveDraft(updated);
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const len = prompt.length;
        try {
          el.setSelectionRange(len, len);
        } catch {}
      }
    },
    [beliefData, saveDraft]
  );

  const handleCredibilityChange = useCallback(
    (value: number) => {
      const updated = { ...beliefData, coreBeliefCredibility: value };
      setBeliefData(updated);
      saveDraft(updated);
    },
    [beliefData, saveDraft]
  );

  // Form action for useActionState
  const formAction = useCallback(
    async (_prevState: CoreBeliefFormState, _formData: FormData): Promise<CoreBeliefFormState> => {
      try {
        if (!beliefData.coreBeliefText.trim()) {
          return {
            message: 'Please enter a core belief.',
            errors: { coreBeliefText: ['Core belief is required.'] },
            success: false,
          };
        }

        // Update unified CBT state with final data
        beliefActions.updateCoreBeliefs([beliefData]);

        // Note: Individual core belief data is no longer sent to chat during session.
        // All data will be included in the comprehensive summary at the end.

        onComplete(beliefData);
        return { message: 'Core belief saved.', success: true };
      } catch (error) {
        return {
          message: error instanceof Error ? error.message : 'An error occurred.',
          errors: { _form: ['Failed to save core belief. Please try again.'] },
          success: false,
        };
      }
    },
    [beliefData, beliefActions, onComplete]
  );

  const [formState, submitAction, isPending] = useActionState(formAction, initialFormState);

  const isValid = beliefData.coreBeliefText.trim().length > 0;

  // Validation logic - keeps form functional without showing error messages

  const handleNext = useCallback(() => {
    const formData = new FormData();
    startTransition(() => {
      submitAction(formData);
    });
  }, [submitAction]);

  // Build validation errors from formState
  const validationErrors: { field: string; message: string }[] = [];
  if (formState.errors?.coreBeliefText) {
    validationErrors.push({ field: 'coreBeliefText', message: formState.errors.coreBeliefText[0] });
  }
  if (formState.errors?._form) {
    validationErrors.push({ field: '_form', message: formState.errors._form[0] });
  }

  return (
    <CBTStepWrapper
      step="core-belief"
      title={t('coreBelief.title')}
      subtitle={t('coreBelief.subtitle')}
      icon={<Target className="h-5 w-5" />}
      isValid={isValid && !isPending}
      validationErrors={validationErrors}
      onNext={handleNext}
      nextButtonText={isPending ? t('status.saving') : t('coreBelief.next')}
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
