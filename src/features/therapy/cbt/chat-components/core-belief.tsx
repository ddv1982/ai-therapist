'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TherapySlider } from '@/components/ui/therapy-slider';
import { CBTStepWrapper } from '@/components/ui/cbt-step-wrapper';
import { Target } from 'lucide-react';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { CoreBeliefData } from '@/types/therapy';
// Removed chat bridge imports - individual data no longer sent during session

// Remove local interface - use the one from cbtSlice
// export interface CoreBeliefData {
//   coreBeliefText: string;
//   coreBeliefCredibility: number;
// }

interface CoreBeliefProps {
  onComplete: (data: CoreBeliefData) => void;
  initialData?: CoreBeliefData;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}


export function CoreBelief({ 
  onComplete, 
  initialData,
  stepNumber: _stepNumber,
  totalSteps: _totalSteps,
  className 
}: CoreBeliefProps) {
  const { sessionData, beliefActions } = useCBTDataManager();
  
  // Get core beliefs data from unified CBT hook
  const coreBelifsData = sessionData.coreBeliefs;
  
  // Default core belief data
  const defaultBeliefData: CoreBeliefData = {
    coreBeliefText: '',
    coreBeliefCredibility: 5
  };

  const [beliefData, setBeliefData] = useState<CoreBeliefData>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData) {
      return initialData;
    }
    
    // Return first Redux core belief if it exists, otherwise default
    return coreBelifsData.length > 0 ? coreBelifsData[0] : defaultBeliefData;
  });

  // Auto-save to unified CBT state when belief data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      beliefActions.updateCoreBeliefs([beliefData]);
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [beliefData, beliefActions]);
  
  // Note: Chat bridge no longer used - data sent only in final comprehensive summary

  const handleBeliefChange = useCallback((value: string) => {
    setBeliefData(prev => ({ ...prev, coreBeliefText: value }));
  }, []);

  const handleCredibilityChange = useCallback((value: number) => {
    setBeliefData(prev => ({ ...prev, coreBeliefCredibility: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (beliefData.coreBeliefText.trim()) {
      // Update unified CBT state with final data
      beliefActions.updateCoreBeliefs([beliefData]);
      
      // Note: Individual core belief data is no longer sent to chat during session.
      // All data will be included in the comprehensive summary at the end.
      
      onComplete(beliefData);
    }
  }, [beliefData, beliefActions, onComplete]);

  const isValid = beliefData.coreBeliefText.trim().length > 0;

  // Validation logic - keeps form functional without showing error messages

  const handleNext = useCallback(async () => {
    await handleSubmit();
  }, [handleSubmit]);

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
    <CBTStepWrapper
      step="core-belief"
      title="Core Belief Exploration"
      subtitle="What deeper belief might be behind these thoughts?"
      icon={<Target className="w-5 h-5" />}
      isValid={isValid}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText="Continue to Challenge Questions"
      helpText="Identify the underlying belief that drives your automatic thoughts."
      className={className}
    >
      <div className="space-y-6">
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
            <TherapySlider
              type="credibility"
              label="How much do you believe this core belief right now?"
              value={beliefData.coreBeliefCredibility}
              onChange={handleCredibilityChange}
            />
          )}
      </div>
    </CBTStepWrapper>
  );
}