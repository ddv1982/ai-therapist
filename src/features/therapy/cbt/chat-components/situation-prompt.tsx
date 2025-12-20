'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { CBTStepType, SituationData } from '@/types';
import { useTranslations } from 'next-intl';
import { CBTStepWrapper } from '@/features/therapy/components/cbt-step-wrapper';

interface SituationPromptProps {
  onComplete?: (data: SituationData) => void;
  className?: string;
  onNavigateStep?: (step: CBTStepType) => void;
}

export function SituationPrompt({ onComplete, className, onNavigateStep }: SituationPromptProps) {
  const t = useTranslations('cbt');
  const { sessionData, sessionActions } = useCBTDataManager();

  // Local state for UI interaction
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  // Get current situation data
  const currentSituation = sessionData?.situation?.situation || '';
  const currentDate = sessionData?.situation?.date || new Date().toISOString().split('T')[0];

  // Convert string date to Date object for DatePicker
  const selectedDate = useMemo(() => {
    if (!currentDate) return undefined;
    const parts = currentDate.split('-');
    if (parts.length !== 3) return undefined;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }, [currentDate]);

  // Common situation prompts for quick selection
  const situationPrompts = t.raw('situation.prompts') as string[];
  // Rehydrate highlight if stored situation matches a quick prompt
  useEffect(() => {
    // Always recompute highlight when source data changes
    if (currentSituation && situationPrompts.includes(currentSituation)) {
      setSelectedPrompt(currentSituation);
    } else {
      setSelectedPrompt('');
    }
  }, [currentSituation, situationPrompts]);

  // Validation logic - keeps form functional without showing error messages
  const isValid = currentSituation.trim().length >= 5;

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      const situationData = { situation: prompt, date: currentDate };
      sessionActions.updateSituation(situationData);
      setSelectedPrompt(prompt);
    },
    [sessionActions, currentDate]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      const situationData = { situation: value, date: currentDate };
      sessionActions.updateSituation(situationData);
      setSelectedPrompt(''); // Clear selection when manually typing
    },
    [sessionActions, currentDate]
  );

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        const situationData = { situation: currentSituation, date: dateString };
        sessionActions.updateSituation(situationData);
      }
    },
    [sessionActions, currentSituation]
  );

  const handleNext = useCallback(async () => {
    if (isValid) {
      const situationData: SituationData = {
        situation: currentSituation.trim(),
        date: currentDate,
      };

      // Complete this step
      sessionActions.updateSituation(situationData);

      // Call parent completion handler if provided
      if (onComplete) {
        onComplete(situationData);
      }
    }
  }, [isValid, currentSituation, currentDate, sessionActions, onComplete]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        void handleNext();
      }
    },
    [handleNext]
  );

  const charCount = currentSituation.length;

  return (
    <CBTStepWrapper
      step="situation"
      onNext={handleNext}
      isValid={isValid}
      nextButtonText={t('situation.next')}
      hideProgressBar={true}
      helpText={t('situation.helper')}
      className={className}
      onNavigateStep={onNavigateStep}
    >
      <div className="space-y-6">
        {/* Date Selection */}
        <div className="flex items-center gap-3">
          <Calendar className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm">{t('situation.when')}</span>
          <div className="flex-1">
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              placeholder={t('situation.datePlaceholder')}
              className="w-full"
              maxDate={new Date()}
            />
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">{t('situation.quick')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {situationPrompts.slice(0, 4).map((prompt, index) => {
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

        {/* Main Description */}
        <div className="space-y-2">
          <Textarea
            placeholder={t('situation.placeholder')}
            value={currentSituation}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />

          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>{charCount < 5 ? t('situation.moreDetails') : t('situation.lookingGood')}</span>
            <span>{charCount}/1000</span>
          </div>
        </div>
      </div>
    </CBTStepWrapper>
  );
}
