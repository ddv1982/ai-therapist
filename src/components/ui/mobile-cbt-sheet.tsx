'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentStep, updateDraft, completeCBTEntry } from '@/store/slices/cbtSlice';
import { SituationPrompt, EmotionScale, ThoughtRecord, FinalEmotionReflection, ActionPlan } from '@/features/therapy/cbt/chat-components';
import { Progress } from "@/components/ui/progress";
import { Brain } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface MobileCBTSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CBT_STEPS = [
  { id: 1, name: 'Situation', component: 'situation' },
  { id: 2, name: 'Emotions', component: 'emotions' },
  { id: 3, name: 'Thoughts', component: 'thoughts' },
  { id: 4, name: 'Action Plan', component: 'actions' },
  { id: 5, name: 'Final Emotions', component: 'final-emotions' },
];

export function MobileCBTSheet({ isOpen, onOpenChange }: MobileCBTSheetProps) {
  const dispatch = useAppDispatch();
  const currentDraft = useAppSelector(state => state.cbt?.currentDraft);
  const currentStep = useAppSelector(state => state.cbt?.currentStep || 1);
  // const isSubmitting = useAppSelector(state => state.cbt.isSubmitting);

  const progressPercentage = (currentStep / CBT_STEPS.length) * 100;
  const currentStepData = CBT_STEPS.find(step => step.id === currentStep);

  const handleSituationComplete = (data: import('@/store/slices/cbtSlice').SituationData) => {
    dispatch(updateDraft({ situation: data.situation }));
    dispatch(setCurrentStep(2));
  };

  const handleEmotionComplete = (data: import('@/store/slices/cbtSlice').EmotionData) => {
    // Convert EmotionData to CBT schema format
    const emotions = [
      { emotion: 'fear', intensity: data.fear },
      { emotion: 'anger', intensity: data.anger },
      { emotion: 'sadness', intensity: data.sadness },
      { emotion: 'joy', intensity: data.joy },
      { emotion: 'anxiety', intensity: data.anxiety },
      { emotion: 'shame', intensity: data.shame },
      { emotion: 'guilt', intensity: data.guilt },
      ...(data.other ? [{ emotion: data.other, intensity: data.otherIntensity || 0 }] : [])
    ].filter(emotion => emotion.intensity > 0); // Only include emotions with intensity > 0
    
    dispatch(updateDraft({ emotions }));
    dispatch(setCurrentStep(3));
  };

  const handleThoughtComplete = (data: import('@/store/slices/cbtSlice').ThoughtData[]) => {
    // Convert ThoughtData array to string array for CBT schema
    const thoughts = data.map(thought => thought.thought);
    dispatch(updateDraft({ thoughts }));
    dispatch(setCurrentStep(4));
  };

  const handleFinalEmotionsComplete = () => {
    // In mobile flow, store final emotions in draft or session slice if needed; advance to actions
    // Here we only advance steps. ActionPlan will persist as part of session actions.
    dispatch(setCurrentStep(5));
  };

  const handleActionComplete = (data: import('@/store/slices/cbtSlice').ActionPlanData) => {
    if (currentDraft) {
      // Convert ActionPlanData to CBT schema structure
      const actionPlan = {
        actions: [data.newBehaviors],
        timeframe: 'As planned',
        resources: []
      };
      
      const completeEntry = {
        ...currentDraft.data,
        actionPlan,
      };
      
      // Validate all required fields are present and have correct types
      if (
        completeEntry.situation && 
        completeEntry.emotions && 
        completeEntry.thoughts &&
        Array.isArray(completeEntry.emotions) && 
        Array.isArray(completeEntry.thoughts)
      ) {
        // Type assertion is safe here because we've validated all required fields
        dispatch(completeCBTEntry(completeEntry as import('@/store/slices/cbtSlice').CBTFormData));
        onOpenChange(false);
      }
    }
  };

  const handleSendToChat = () => {
    // This would integrate with chat to send CBT summary
    logger.therapeuticOperation('cbt_send_to_chat', {
      component: 'MobileCBTSheet',
      step: currentStep,
      hasDraft: !!currentDraft
    });
  };

  const renderCurrentStep = () => {
    if (!currentStepData || !currentDraft) return null;

    const stepNumber = currentStep;
    const totalSteps = CBT_STEPS.length;

    switch (currentStepData.component) {
      case 'situation':
        return (
          <SituationPrompt
            onComplete={handleSituationComplete}
          />
        );
      
      case 'emotions':
        return (
          <EmotionScale
            onComplete={handleEmotionComplete}
          />
        );
      
      case 'thoughts':
        return (
          <ThoughtRecord
            onComplete={handleThoughtComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        );
      
      case 'final-emotions':
        return (
          <FinalEmotionReflection
            onComplete={handleFinalEmotionsComplete}
            onSendToChat={handleSendToChat}
          />
        );

      case 'actions':
        return (
          <ActionPlan
            onComplete={handleActionComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        );
      
      default:
        return null;
    }
  };

  if (!currentDraft) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <SheetTitle>CBT Diary Session</SheetTitle>
          </div>
          <SheetDescription>
            Work through your thoughts and emotions step by step
          </SheetDescription>
          
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep} of {CBT_STEPS.length}: {currentStepData?.name}
              </span>
              <span className="text-primary font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
          
          {/* Step Navigation */}
          <div className="flex justify-between text-xs">
            {CBT_STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center py-2 px-1 rounded-sm transition-colors ${
                  step.id === currentStep
                    ? 'bg-primary/10 text-primary font-medium'
                    : step.id < currentStep
                    ? 'text-muted-foreground bg-muted/30'
                    : 'text-muted-foreground/60'
                }`}
              >
                {step.name}
              </div>
            ))}
          </div>
        </SheetHeader>

        {/* Current Step Content */}
        <div className="flex-1 pb-safe">
          {renderCurrentStep()}
        </div>
      </SheetContent>
    </Sheet>
  );
}