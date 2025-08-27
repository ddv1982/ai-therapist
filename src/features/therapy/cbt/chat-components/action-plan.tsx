'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TherapySlider } from '@/components/ui/therapy-slider';
import { CheckSquare, Target } from 'lucide-react';
import { CBTStepWrapper } from '@/components/ui/cbt-step-wrapper';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
// Removed CBTFormValidationError import - validation errors not displayed
import type { ActionPlanData, EmotionData } from '@/types/therapy';
// Removed chat bridge imports - individual data no longer sent during session

// Remove local interfaces - use the ones from cbtSlice
// export interface EmotionData {
//   fear: number;
//   anger: number;
//   sadness: number;
//   joy: number;
//   anxiety: number;
//   shame: number;
//   guilt: number;
//   other?: string;
//   otherIntensity?: number;
// }

// export interface ActionPlanData {
//   finalEmotions: EmotionData;
//   originalThoughtCredibility: number;
//   newBehaviors: string;
//   alternativeResponses: Array<{ response: string }>;
// }


interface ActionPlanProps {
  onComplete: (data: ActionPlanData) => void;
  initialData?: ActionPlanData;
  initialEmotions?: EmotionData; // For comparison
  customEmotion?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}



export function ActionPlan({ 
  onComplete, 
  initialData,
  initialEmotions,
  customEmotion,
  title = "Future Action Plan",
  subtitle = "Plan your responses for similar situations",
  stepNumber: _stepNumber,
  totalSteps: _totalSteps,
  className 
}: ActionPlanProps) {
  const { sessionData, actionActions } = useCBTDataManager();
  
  // Get action plan data from unified CBT hook
  const actionPlanData = sessionData.actionPlan;
  const lastModified = sessionData.lastModified;
  
  const defaultEmotions: EmotionData = {
    fear: 0,
    anger: 0,
    sadness: 0,
    joy: 0,
    anxiety: 0,
    shame: 0,
    guilt: 0,
    other: customEmotion,
    otherIntensity: 0
  };

  // Default action plan data
  const defaultActionData: ActionPlanData = {
    finalEmotions: defaultEmotions,
    originalThoughtCredibility: 5,
    newBehaviors: ''
  } as ActionPlanData;

  // Initialize local state for form
  const [actionData, setActionData] = useState<ActionPlanData>(() => {
    
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData) {
      return {
        finalEmotions: initialData.finalEmotions || actionPlanData?.finalEmotions || defaultActionData.finalEmotions,
        originalThoughtCredibility: initialData.originalThoughtCredibility || actionPlanData?.originalThoughtCredibility || defaultActionData.originalThoughtCredibility,
        newBehaviors: initialData.newBehaviors || actionPlanData?.newBehaviors || defaultActionData.newBehaviors
      } as ActionPlanData;
    }
    
    if (actionPlanData) {
      return {
        ...actionPlanData,
        finalEmotions: { ...actionPlanData.finalEmotions, other: customEmotion } // Ensure custom emotion is preserved
      };
    }
    
    return {
      ...defaultActionData,
      finalEmotions: { ...defaultActionData.finalEmotions, other: customEmotion } // Ensure custom emotion is preserved
    } as ActionPlanData;
  });

  // Auto-save when action data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      actionActions.updateActionPlan(actionData);
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [actionData, actionActions]);

  // Visual indicator for auto-save (based on Redux lastModified)
  const isDraftSaved = !!lastModified;
  
  // Note: Chat bridge no longer used - data sent only in final comprehensive summary

  // Core emotions with visual styling using fitting colors
  const coreEmotions = [
    { key: 'fear', label: 'Fear', emoji: '😨', color: 'bg-slate-600' },
    { key: 'anger', label: 'Anger', emoji: '😠', color: 'bg-red-600' },
    { key: 'sadness', label: 'Sadness', emoji: '😢', color: 'bg-blue-600' },
    { key: 'joy', label: 'Joy', emoji: '😊', color: 'bg-yellow-500' },
    { key: 'anxiety', label: 'Anxiety', emoji: '😰', color: 'bg-orange-500' },
    { key: 'shame', label: 'Shame', emoji: '😳', color: 'bg-pink-600' },
    { key: 'guilt', label: 'Guilt', emoji: '😔', color: 'bg-indigo-600' }
  ];

  const handleFieldChange = useCallback((field: keyof ActionPlanData, value: unknown) => {
    setActionData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Alternative responses removed per new requirements

  const handleSubmit = useCallback(async () => {
    // Update store with final data
    actionActions.updateActionPlan(actionData);
    
    // Note: Sending to chat happens in the final reflection step.
    onComplete(actionData);
  }, [actionData, actionActions, onComplete]);

  // Check if emotions have been rated
  // const hasRatedEmotions = Object.entries(actionData.finalEmotions).some(([key, value]) => {
  //   if (key === 'other') return false;
  //   if (key === 'otherIntensity') return customEmotion && value > 0;
  //   return typeof value === 'number' && value > 0;
  // });

  const emotionChanges = coreEmotions.map(emotion => {
    const current = actionData.finalEmotions[emotion.key as keyof EmotionData] as number;
    const initial = initialEmotions?.[emotion.key as keyof EmotionData] as number || 0;
    return { ...emotion, current, initial, change: current - initial };
  });

  const overallImprovement = emotionChanges.reduce((acc, emotion) => {
    if (['fear', 'anger', 'sadness', 'anxiety', 'shame', 'guilt'].includes(emotion.key)) {
      return acc - emotion.change; // Negative emotions going down is good
    } else {
      return acc + emotion.change; // Positive emotions going up is good
    }
  }, 0);

  // Validation for basic requirements
  const isBasicValid = actionData.newBehaviors.trim().length > 0;

  // Validation logic - keeps form functional without showing error messages

  // Next handler for CBTStepWrapper
  const handleNext = useCallback(async () => {
    await handleSubmit();
  }, [handleSubmit]);

  return (
    <CBTStepWrapper
      step="actions"
      title={title}
      subtitle={subtitle}
      isValid={isBasicValid}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={"Continue to Reflection"}
      className={className}
    >
      <Card className="border-border bg-card">
        <CardHeader className="p-4 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            Action Plan & Reflection
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Plan your future responses and reflect on progress</p>
            <div className="flex items-center gap-2">
              {overallImprovement > 0 && (
                <Badge variant="default" className="bg-primary/10 text-primary">
                  Improvement: +{overallImprovement}
                </Badge>
              )}
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
        </CardHeader>

      <CardContent className="p-4 pt-0 space-y-6">
        {/* Reflection Questions First */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Reflection & Action Planning
          </h4>
          
          {/* Original thought credibility */}
          <div className="space-y-4">
            <TherapySlider
              type="credibility"
              label="How much do you believe your original automatic thoughts now?"
              value={actionData.originalThoughtCredibility}
              onChange={(value) => handleFieldChange('originalThoughtCredibility', value)}
            />
          </div>
        </div>

        {/* New Behaviors */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Future Action Plan
          </h4>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              What will you do differently next time this situation arises?
            </label>
            <Textarea
              placeholder="Describe new behaviors or responses you want to try. Be specific about what you'll do, say, or think differently..."
              value={actionData.newBehaviors}
              onChange={(e) => handleFieldChange('newBehaviors', e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        {/* Alternative Responses removed */}

        {/* Final emotions moved to dedicated step */}

        {/* Helper Text */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            🎉 Great work completing this CBT reflection! You&apos;ve made important insights.
          </p>
          {overallImprovement > 0 && (
            <p className="text-xs text-green-600 font-medium">
              Your emotional state has improved through this process
            </p>
          )}
        </div>

      </CardContent>
    </Card>
    </CBTStepWrapper>
  );
}