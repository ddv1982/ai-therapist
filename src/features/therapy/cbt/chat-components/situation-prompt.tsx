'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Send, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { loadCBTDraft, useDraftSaver, CBT_DRAFT_KEYS, clearCBTDraft } from '@/lib/utils/cbt-draft-utils';

export interface SituationData {
  date: string;
  description: string;
  context?: string;
}

interface SituationPromptProps {
  onComplete: (data: SituationData) => void;
  initialData?: SituationData;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

export function SituationPrompt({ 
  onComplete, 
  initialData,
  stepNumber,
  totalSteps,
  className 
}: SituationPromptProps) {
  // Load draft data on mount
  const defaultSituationData: SituationData = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    context: 'User-reported situation'
  };

  const [situationData, setSituationData] = useState<SituationData>(() => {
    const draftData = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, defaultSituationData);
    return {
      date: initialData?.date || draftData.date,
      description: initialData?.description || draftData.description,
      context: initialData?.context || draftData.context
    };
  });

  // Convert string date to Date object for DatePicker
  const selectedDate = React.useMemo(() => {
    if (!situationData.date) return undefined;
    const parts = situationData.date.split('-');
    if (parts.length !== 3) return undefined;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }, [situationData.date]);
  
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [error, setError] = useState('');

  // Auto-save draft as user types
  const { isDraftSaved } = useDraftSaver(CBT_DRAFT_KEYS.SITUATION, situationData);

  // Common situation prompts for quick selection
  const situationPrompts = [
    "A conflict with someone important to me",
    "Feeling overwhelmed at work or school", 
    "Anxiety about an upcoming event",
    "A recent disappointment or setback",
    "Family or relationship stress",
    "Health or medical concerns",
    "Social anxiety in a group setting",
    "Making an important decision",
    "Financial worries or concerns",
    "Dealing with change or uncertainty"
  ];

  const handlePromptSelect = useCallback((prompt: string) => {
    setSituationData(prev => ({ ...prev, description: prompt }));
    setSelectedPrompt(prompt);
    setError('');
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setSituationData(prev => ({ ...prev, description: value }));
    setSelectedPrompt(''); // Clear selection when manually typing
    setError('');
  }, []);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      setSituationData(prev => ({ ...prev, date: dateString }));
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (situationData.description.trim().length < 5) {
      setError('Please describe the situation with at least 5 characters');
      return;
    }

    const completedData: SituationData = {
      ...situationData,
      description: situationData.description.trim()
    };

    // Clear the draft since step is completed
    clearCBTDraft(CBT_DRAFT_KEYS.SITUATION);
    
    onComplete(completedData);
  }, [situationData, onComplete]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isValid = situationData.description.trim().length >= 5;
  const charCount = situationData.description.length;

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Conversational Header */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
          <MapPin className="w-4 h-4" />
          Step {stepNumber} of {totalSteps}: Let&apos;s start with what happened
        </div>
      </div>

      <Card className="p-4 border-border bg-card">
        <div className="space-y-6 relative">
          {/* Compact Date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">When:</span>
            <div className="flex-1">
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                placeholder="Select date"
                className="w-full"
                maxDate={new Date()}
              />
            </div>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all duration-300 ${
              isDraftSaved 
                ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 opacity-100 scale-100' 
                : 'opacity-0 scale-95'
            }`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Saved
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick options:</p>
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
                      "text-xs h-8 px-3 text-left justify-start",
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
              placeholder="Tell me what happened..."
              value={situationData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[80px] resize-none"
              maxLength={1000}
            />
            
            {error && (
              <p className="text-destructive text-xs">{error}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{charCount < 5 ? "Need a few more details" : "Looking good!"}</span>
              <span>{charCount}/1000</span>
            </div>
          </div>

          {/* Compact Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-50"
          >
            {/* Shimmer effect */}
            <div className="shimmer-effect"></div>
            <Send className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Continue to Emotions</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}