'use client';

import dynamic from 'next/dynamic';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/features/therapy/components/ui/sheet';
import { useCBT } from '@/contexts/cbt-context';
const SituationPrompt = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/situation-prompt').then((mod) => ({
    default: mod.SituationPrompt,
  }))
);

const EmotionScale = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/emotion-scale').then((mod) => ({
    default: mod.EmotionScale,
  }))
);

const ThoughtRecord = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/thought-record').then((mod) => ({
    default: mod.ThoughtRecord,
  }))
);

const FinalEmotionReflection = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/final-emotion-reflection').then((mod) => ({
    default: mod.FinalEmotionReflection,
  }))
);

const ActionPlan = dynamic(() =>
  import('@/features/therapy/cbt/chat-components/action-plan').then((mod) => ({
    default: mod.ActionPlan,
  }))
);
import { Progress } from '@/components/ui/progress';
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
  const cbt = useCBT();
  const currentDraft = cbt.currentDraft;
  const currentStep = cbt.currentStep || 1;

  const progressPercentage = (currentStep / CBT_STEPS.length) * 100;
  const currentStepData = CBT_STEPS.find((step) => step.id === currentStep);

  const handleSituationComplete = (data: import('@/types/domains/therapy').SituationData) => {
    // Use CBT context to update draft
    cbt.updateDraft({ situation: data.situation });
    cbt.setCurrentStep(2);
  };

  const handleEmotionComplete = (data: import('@/types/domains/therapy').EmotionData) => {
    // Convert EmotionData to CBT schema format
    const emotions = [
      { emotion: 'fear', intensity: data.fear },
      { emotion: 'anger', intensity: data.anger },
      { emotion: 'sadness', intensity: data.sadness },
      { emotion: 'joy', intensity: data.joy },
      { emotion: 'anxiety', intensity: data.anxiety },
      { emotion: 'shame', intensity: data.shame },
      { emotion: 'guilt', intensity: data.guilt },
      ...(data.other ? [{ emotion: data.other, intensity: data.otherIntensity || 0 }] : []),
    ].filter((emotion) => emotion.intensity > 0); // Only include emotions with intensity > 0

    cbt.updateDraft({ emotions });
    cbt.setCurrentStep(3);
  };

  const handleThoughtComplete = (data: import('@/types/domains/therapy').ThoughtData[]) => {
    // Convert ThoughtData array to string array for CBT schema
    const thoughts = data.map((thought) => thought.thought);
    cbt.updateDraft({ thoughts });
    cbt.setCurrentStep(4);
  };

  const handleFinalEmotionsComplete = () => {
    // In mobile flow, store final emotions in draft or session slice if needed; advance to actions
    // Here we only advance steps. ActionPlan will persist as part of session actions.
    cbt.setCurrentStep(5);
  };

  const handleActionComplete = (data: import('@/types/domains/therapy').ActionPlanData) => {
    if (currentDraft) {
      // Convert ActionPlanData to CBT schema structure
      const actionPlan = {
        actions: [data.newBehaviors],
        timeframe: 'As planned',
        resources: [],
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
        // Using the correct CBTFormData type from form-schema
        cbt.completeCBTEntry(
          completeEntry as unknown as import('@/features/therapy/cbt/form-schema').CBTFormData
        );
        onOpenChange(false);
      }
    }
  };

  const handleSendToChat = () => {
    // This would integrate with chat to send CBT summary
    logger.therapeuticOperation('cbt_send_to_chat', {
      component: 'MobileCBTSheet',
      step: currentStep,
      hasDraft: !!currentDraft,
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
            onNavigateStep={(step) => {
              const idx = CBT_STEPS.findIndex((s) => s.component === step);
              if (idx >= 0) cbt.setCurrentStep(CBT_STEPS[idx].id);
            }}
          />
        );

      case 'emotions':
        return (
          <EmotionScale
            onComplete={handleEmotionComplete}
            onNavigateStep={(step) => {
              const idx = CBT_STEPS.findIndex((s) => s.component === step);
              if (idx >= 0) cbt.setCurrentStep(CBT_STEPS[idx].id);
            }}
          />
        );

      case 'thoughts':
        return (
          <ThoughtRecord
            onComplete={handleThoughtComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
            onNavigateStep={(step) => {
              const idx = CBT_STEPS.findIndex((s) => s.component === step);
              if (idx >= 0) cbt.setCurrentStep(CBT_STEPS[idx].id);
            }}
          />
        );

      case 'final-emotions':
        return (
          <FinalEmotionReflection
            onComplete={handleFinalEmotionsComplete}
            onSendToChat={handleSendToChat}
            onNavigateStep={(step) => {
              const idx = CBT_STEPS.findIndex((s) => s.component === step);
              if (idx >= 0) cbt.setCurrentStep(CBT_STEPS[idx].id);
            }}
          />
        );

      case 'actions':
        return (
          <ActionPlan
            onComplete={handleActionComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
            onNavigateStep={(step) => {
              const idx = CBT_STEPS.findIndex((s) => s.component === step);
              if (idx >= 0) cbt.setCurrentStep(CBT_STEPS[idx].id);
            }}
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
      <SheetContent side="bottom" className="cbt-compact h-[90vh] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-2">
            <Brain className="text-primary h-5 w-5" />
            <SheetTitle>CBT Diary Session</SheetTitle>
          </div>
          <SheetDescription>Work through your thoughts and emotions step by step</SheetDescription>

          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep} of {CBT_STEPS.length}: {currentStepData?.name}
              </span>
              <span className="text-primary font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {/* Step Navigation */}
          <div className="flex justify-between text-sm">
            {CBT_STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 rounded-sm px-1 py-2 text-center transition-colors ${
                  step.id === currentStep
                    ? 'bg-primary/10 text-primary font-semibold'
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
        <div className="pb-safe flex-1">{renderCurrentStep()}</div>
      </SheetContent>
    </Sheet>
  );
}
