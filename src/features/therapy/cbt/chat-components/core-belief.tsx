'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Target } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { loadCBTDraft, useDraftSaver, CBT_DRAFT_KEYS, clearCBTDraft } from '@/lib/utils/cbt-draft-utils';

export interface CoreBeliefData {
  coreBeliefText: string;
  coreBeliefCredibility: number;
}

interface CoreBeliefProps {
  onComplete: (data: CoreBeliefData) => void;
  initialData?: CoreBeliefData;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

// Credibility slider component
interface CredibilitySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const CredibilitySlider: React.FC<CredibilitySliderProps> = ({ 
  label, 
  value, 
  onChange, 
  className 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-sm text-muted-foreground font-mono">{value}/10</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 - Not at all</span>
        <span>5 - Somewhat</span>
        <span>10 - Completely</span>
      </div>
    </div>
  );
};

export function CoreBelief({ 
  onComplete, 
  initialData,
  stepNumber,
  totalSteps,
  className 
}: CoreBeliefProps) {
  // Default core belief data
  const defaultBeliefData: CoreBeliefData = {
    coreBeliefText: '',
    coreBeliefCredibility: 5
  };

  const [beliefData, setBeliefData] = useState<CoreBeliefData>(() => {
    const draftData = loadCBTDraft(CBT_DRAFT_KEYS.CORE_BELIEF, defaultBeliefData);
    return {
      coreBeliefText: initialData?.coreBeliefText || draftData.coreBeliefText,
      coreBeliefCredibility: initialData?.coreBeliefCredibility || draftData.coreBeliefCredibility
    };
  });

  // Auto-save draft as user types
  const { isDraftSaved } = useDraftSaver(CBT_DRAFT_KEYS.CORE_BELIEF, beliefData);

  const handleBeliefChange = useCallback((value: string) => {
    setBeliefData(prev => ({ ...prev, coreBeliefText: value }));
  }, []);

  const handleCredibilityChange = useCallback((value: number) => {
    setBeliefData(prev => ({ ...prev, coreBeliefCredibility: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (beliefData.coreBeliefText.trim()) {
      // Clear the draft since step is completed
      clearCBTDraft(CBT_DRAFT_KEYS.CORE_BELIEF);
      
      onComplete(beliefData);
    }
  }, [beliefData, onComplete]);

  const isValid = beliefData.coreBeliefText.trim().length > 0;

  // Common belief prompts
  const beliefPrompts = [
    "I'm not good enough",
    "I'm unlovable", 
    "I'm powerless",
    "The world is dangerous",
    "I must be perfect",
    "I can't trust anyone"
  ];

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Conversational Header */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
          <Target className="w-4 h-4" />
          Step {stepNumber} of {totalSteps}: Core belief exploration
        </div>
        <div className={`mt-2 flex justify-center`}>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all duration-300 ${
            isDraftSaved 
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 opacity-100 scale-100' 
              : 'opacity-0 scale-95'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Saved
          </div>
        </div>
      </div>

      <Card className="p-4 border-border bg-card">
        <div className="space-y-4">
          {/* Quick Belief Prompts */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Common core beliefs:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {beliefPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleBeliefChange(prompt)}
                  className="text-xs h-8 px-3 border-dashed hover:bg-accent hover:text-accent-foreground text-left justify-start"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Core Belief Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="What core belief about yourself, others, or the world might be driving these thoughts?"
              value={beliefData.coreBeliefText}
              onChange={(e) => handleBeliefChange(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{beliefData.coreBeliefText.length < 3 ? "Identify the core belief" : "Good insight!"}</span>
              <span>{beliefData.coreBeliefText.length}/500</span>
            </div>
          </div>

          {/* Credibility Slider */}
          {isValid && (
            <CredibilitySlider
              label="How much do you believe this core belief right now?"
              value={beliefData.coreBeliefCredibility}
              onChange={handleCredibilityChange}
            />
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-50"
          >
            {/* Shimmer effect */}
            <div className="shimmer-effect"></div>
            <Send className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Continue to Challenge Questions</span>
          </Button>
          
          {!isValid && (
            <p className="text-xs text-muted-foreground text-center">
              Describe the core belief to continue
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}