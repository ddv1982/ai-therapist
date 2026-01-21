'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CBTStepType, SituationData } from '@/types';
import { useTranslations } from 'next-intl';
import { CBTStepWrapper } from '@/features/therapy/components/cbt-step-wrapper';
import { useDraftSaving } from '@/hooks/use-draft-saving';
import { TIMING } from '@/constants/ui';

interface SituationPromptProps {
  value?: SituationData | null;
  onChange?: (data: SituationData) => void;
  onComplete: (data: SituationData) => void;
  onNavigateStep?: (step: CBTStepType) => void;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

const DEFAULT_SITUATION: SituationData = {
  situation: '',
  date: new Date().toISOString().split('T')[0],
};

export function SituationPrompt({
  value,
  onChange,
  onComplete,
  onNavigateStep,
  className,
}: SituationPromptProps) {
  const t = useTranslations('cbt');

  const [localData, setLocalData] = useState<SituationData>(() => value ?? DEFAULT_SITUATION);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  const { saveDraft } = useDraftSaving<SituationData>({
    onSave: (data) => onChange?.(data),
    debounceMs: TIMING.DEBOUNCE.DEFAULT,
    enabled: !!onChange,
  });

  useEffect(() => {
    if (value) {
      setLocalData(value);
    }
  }, [value]);

  const selectedDate = useMemo(() => {
    if (!localData.date) return undefined;
    const parts = localData.date.split('-');
    if (parts.length !== 3) return undefined;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }, [localData.date]);

  const situationPrompts = t.raw('situation.prompts') as string[];

  useEffect(() => {
    if (localData.situation && situationPrompts.includes(localData.situation)) {
      setSelectedPrompt(localData.situation);
    } else {
      setSelectedPrompt('');
    }
  }, [localData.situation, situationPrompts]);

  const isValid = localData.situation.trim().length >= 5;

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      const updated = { ...localData, situation: prompt };
      setLocalData(updated);
      setSelectedPrompt(prompt);
      saveDraft(updated);
    },
    [localData, saveDraft]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      const updated = { ...localData, situation: value };
      setLocalData(updated);
      setSelectedPrompt('');
      saveDraft(updated);
    },
    [localData, saveDraft]
  );

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const updated = { ...localData, date: dateString };
        setLocalData(updated);
        saveDraft(updated);
      }
    },
    [localData, saveDraft]
  );

  const handleNext = useCallback(() => {
    if (isValid) {
      const trimmed: SituationData = { situation: localData.situation.trim(), date: localData.date };
      onComplete(trimmed);
    }
  }, [isValid, localData, onComplete]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleNext();
      }
    },
    [handleNext]
  );

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

        <div className="space-y-2">
          <Textarea
            placeholder={t('situation.placeholder')}
            value={localData.situation}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>
              {localData.situation.length < 5
                ? t('situation.moreDetails')
                : t('situation.lookingGood')}
            </span>
            <span>{localData.situation.length}/1000</span>
          </div>
        </div>
      </div>
    </CBTStepWrapper>
  );
}
