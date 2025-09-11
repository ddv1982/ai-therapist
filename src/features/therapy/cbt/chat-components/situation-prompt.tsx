'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { SituationData } from '@/types/therapy';
import {useTranslations} from 'next-intl';

interface SituationPromptProps {
  onComplete?: (data: SituationData) => void;
  className?: string;
}

export function SituationPrompt({ 
  onComplete,
  className 
}: SituationPromptProps) {
  const t = useTranslations('cbt');
  const { sessionData, sessionActions } = useCBTDataManager();
  
  // Local state for UI interaction
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  
  // Get current situation data
  const currentSituation = sessionData?.situation?.situation || '';
  const currentDate = sessionData?.situation?.date || new Date().toISOString().split('T')[0];
  
  // Convert string date to Date object for DatePicker
  const selectedDate = React.useMemo(() => {
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

  // Validation logic - keeps form functional without showing error messages
  const isValid = currentSituation.trim().length >= 5;

  const handlePromptSelect = useCallback((prompt: string) => {
    const situationData = { situation: prompt, date: currentDate };
    sessionActions.updateSituation(situationData);
    setSelectedPrompt(prompt);
  }, [sessionActions, currentDate]);

  const handleDescriptionChange = useCallback((value: string) => {
    const situationData = { situation: value, date: currentDate };
    sessionActions.updateSituation(situationData);
    setSelectedPrompt(''); // Clear selection when manually typing
  }, [sessionActions, currentDate]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const situationData = { situation: currentSituation, date: dateString };
      sessionActions.updateSituation(situationData);
    }
  }, [sessionActions, currentSituation]);

  const handleNext = useCallback(async () => {
    if (isValid) {
      const situationData: SituationData = {
        situation: currentSituation.trim(),
        date: currentDate
      };
      
      // Complete this step
      sessionActions.updateSituation(situationData);
      
      // Call parent completion handler if provided
      if (onComplete) {
        onComplete(situationData);
      }
    }
  }, [isValid, currentSituation, currentDate, sessionActions, onComplete]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleNext();
    }
  }, [handleNext]);

  const charCount = currentSituation.length;

  return (
    <Card className={cn("bg-card rounded-lg p-6 shadow-sm", className)}>
      {/* Step Header */}
      <div className="mb-3 p-3 rounded border bg-muted/50 border-border/50 text-foreground">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{t('situation.title')}</h2>
            <p className="text-sm opacity-80 mt-1">{t('situation.subtitle')}</p>
          </div>
        </div>
        <p className="text-sm opacity-70 mt-2">
          {t('situation.helper')}
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Date Selection */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('situation.when')}</span>
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
          <p className="text-sm font-semibold text-foreground">{t('situation.quick')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {situationPrompts.slice(0, 4).map((prompt, index) => {
              const isSelected = selectedPrompt === prompt;
              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePromptSelect(prompt)}
                  className={cn(
                    "text-sm h-8 px-3 text-left justify-start",
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "border-dashed hover:bg-accent hover:text-accent-foreground"
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
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{charCount < 5 ? t('situation.moreDetails') : t('situation.lookingGood')}</span>
            <span>{charCount}/1000</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-end pt-6 border-t border-border mt-6">
        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="flex items-center gap-2"
        >
          {t('situation.next')}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}