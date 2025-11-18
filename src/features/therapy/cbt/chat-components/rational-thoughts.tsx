'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TherapySlider } from '@/features/therapy/components/ui/therapy-slider';
import { CBTStepWrapper } from '@/features/therapy/components/cbt-step-wrapper';
import { Lightbulb, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { CBTStepType, RationalThoughtsData } from '@/types/domains/therapy';
// Removed CBTFormValidationError import - validation errors not displayed
import { useTranslations } from 'next-intl';
import { therapeuticTypography } from '@/lib/ui/design-tokens';

interface RationalThoughtsProps {
  onComplete: (data: RationalThoughtsData) => void;
  initialData?: RationalThoughtsData;
  coreBeliefText?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
  onNavigateStep?: (step: CBTStepType) => void;
}

export function RationalThoughts({
  onComplete,
  initialData,
  coreBeliefText,
  className,
  onNavigateStep,
}: RationalThoughtsProps) {
  const t = useTranslations('cbt');
  const { sessionData, rationalActions } = useCBTDataManager();

  // Get rational thoughts data from unified CBT hook
  const rationalThoughtsData = sessionData?.rationalThoughts;

  // Default rational thoughts data
  const defaultThoughtsData: RationalThoughtsData = {
    rationalThoughts: [{ thought: '', confidence: 5 }],
  };

  const [thoughtsData, setThoughtsData] = useState<RationalThoughtsData>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData?.rationalThoughts) {
      return initialData;
    }

    // Return Redux data if it has content, otherwise default
    return rationalThoughtsData && rationalThoughtsData.length > 0
      ? { rationalThoughts: rationalThoughtsData }
      : defaultThoughtsData;
  });

  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(() =>
    new Array(thoughtsData.rationalThoughts.length).fill('')
  );
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const textareaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const skipNextRehydrateRef = useRef<boolean>(false);

  // Auto-save to Redux when thoughts change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      rationalActions.updateRationalThoughts(thoughtsData.rationalThoughts);
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [thoughtsData, thoughtsData.rationalThoughts, rationalActions]);

  // Rehydrate local state if unified session data changes while mounted
  useEffect(() => {
    if (!rationalThoughtsData || rationalThoughtsData.length === 0) return;
    // Always refresh highlight from store values to persist selection when navigating
    const prompts = (t.raw('rational.prompts') as string[]) || [];
    setSelectedPrompts(
      rationalThoughtsData.map((rt) => (prompts.includes(rt.thought) ? rt.thought : ''))
    );
    if (skipNextRehydrateRef.current) {
      // A local change just occurred; skip a single rehydrate pass so slider edits persist
      skipNextRehydrateRef.current = false;
      return;
    }

    setThoughtsData((prev) => {
      const equalLen = rationalThoughtsData.length === prev.rationalThoughts.length;
      const isSame =
        equalLen &&
        rationalThoughtsData.every(
          (t, i) =>
            t.thought === prev.rationalThoughts[i]?.thought &&
            t.confidence === prev.rationalThoughts[i]?.confidence
        );
      if (isSame) return prev;
      return {
        rationalThoughts: rationalThoughtsData.map((t, i) => ({
          thought: t.thought,
          confidence:
            typeof t.confidence === 'number'
              ? t.confidence
              : (prev.rationalThoughts[i]?.confidence ?? 5),
        })),
      };
    });
  }, [rationalThoughtsData, thoughtsData.rationalThoughts, t]);

  const handleThoughtChange = useCallback(
    (index: number, field: 'thought' | 'confidence', value: string | number) => {
      setThoughtsData((prev) => ({
        ...prev,
        rationalThoughts: prev.rationalThoughts.map((t, i) =>
          i === index ? { ...t, [field]: value } : t
        ),
      }));
      skipNextRehydrateRef.current = true;

      // Clear selection when manually typing (unless it matches exactly)
      if (field === 'thought') {
        const updatedSelectedPrompts = [...selectedPrompts];
        if (updatedSelectedPrompts[index] !== value) {
          updatedSelectedPrompts[index] = '';
          setSelectedPrompts(updatedSelectedPrompts);
        }
      }
    },
    [selectedPrompts]
  );

  const addThought = useCallback(() => {
    if (thoughtsData.rationalThoughts.length < 5) {
      setThoughtsData((prev) => ({
        ...prev,
        rationalThoughts: [...prev.rationalThoughts, { thought: '', confidence: 5 }],
      }));
      setSelectedPrompts((prev) => [...prev, '']);
      setFocusedIndex(thoughtsData.rationalThoughts.length);
      skipNextRehydrateRef.current = true;
    }
  }, [thoughtsData.rationalThoughts.length]);

  const removeThought = useCallback(
    (index: number) => {
      if (thoughtsData.rationalThoughts.length > 1) {
        setThoughtsData((prev) => ({
          ...prev,
          rationalThoughts: prev.rationalThoughts.filter((_, i) => i !== index),
        }));
        setSelectedPrompts((prev) => prev.filter((_, i) => i !== index));
        setFocusedIndex((prev) => {
          if (prev === index) return Math.max(0, index - 1);
          if (prev > index) return prev - 1;
          return prev;
        });
        skipNextRehydrateRef.current = true;
      }
    },
    [thoughtsData.rationalThoughts.length]
  );

  const handlePromptSelect = useCallback(
    (prompt: string, index: number) => {
      // Update local state immediately
      setThoughtsData((prev) => {
        const nextArray = [...prev.rationalThoughts];
        const at = nextArray[index] ?? { thought: '', confidence: 5 };
        nextArray[index] = { ...at, thought: prompt };
        return { ...prev, rationalThoughts: nextArray };
      });
      skipNextRehydrateRef.current = true;

      // Highlight
      const updatedSelectedPrompts = [...selectedPrompts];
      updatedSelectedPrompts[index] = prompt;
      setSelectedPrompts(updatedSelectedPrompts);

      // Persist synchronously
      const persistedArray = [...thoughtsData.rationalThoughts];
      const at = persistedArray[index] ?? { thought: '', confidence: 5 };
      persistedArray[index] = { ...at, thought: prompt };
      rationalActions.updateRationalThoughts(persistedArray);

      // Focus target textarea and move caret
      setFocusedIndex(index);
      const el = textareaRefs.current[index];
      if (el) {
        el.focus();
        const len = prompt.length;
        try {
          el.setSelectionRange(len, len);
        } catch {}
      }
    },
    [selectedPrompts, thoughtsData.rationalThoughts, rationalActions]
  );

  const handleSubmit = useCallback(() => {
    const validThoughts = thoughtsData.rationalThoughts.filter((t) => t.thought.trim());
    if (validThoughts.length > 0) {
      // Update Redux store with final data
      rationalActions.updateRationalThoughts(validThoughts);

      // Always complete the step first for normal CBT flow progression
      onComplete({ rationalThoughts: validThoughts });
    }
  }, [thoughtsData, rationalActions, onComplete]);

  const validThoughtCount = thoughtsData.rationalThoughts.filter((t) => t.thought.trim()).length;
  const isValid = validThoughtCount > 0;

  // Validation logic - keeps form functional without showing error messages

  const handleNext = useCallback(async () => {
    await handleSubmit();
  }, [handleSubmit]);

  // Helper prompts
  const thoughtPrompts = t.raw('rational.prompts') as string[];

  return (
    <CBTStepWrapper
      step="rational-thoughts"
      title={t('rational.title')}
      subtitle={
        coreBeliefText
          ? t('rational.subtitleAlt', { belief: coreBeliefText })
          : t('rational.subtitle')
      }
      icon={<Lightbulb className="h-5 w-5" />}
      isValid={isValid}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={t('rational.next')}
      helpText={t('rational.help')}
      hideProgressBar={true}
      className={className}
      onNavigateStep={onNavigateStep}
    >
      <div className="space-y-6">
        {/* Quick Thought Prompts */}
        <div className="space-y-2">
          <p className={therapeuticTypography.smallSecondary}>{t('rational.promptLabel')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {thoughtPrompts.slice(0, 4).map((prompt, idx) => {
              const activeIndex = Math.min(
                Math.max(focusedIndex, 0),
                Math.max(thoughtsData.rationalThoughts.length - 1, 0)
              );
              const isSelected = selectedPrompts[activeIndex] === prompt;
              return (
                <Button
                  type="button"
                  key={idx}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePromptSelect(prompt, activeIndex)}
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

        {/* Rational Thoughts */}
        <div className="space-y-4">
          {thoughtsData.rationalThoughts.map((thoughtData, index) => (
            <Card key={index} className="bg-muted/30 border-border/30 border p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className={therapeuticTypography.label}>
                    {t('rational.thought', { index: index + 1 })}
                  </h4>
                  {thoughtsData.rationalThoughts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeThought(index)}
                      className="hover:bg-destructive/10 hover:text-destructive h-6 w-6 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <Textarea
                  placeholder={t('rational.placeholder')}
                  value={thoughtData.thought}
                  onChange={(e) => handleThoughtChange(index, 'thought', e.target.value)}
                  onFocus={() => setFocusedIndex(index)}
                  ref={(el) => {
                    textareaRefs.current[index] = el;
                  }}
                  className="min-h-[60px] resize-none"
                  maxLength={200}
                />

                {thoughtData.thought.trim() && (
                  <TherapySlider
                    type="confidence"
                    labelSize="xs"
                    label={t('rational.confidence')}
                    value={thoughtData.confidence}
                    onChange={(value) => handleThoughtChange(index, 'confidence', value)}
                  />
                )}

                <div className={therapeuticTypography.smallSecondary}>
                  <span>{thoughtData.thought.length}/200</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Thought */}
        {thoughtsData.rationalThoughts.length < 5 && (
          <Button
            variant="outline"
            onClick={addThought}
            className="hover:bg-accent hover:text-accent-foreground h-8 w-full border-dashed"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('rational.addAnother')}
          </Button>
        )}
      </div>
    </CBTStepWrapper>
  );
}
