'use client';

import React, { useState, useCallback } from 'react';
import { Brain, Plus, Minus } from 'lucide-react';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import { ThoughtInput } from '@/components/cbt/primitives/thought-input';
import { FormStep } from '@/components/cbt/form-step';
import { useTranslations } from 'next-intl';
import type { ThoughtData } from '@/types/therapy';

interface ThoughtRecordProps {
  onComplete: (data: ThoughtData[]) => void;
  initialData?: ThoughtData[];
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

export function ThoughtRecord({
  onComplete,
  initialData,
  title,
  subtitle,
  stepNumber,
  totalSteps,
  className
}: ThoughtRecordProps) {
  const t = useTranslations('cbt');
  const { sessionData, thoughtActions } = useCBTDataManager();

  // Get thoughts data from unified CBT hook
  const thoughtsData = sessionData.thoughts;

  // Initialize local state for form
  const [thoughts, setThoughts] = useState<ThoughtData[]>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData && initialData.length > 0) {
      return initialData;
    }

    // Return Redux data if it has content, otherwise default
    return thoughtsData.length > 0 ? thoughtsData : [{ thought: '', credibility: 5 }];
  });

  const handleThoughtChange = useCallback((index: number, thought: string) => {
    const updatedThoughts = [...thoughts];
    updatedThoughts[index] = { ...updatedThoughts[index], thought };
    setThoughts(updatedThoughts);
    thoughtActions.updateThoughts(updatedThoughts);
  }, [thoughts, thoughtActions]);

  const handleCredibilityChange = useCallback((index: number, credibility: number) => {
    const updatedThoughts = [...thoughts];
    updatedThoughts[index] = { ...updatedThoughts[index], credibility };
    setThoughts(updatedThoughts);
    thoughtActions.updateThoughts(updatedThoughts);
  }, [thoughts, thoughtActions]);

  const handleAddThought = useCallback(() => {
    const newThoughts = [...thoughts, { thought: '', credibility: 5 }];
    setThoughts(newThoughts);
    thoughtActions.updateThoughts(newThoughts);
  }, [thoughts, thoughtActions]);

  const handleRemoveThought = useCallback((index: number) => {
    if (thoughts.length > 1) {
      const newThoughts = thoughts.filter((_, i) => i !== index);
      setThoughts(newThoughts);
      thoughtActions.updateThoughts(newThoughts);
    }
  }, [thoughts, thoughtActions]);

  // Check if form is valid (at least one thought with content)
  const isValid = thoughts.some(thought => thought.thought.trim().length > 0);

  const handleNext = useCallback(() => {
    if (isValid) {
      // Filter out empty thoughts
      const validThoughts = thoughts.filter(thought => thought.thought.trim().length > 0);
      onComplete(validThoughts);
    }
  }, [isValid, thoughts, onComplete]);

  const defaultTitle = t('thoughts.title');
  const defaultSubtitle = t('thoughts.subtitle');

  return (
    <FormStep
      title={title || defaultTitle}
      subtitle={subtitle || defaultSubtitle}
      onNext={handleNext}
      isValid={isValid}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      className={className}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">{t('thoughts.instruction')}</span>
        </div>

        <div className="space-y-4">
          {thoughts.map((thought, index) => (
            <ThoughtInput
              key={index}
              thought={thought.thought}
              credibility={thought.credibility}
              onThoughtChange={(value) => handleThoughtChange(index, value)}
              onCredibilityChange={(value) => handleCredibilityChange(index, value)}
              placeholder={t('thoughts.placeholder')}
            />
          ))}
        </div>

        <div className="flex justify-center items-center pt-4 gap-4">
          <button
            onClick={handleAddThought}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            aria-label="Add another thought"
          >
            <Plus className="w-4 h-4" />
            Add Thought
          </button>

          {thoughts.length > 1 && (
            <button
              onClick={() => handleRemoveThought(thoughts.length - 1)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              aria-label="Remove last thought"
            >
              <Minus className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>
      </div>
    </FormStep>
  );
}
