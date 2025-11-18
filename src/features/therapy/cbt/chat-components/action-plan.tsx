'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TherapySlider } from '@/components/ui/therapy-slider';
import { CheckSquare, Target } from 'lucide-react';
import { CBTStepWrapper } from '@/components/ui/cbt-step-wrapper';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { ActionPlanData, CBTStepType, EmotionData } from '@/types/therapy';
import { useTranslations } from 'next-intl';
import { therapeuticTypography } from '@/lib/ui/design-tokens';

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
  onNavigateStep?: (step: CBTStepType) => void;
}

export function ActionPlan({
  onComplete,
  initialData,
  initialEmotions,
  customEmotion,
  title,
  subtitle,
  className,
  onNavigateStep,
}: ActionPlanProps) {
  const t = useTranslations('cbt');
  const { sessionData, actionActions } = useCBTDataManager();

  // Get action plan data from unified CBT hook
  const actionPlanData = sessionData?.actionPlan;
  const lastModified = sessionData?.lastModified;

  const defaultEmotions: EmotionData = {
    fear: 0,
    anger: 0,
    sadness: 0,
    joy: 0,
    anxiety: 0,
    shame: 0,
    guilt: 0,
    other: customEmotion,
    otherIntensity: 0,
  };

  // Default action plan data
  const defaultActionData: ActionPlanData = {
    finalEmotions: defaultEmotions,
    originalThoughtCredibility: 5,
    newBehaviors: '',
  } as ActionPlanData;

  // Initialize local state for form
  const [actionData, setActionData] = useState<ActionPlanData>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData) {
      return {
        finalEmotions:
          initialData.finalEmotions ||
          actionPlanData?.finalEmotions ||
          defaultActionData.finalEmotions,
        originalThoughtCredibility:
          initialData.originalThoughtCredibility ||
          actionPlanData?.originalThoughtCredibility ||
          defaultActionData.originalThoughtCredibility,
        newBehaviors:
          initialData.newBehaviors ||
          actionPlanData?.newBehaviors ||
          defaultActionData.newBehaviors,
      } as ActionPlanData;
    }

    if (actionPlanData) {
      return {
        ...actionPlanData,
        finalEmotions: { ...actionPlanData.finalEmotions, other: customEmotion }, // Ensure custom emotion is preserved
      };
    }

    return {
      ...defaultActionData,
      finalEmotions: { ...defaultActionData.finalEmotions, other: customEmotion }, // Ensure custom emotion is preserved
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
    { key: 'guilt', label: 'Guilt', emoji: '😔', color: 'bg-indigo-600' },
  ];

  const handleFieldChange = useCallback((field: keyof ActionPlanData, value: unknown) => {
    setActionData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Alternative responses removed per new requirements

  const handleSubmit = useCallback(async () => {
    // Update store with final data
    actionActions.updateActionPlan(actionData);

    // Note: Sending to chat happens in the final reflection step.
    onComplete(actionData);
  }, [actionData, actionActions, onComplete]);

  const emotionChanges = coreEmotions.map((emotion) => {
    const current = actionData.finalEmotions[emotion.key as keyof EmotionData] as number;
    const initial = (initialEmotions?.[emotion.key as keyof EmotionData] as number) || 0;
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
      title={title ?? t('actionPlan.title')}
      subtitle={subtitle ?? t('actionPlan.subtitle')}
      isValid={isBasicValid}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={t('actionPlan.nextToReflection')}
      hideProgressBar={true}
      className={className}
      onNavigateStep={onNavigateStep}
    >
      <Card className="border-border bg-card">
        <CardHeader className="p-4 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <CheckSquare className="text-primary h-5 w-5" />
            {t('actionPlan.header')}
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">{t('actionPlan.headerDesc')}</p>
            <div className="flex items-center gap-2">
              {overallImprovement > 0 && (
                <Badge variant="default" className="bg-primary/10 text-primary">
                  {t('actionPlan.improvement')}: +{overallImprovement}
                </Badge>
              )}
              <div
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-all duration-200 ${
                  isDraftSaved
                    ? 'scale-100 bg-green-50 text-green-700 opacity-100 ring-1 ring-green-600/10 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/20'
                    : 'scale-95 opacity-0'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                {t('status.saved')}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-4 pt-0">
          {/* Reflection Questions First */}
          <div className="space-y-4">
            <h4 className="text-foreground flex items-center gap-2 text-base font-semibold">
              <Target className="h-4 w-4" />
              {t('actionPlan.reflectionTitle')}
            </h4>

            {/* Original thought credibility */}
            <div className="space-y-4">
              <TherapySlider
                type="credibility"
                label={t('actionPlan.originalThoughtCredibility')}
                value={actionData.originalThoughtCredibility}
                onChange={(value) => handleFieldChange('originalThoughtCredibility', value)}
              />
            </div>
          </div>

          {/* New Behaviors */}
          <div className="space-y-4">
            <h4 className="text-foreground flex items-center gap-2 text-base font-semibold">
              <Target className="h-4 w-4" />
              {t('actionPlan.futureActionTitle')}
            </h4>
            <div className="space-y-2">
              <label className={therapeuticTypography.label}>
                {t('actionPlan.futureActionLabel')}
              </label>
              <Textarea
                placeholder={t('actionPlan.futureActionPlaceholder')}
                value={actionData.newBehaviors}
                onChange={(e) => handleFieldChange('newBehaviors', e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Alternative Responses removed */}

          {/* Final emotions moved to dedicated step */}

          {/* Helper Text */}
          <div className="space-y-2 text-center">
            <p className={therapeuticTypography.smallSecondary}>{t('actionPlan.successMessage')}</p>
            {overallImprovement > 0 && (
              <p className="text-sm font-semibold text-green-600">
                {t('actionPlan.improvedState')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </CBTStepWrapper>
  );
}
