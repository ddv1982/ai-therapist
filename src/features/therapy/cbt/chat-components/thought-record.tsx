'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TherapySlider } from '@/features/therapy/components/ui/therapy-slider';
import { CBTStepWrapper } from '@/features/therapy/components/cbt-step-wrapper';
import { Brain, Plus, Minus, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { CBTStepType, ThoughtData } from '@/types';
// Removed CBTFormValidationError import - validation errors not displayed
// Removed chat bridge imports - individual data no longer sent during session
import { useTranslations } from 'next-intl';
import { therapeuticTypography } from '@/lib/ui/design-tokens';

interface ThoughtRecordProps {
  onComplete: (data: ThoughtData[]) => void;
  initialData?: ThoughtData[];
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
  onNavigateStep?: (step: CBTStepType) => void;
}

export function ThoughtRecord({
  onComplete,
  initialData,
  title,
  subtitle,
  className,
  onNavigateStep,
}: ThoughtRecordProps) {
  const t = useTranslations('cbt');
  const { sessionData, thoughtActions } = useCBTDataManager();

  // Get thoughts data from unified CBT hook
  const thoughtsData = sessionData?.thoughts;

  // Default thought data
  const defaultThoughts: ThoughtData[] = [{ thought: '', credibility: 5 }];

  // Initialize local state for form
  const [thoughts, setThoughts] = useState<ThoughtData[]>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData && initialData.length > 0) {
      return initialData;
    }

    // Return Redux data if it has content, otherwise default
    return thoughtsData && thoughtsData.length > 0 ? thoughtsData : defaultThoughts;
  });

  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(() =>
    new Array(thoughts.length).fill('')
  );
  const [focusedThoughtIndex, setFocusedThoughtIndex] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>(() => new Array(thoughts.length).fill(''));
  // Prevent rehydrate effect from overwriting fresh local changes
  const skipNextRehydrateRef = useRef<boolean>(false);
  const textareaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);

  // Rehydrate local state if unified session data changes while mounted
  useEffect(() => {
    if (!thoughtsData || thoughtsData.length === 0) return;

    // Always recompute highlight from store values to persist selection when navigating
    const prompts = (t.raw('thoughts.prompts') as string[]) || [];
    const rehydratedSelections = thoughtsData.map((item: any) =>
      prompts.includes(item.thought) ? item.thought : ''
    );
    setSelectedPrompts(rehydratedSelections);

    if (skipNextRehydrateRef.current) {
      // A local change just occurred; skip a single rehydrate pass so slider edits persist
      skipNextRehydrateRef.current = false;
      return;
    }

    setThoughts((prevThoughts) => {
      const equalLength = prevThoughts.length === thoughtsData.length;
      const isSame =
        equalLength &&
        thoughtsData.every((nextThought: any, index: number) => {
          const current = prevThoughts[index];
          return (
            current &&
            nextThought.thought === current.thought &&
            nextThought.credibility === current.credibility
          );
        });

      if (isSame) {
        return prevThoughts;
      }

      setErrors(new Array(thoughtsData.length).fill(''));
      return thoughtsData.map((thought: any, index: number) => ({
        thought: thought.thought,
        credibility:
          typeof thought.credibility === 'number'
            ? thought.credibility
            : (prevThoughts[index]?.credibility ?? 5),
      }));
    });
  }, [thoughtsData, t]);

  // Auto-save to unified CBT state when thoughts change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      thoughtActions.updateThoughts(thoughts);
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [thoughts, thoughtActions]);

  // Note: Chat bridge no longer used - data sent only in final comprehensive summary

  // Common thought prompts to help users get started
  const thoughtPrompts = t.raw('thoughts.prompts') as string[];

  const handleThoughtChange = useCallback(
    (index: number, newThought: string) => {
      const updatedThoughts = [...thoughts];
      updatedThoughts[index] = { ...updatedThoughts[index], thought: newThought };
      setThoughts(updatedThoughts);
      skipNextRehydrateRef.current = true;

      // Clear selection when manually typing (unless it matches exactly)
      const updatedSelectedPrompts = [...selectedPrompts];
      if (updatedSelectedPrompts[index] !== newThought) {
        updatedSelectedPrompts[index] = '';
        setSelectedPrompts(updatedSelectedPrompts);
      }

      // Clear errors for this thought
      const newErrors = [...errors];
      newErrors[index] = '';
      setErrors(newErrors);
    },
    [thoughts, errors, selectedPrompts]
  );

  const handleCredibilityChange = useCallback(
    (index: number, credibility: number) => {
      const updatedThoughts = [...thoughts];
      updatedThoughts[index] = { ...updatedThoughts[index], credibility };
      setThoughts(updatedThoughts);
      skipNextRehydrateRef.current = true;
    },
    [thoughts]
  );

  const handlePromptSelect = useCallback(
    (prompt: string, index: number) => {
      // Update local thoughts immediately
      const updated = [...thoughts];
      const at = updated[index] ?? { thought: '', credibility: 5 };
      updated[index] = { ...at, thought: prompt };
      setThoughts(updated);
      skipNextRehydrateRef.current = true;

      // Highlight the chosen prompt for the active thought
      const updatedSelectedPrompts = [...selectedPrompts];
      updatedSelectedPrompts[index] = prompt;
      setSelectedPrompts(updatedSelectedPrompts);

      // Persist to unified state without waiting for debounce
      thoughtActions.updateThoughts(updated);
      // Move focus to the targeted textarea to make the change visible
      setFocusedThoughtIndex(index);
      const el = textareaRefs.current[index];
      if (el) {
        el.focus();
        // place caret at end
        const len = prompt.length;
        try {
          el.setSelectionRange(len, len);
        } catch {}
      }
    },
    [thoughts, selectedPrompts, thoughtActions]
  );

  const addThought = useCallback(() => {
    if (thoughts.length < 5) {
      setThoughts((prev) => [...prev, { thought: '', credibility: 5 }]);
      setSelectedPrompts((prev) => [...prev, '']);
      setErrors((prev) => [...prev, '']);
      // Focus newly added thought
      setFocusedThoughtIndex(thoughts.length);
      skipNextRehydrateRef.current = true;
    }
  }, [thoughts.length]);

  const removeThought = useCallback(
    (index: number) => {
      if (thoughts.length > 1) {
        setThoughts((prev) => prev.filter((_, i) => i !== index));
        setSelectedPrompts((prev) => prev.filter((_, i) => i !== index));
        setErrors((prev) => prev.filter((_, i) => i !== index));
        setFocusedThoughtIndex((prev) => {
          if (prev === index) return Math.max(0, index - 1);
          if (prev > index) return prev - 1;
          return prev;
        });
        skipNextRehydrateRef.current = true;
      }
    },
    [thoughts.length]
  );

  const validateThoughts = useCallback(() => {
    const newErrors: string[] = [];
    let isValid = true;

    thoughts.forEach((thought, index) => {
      if (thought.thought.trim().length < 3) {
        newErrors[index] = 'Please enter at least 3 characters';
        isValid = false;
      } else {
        newErrors[index] = '';
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [thoughts]);

  const handleSubmit = useCallback(async () => {
    if (validateThoughts()) {
      const validThoughts = thoughts.filter((t) => t.thought.trim().length >= 3);

      // Update unified CBT state with final data
      thoughtActions.updateThoughts(validThoughts);

      // Note: Individual thoughts data is no longer sent to chat during session.
      // All data will be included in the comprehensive summary at the end.

      onComplete(validThoughts);
    }
  }, [thoughts, thoughtActions, validateThoughts, onComplete]);

  const hasValidThoughts = thoughts.some((t) => t.thought.trim().length >= 3);

  // Validation logic - keeps form functional without showing error messages

  const handleNext = useCallback(async () => {
    await handleSubmit();
  }, [handleSubmit]);

  return (
    <CBTStepWrapper
      step="thoughts"
      title={title || t('thoughts.title')}
      subtitle={subtitle || t('thoughts.subtitle')}
      icon={<Brain className="h-5 w-5" />}
      isValid={hasValidThoughts}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={t('thoughts.next')}
      helpText={t('thoughts.help')}
      hideProgressBar={true}
      className={className}
      onNavigateStep={onNavigateStep}
    >
      <div className="space-y-6">
        {/* Thought Prompts */}
        <div className="space-y-2">
          <div className={cn('flex items-center gap-2', therapeuticTypography.smallSecondary)}>
            <Lightbulb className="h-4 w-4" />
            <span>{t('thoughts.promptLabel')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {thoughtPrompts.map((prompt, index) => {
              const activeIndex = Math.min(
                Math.max(focusedThoughtIndex, 0),
                Math.max(thoughts.length - 1, 0)
              );
              const isSelected = selectedPrompts[activeIndex] === prompt;
              return (
                <Button
                  type="button"
                  key={index}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePromptSelect(prompt, activeIndex)}
                  className={cn(
                    'h-7 px-2 text-sm',
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

        {/* Thought Entries */}
        <div className="space-y-4">
          {thoughts.map((thought, index) => (
            <Card
              key={index}
              className="bg-muted/30 border-border/30 w-full max-w-full overflow-hidden border p-4"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    className={cn(
                      'text-foreground text-base font-semibold',
                      therapeuticTypography.label
                    )}
                  >
                    {t('thoughts.entryLabel')} {index + 1}
                  </label>
                  {thoughts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeThought(index)}
                      className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder={t('thoughts.placeholder')}
                    value={thought.thought}
                    onChange={(e) => handleThoughtChange(index, e.target.value)}
                    onFocus={() => setFocusedThoughtIndex(index)}
                    ref={(el) => {
                      textareaRefs.current[index] = el;
                    }}
                    className="min-h-[100px] w-full max-w-full resize-none overflow-hidden break-words"
                  />
                  {errors[index] && (
                    <p className="text-destructive text-sm break-words">{errors[index]}</p>
                  )}
                </div>

                <TherapySlider
                  type="credibility"
                  label={t('thoughts.credibility')}
                  value={thought.credibility}
                  onChange={(value) => handleCredibilityChange(index, value)}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Add Another Thought - Separated with proper spacing */}
        {thoughts.length < 5 && (
          <div className="border-border/30 border-t pt-2">
            <Button
              variant="outline"
              onClick={addThought}
              className="hover:bg-accent hover:text-accent-foreground h-12 w-full border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('thoughts.addAnother')}
            </Button>
          </div>
        )}
      </div>
    </CBTStepWrapper>
  );
}
