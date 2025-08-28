'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TherapySlider } from '@/components/ui/therapy-slider';
import { CBTStepWrapper } from '@/components/ui/cbt-step-wrapper';
import { Brain, Plus, Minus, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { ThoughtData } from '@/types/therapy';
// Removed CBTFormValidationError import - validation errors not displayed
// Removed chat bridge imports - individual data no longer sent during session
import {useTranslations} from 'next-intl';

// Remove local interface - use the one from cbtSlice
// export interface ThoughtData {
//   thought: string;
//   credibility: number;
// }

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
  title: _title = "",
  subtitle: _subtitle = "",
  stepNumber: _stepNumber,
  totalSteps: _totalSteps,
  className 
}: ThoughtRecordProps) {
  const t = useTranslations('cbt');
  const { sessionData, thoughtActions } = useCBTDataManager();
  
  // Get thoughts data from unified CBT hook
  const thoughtsData = sessionData.thoughts;
  
  // Default thought data
  const defaultThoughts: ThoughtData[] = [{ thought: '', credibility: 5 }];

  // Initialize local state for form
  const [thoughts, setThoughts] = useState<ThoughtData[]>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData && initialData.length > 0) {
      return initialData;
    }
    
    // Return Redux data if it has content, otherwise default
    return thoughtsData.length > 0 ? thoughtsData : defaultThoughts;
  });

  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(() => 
    new Array(thoughts.length).fill('')
  );
  const [errors, setErrors] = useState<string[]>(() => 
    new Array(thoughts.length).fill('')
  );

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

  const handleThoughtChange = useCallback((index: number, newThought: string) => {
    const updatedThoughts = [...thoughts];
    updatedThoughts[index] = { ...updatedThoughts[index], thought: newThought };
    setThoughts(updatedThoughts);
    
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
  }, [thoughts, errors, selectedPrompts]);

  const handleCredibilityChange = useCallback((index: number, credibility: number) => {
    const updatedThoughts = [...thoughts];
    updatedThoughts[index] = { ...updatedThoughts[index], credibility };
    setThoughts(updatedThoughts);
  }, [thoughts]);

  const handlePromptSelect = useCallback((prompt: string, index: number) => {
    handleThoughtChange(index, prompt);
    
    // Set the selected prompt for this thought index
    const updatedSelectedPrompts = [...selectedPrompts];
    updatedSelectedPrompts[index] = prompt;
    setSelectedPrompts(updatedSelectedPrompts);
  }, [handleThoughtChange, selectedPrompts]);

  const addThought = useCallback(() => {
    if (thoughts.length < 5) {
      setThoughts(prev => [...prev, { thought: '', credibility: 5 }]);
      setSelectedPrompts(prev => [...prev, '']);
      setErrors(prev => [...prev, '']);
    }
  }, [thoughts.length]);

  const removeThought = useCallback((index: number) => {
    if (thoughts.length > 1) {
      setThoughts(prev => prev.filter((_, i) => i !== index));
      setSelectedPrompts(prev => prev.filter((_, i) => i !== index));
      setErrors(prev => prev.filter((_, i) => i !== index));
    }
  }, [thoughts.length]);

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
      const validThoughts = thoughts.filter(t => t.thought.trim().length >= 3);
      
      // Update unified CBT state with final data
      thoughtActions.updateThoughts(validThoughts);
      
      // Note: Individual thoughts data is no longer sent to chat during session.
      // All data will be included in the comprehensive summary at the end.
      
      onComplete(validThoughts);
    }
  }, [thoughts, thoughtActions, validateThoughts, onComplete]);

  const hasValidThoughts = thoughts.some(t => t.thought.trim().length >= 3);
  const validThoughtCount = thoughts.filter(t => t.thought.trim().length >= 3).length;

  // Validation logic - keeps form functional without showing error messages

  const handleNext = useCallback(async () => {
    await handleSubmit();
  }, [handleSubmit]);

  return (
    <CBTStepWrapper
      step="thoughts"
      title={_title || t('thoughts.title')}
      subtitle={_subtitle || t('thoughts.subtitle')}
      icon={<Brain className="w-5 h-5" />}
      isValid={hasValidThoughts}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={`${t('thoughts.next')}${validThoughtCount > 0 ? ` (${validThoughtCount} ${t('thoughts.countLabel')})` : ''}`}
      helpText={t('thoughts.help')}
      className={className}
    >

      <div className="space-y-6">
        {/* Thought Prompts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
            <span>{t('thoughts.promptLabel')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {thoughtPrompts.map((prompt, index) => {
              const isSelected = selectedPrompts[0] === prompt;
              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePromptSelect(prompt, 0)}
                  className={cn(
                    "text-xs h-7 px-2",
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

        {/* Thought Entries */}
        <div className="space-y-4">
          {thoughts.map((thought, index) => (
            <Card key={index} className="p-4 bg-muted/30 border border-border/30 w-full max-w-full overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-base font-medium text-foreground">
                    {t('thoughts.entryLabel')} {index + 1}
                  </label>
                  {thoughts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeThought(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    placeholder={t('thoughts.placeholder')}
                    value={thought.thought}
                    onChange={(e) => handleThoughtChange(index, e.target.value)}
                    className="min-h-[100px] resize-none w-full max-w-full break-words overflow-hidden"
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
          <div className="pt-2 border-t border-border/30">
            <Button
              variant="outline"
              onClick={addThought}
              className="w-full h-12 border-dashed hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Thought
            </Button>
          </div>
        )}

      </div>
    </CBTStepWrapper>
  );
}