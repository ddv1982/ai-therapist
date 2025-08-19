'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TherapySlider } from '@/components/ui/therapy-slider';
import { CheckSquare, Heart, Plus, Minus, Target } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
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
  onSendToChat?: () => void;
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
  onSendToChat,
  initialData,
  initialEmotions,
  customEmotion,
  title = "How do you feel now?",
  subtitle = "Reflect on changes and plan for the future",
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
    newBehaviors: '',
    alternativeResponses: [{ response: '' }]
  };

  // Initialize local state for form
  const [actionData, setActionData] = useState<ActionPlanData>(() => {
    
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData) {
      return {
        finalEmotions: initialData.finalEmotions || actionPlanData?.finalEmotions || defaultActionData.finalEmotions,
        originalThoughtCredibility: initialData.originalThoughtCredibility || actionPlanData?.originalThoughtCredibility || defaultActionData.originalThoughtCredibility,
        newBehaviors: initialData.newBehaviors || actionPlanData?.newBehaviors || defaultActionData.newBehaviors,
        alternativeResponses: initialData.alternativeResponses || actionPlanData?.alternativeResponses || defaultActionData.alternativeResponses
      };
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
    };
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

  const handleEmotionChange = useCallback((key: keyof EmotionData, value: number) => {
    setActionData(prev => ({
      ...prev,
      finalEmotions: { ...prev.finalEmotions, [key]: value }
    }));
  }, []);

  const handleFieldChange = useCallback((field: keyof ActionPlanData, value: unknown) => {
    setActionData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAlternativeResponseChange = useCallback((index: number, value: string) => {
    setActionData(prev => ({
      ...prev,
      alternativeResponses: prev.alternativeResponses.map((response, i) => 
        i === index ? { response: value } : response
      )
    }));
  }, []);

  const addAlternativeResponse = useCallback(() => {
    if (actionData.alternativeResponses.length < 5) {
      setActionData(prev => ({
        ...prev,
        alternativeResponses: [...prev.alternativeResponses, { response: '' }]
      }));
    }
  }, [actionData.alternativeResponses.length]);

  const removeAlternativeResponse = useCallback((index: number) => {
    if (actionData.alternativeResponses.length > 1) {
      setActionData(prev => ({
        ...prev,
        alternativeResponses: prev.alternativeResponses.filter((_, i) => i !== index)
      }));
    }
  }, [actionData.alternativeResponses.length]);

  const handleSubmit = useCallback(async () => {
    // Update store with final data
    actionActions.updateActionPlan(actionData);
    
    // Note: Individual action plan data is no longer sent to chat during session.
    // All data will be included in the comprehensive summary at the end.
    
    // If onSendToChat is provided (CBT diary flow), use that, otherwise complete normally
    if (onSendToChat) {
      onComplete(actionData);
      onSendToChat();
    } else {
      onComplete(actionData);
    }
  }, [actionData, actionActions, onComplete, onSendToChat]);

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
  const isBasicValid = actionData.newBehaviors.trim().length > 0 &&
    actionData.alternativeResponses.some(response => response.response.trim().length > 0);

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
      nextButtonText={onSendToChat ? "Send to Chat" : "Complete"}
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

      <CardContent className="p-0 space-y-6">
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
            <label className="text-base font-medium text-foreground">
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

        {/* Alternative Responses */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Alternative Responses</h4>
          <div className="space-y-4">
            {actionData.alternativeResponses.map((response, index) => (
              <Card key={index} className="p-4 bg-muted/30 border border-border/30">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-medium text-foreground">
                      Alternative Response {index + 1}
                    </label>
                    {actionData.alternativeResponses.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlternativeResponse(index)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Describe an alternative way to respond in future situations..."
                    value={response.response}
                    onChange={(e) => handleAlternativeResponseChange(index, e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </Card>
            ))}
          </div>

          {actionData.alternativeResponses.length < 5 && (
            <Button
              variant="outline"
              onClick={addAlternativeResponse}
              className="w-full h-12 border-dashed hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Alternative Response
            </Button>
          )}
        </div>

        {/* Final Emotions Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              How do you feel after this reflection?
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Rate your current emotional state
            </p>
          </div>
          
          {/* Beautiful Emotion Cards Grid - 2 per row for compact layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coreEmotions.map((emotion) => {
              const value = actionData.finalEmotions[emotion.key as keyof EmotionData] as number;
              const initialValue = initialEmotions?.[emotion.key as keyof EmotionData] as number || 0;
              const change = value - initialValue;
              const changeDirection = change > 0 ? '↗' : change < 0 ? '↘' : '→';
              // Emotion-aware coloring: joy increases = green, joy decreases = red
              // Negative emotions: increases = red, decreases = green
              const isPositiveEmotion = emotion.key === 'joy';
              const changeColor = change === 0 ? 'text-muted-foreground' : 
                (isPositiveEmotion 
                  ? (change > 0 ? 'text-green-500' : 'text-red-500')  // Joy: up=good, down=bad
                  : (change > 0 ? 'text-red-500' : 'text-green-500')); // Negative emotions: up=bad, down=good
              const isSelected = value > 0;
              
              return (
                <Card 
                  key={emotion.key} 
                  className={cn(
                    "p-3 cursor-pointer transition-colors duration-200",
                    isSelected 
                      ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
                      : "hover:border-primary/20 bg-muted/30"
                  )}
                  onClick={() => {
                    if (!isSelected) {
                      handleEmotionChange(emotion.key as keyof EmotionData, 5);
                    }
                  }}
                >
                  <div className="space-y-2">
                    {/* Emotion Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                          emotion.color
                        )}>
                          {emotion.emoji}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{emotion.label}</h4>
                          {isSelected && (
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-muted-foreground">
                                {value === 0 && "Not present"}
                                {value > 0 && value <= 2 && "Mild"}
                                {value > 2 && value <= 5 && "Moderate"} 
                                {value > 5 && value <= 7 && "Strong"}
                                {value > 7 && value <= 9 && "Very strong"}
                                {value === 10 && "Overwhelming"}
                              </p>
                              {initialValue !== undefined && (
                                <div className={cn("text-xs ml-2", changeColor)}>
                                  {changeDirection} {Math.abs(change)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <>
                            <span className="text-sm font-medium text-primary">{value}/10</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmotionChange(emotion.key as keyof EmotionData, 0);
                              }}
                              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-muted-foreground/10" />
                        )}
                      </div>
                    </div>
                    
                    {/* Slider (only shown when selected) */}
                    {isSelected && (
                      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={value}
                          onChange={(e) => handleEmotionChange(emotion.key as keyof EmotionData, parseInt(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>1</span>
                          <span className="hidden sm:inline">5</span>
                          <span>10</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            
            {/* Custom emotion if present */}
            {customEmotion && (
              <Card className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                        💭
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{customEmotion}</h4>
                        <p className="text-xs text-muted-foreground">
                          {(actionData.finalEmotions.otherIntensity || 0) === 0 && "Not present"}
                          {(actionData.finalEmotions.otherIntensity || 0) > 0 && (actionData.finalEmotions.otherIntensity || 0) <= 2 && "Mild"}
                          {(actionData.finalEmotions.otherIntensity || 0) > 2 && (actionData.finalEmotions.otherIntensity || 0) <= 5 && "Moderate"} 
                          {(actionData.finalEmotions.otherIntensity || 0) > 5 && (actionData.finalEmotions.otherIntensity || 0) <= 7 && "Strong"}
                          {(actionData.finalEmotions.otherIntensity || 0) > 7 && (actionData.finalEmotions.otherIntensity || 0) <= 9 && "Very strong"}
                          {(actionData.finalEmotions.otherIntensity || 0) === 10 && "Overwhelming"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">{actionData.finalEmotions.otherIntensity || 0}/10</span>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={actionData.finalEmotions.otherIntensity || 1}
                      onChange={(e) => handleEmotionChange('otherIntensity', parseInt(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>1</span>
                      <span className="hidden sm:inline">5</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

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