'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { CBTStepWrapper } from '@/components/ui/cbt-step-wrapper';
import { TherapySlider } from '@/components/ui/therapy-slider';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { EmotionData } from '@/types/therapy';
import {useTranslations} from 'next-intl';

// Remove local interface - use the one from cbtSlice
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

interface EmotionScaleProps {
  onComplete?: (data: EmotionData) => void;
  type?: 'initial' | 'final';
  className?: string;
}

export function EmotionScale({ 
  onComplete,
  type = 'initial',
  className 
}: EmotionScaleProps) {
  const { 
    sessionData,
    sessionActions 
  } = useCBTDataManager();
  const t = useTranslations('cbt');
  
  // Get current emotion data from unified state (sessionData stores current emotions)
  const currentEmotions = useMemo(() => 
    sessionData?.emotions || { fear: 0, anger: 0, sadness: 0, joy: 0, anxiety: 0, shame: 0, guilt: 0 },
    [sessionData?.emotions]
  );
  const [showCustom, setShowCustom] = useState(Boolean(currentEmotions.other));

  // Core emotions with visual styling using design system colors
  const coreEmotions = [
    { key: 'fear', label: 'Fear', emoji: '😨', color: 'bg-muted-foreground' },
    { key: 'anger', label: 'Anger', emoji: '😠', color: 'bg-muted-foreground' },
    { key: 'sadness', label: 'Sadness', emoji: '😢', color: 'bg-muted-foreground' },
    { key: 'joy', label: 'Joy', emoji: '😊', color: 'bg-primary' },
    { key: 'anxiety', label: 'Anxiety', emoji: '😰', color: 'bg-muted-foreground' },
    { key: 'shame', label: 'Shame', emoji: '😳', color: 'bg-muted-foreground' },
    { key: 'guilt', label: 'Guilt', emoji: '😔', color: 'bg-muted-foreground' }
  ];

  // Validation logic - keeps form functional without showing error messages

  const handleEmotionChange = useCallback((key: keyof EmotionData, value: number) => {
    const updatedEmotions = { ...currentEmotions, [key]: value };
    sessionActions.updateEmotions(updatedEmotions);
  }, [currentEmotions, sessionActions]);

  // Check if any emotions are selected
  const hasSelectedEmotions = Object.entries(currentEmotions).some(([key, value]) => {
    if (key === 'other') return false;
    if (key === 'otherIntensity') return currentEmotions.other && typeof value === 'number' && value > 0;
    return typeof value === 'number' && value > 0;
  });

  const handleCustomEmotionChange = useCallback((value: string) => {
    const updatedEmotions = { ...currentEmotions, other: value };
    sessionActions.updateEmotions(updatedEmotions);
  }, [currentEmotions, sessionActions]);

  const handleNext = useCallback(async () => {
    if (hasSelectedEmotions) {
      // Ensure emotions are saved to session
      sessionActions.updateEmotions(currentEmotions);
      
      // Call parent completion handler if provided
      if (onComplete) {
        onComplete(currentEmotions);
      }
    }
  }, [hasSelectedEmotions, currentEmotions, sessionActions, onComplete]);

  const selectedCount = Object.entries(currentEmotions).filter(([key, value]) => {
    if (key === 'other') return false;
    if (key === 'otherIntensity') return currentEmotions.other && typeof value === 'number' && value > 0;
    return typeof value === 'number' && value > 0;
  }).length;

  return (
    <CBTStepWrapper
      step="emotions"
      title={type === 'initial' ? t('emotions.title') : t('emotions.titleNow')}
      subtitle={type === 'initial' ? t('emotions.subtitle') : t('emotions.subtitleNow')}
      icon={<Heart className="w-6 h-6" />}
      isValid={hasSelectedEmotions}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={`${t('emotions.next')}${selectedCount > 0 ? ` (${selectedCount} ${t('finalEmotions.emotions')})` : ''}`}
      helpText={t('emotions.help')}
      hideProgressBar={true} // Parent page shows progress
      className={className}
    >
      <div className="space-y-6">
        {hasSelectedEmotions && (
          <div className="text-center">
            <p className="text-sm text-primary font-semibold">{selectedCount} {t('finalEmotions.selected')}</p>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Emotion Cards Grid - 2 per row for compact layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {coreEmotions.map((emotion) => {
            const value = currentEmotions[emotion.key as keyof EmotionData] as number;
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
                          <p className="text-sm text-muted-foreground">
                            {value === 0 && "Not present"}
                            {value > 0 && value <= 2 && "Mild"}
                            {value > 2 && value <= 5 && "Moderate"} 
                            {value > 5 && value <= 7 && "Strong"}
                            {value > 7 && value <= 9 && "Very strong"}
                            {value === 10 && "Overwhelming"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <>
                          <span className="text-sm font-semibold text-primary">{value}/10</span>
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
                      <TherapySlider
                        type="intensity"
                        label=""
                        value={value}
                        onChange={(newValue) => handleEmotionChange(emotion.key as keyof EmotionData, newValue)}
                        min={1}
                        max={10}
                        className="w-full"
                        labelSize="xs"
                      />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

          {/* Custom Emotion Section */}
          <div className="border-t border-border/30 pt-4">
            {!showCustom ? (
              <Button
                variant="outline"
                onClick={() => setShowCustom(true)}
                className="w-full border-dashed hover:bg-accent hover:text-accent-foreground h-10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Emotion
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Custom emotion (e.g., jealousy, excitement, grateful)"
                    value={currentEmotions.other || ''}
                    onChange={(e) => handleCustomEmotionChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCustom(false);
                      sessionActions.updateEmotions({ ...currentEmotions, other: '', otherIntensity: 0 });
                    }}
                    size="sm"
                    className="px-3 hover:bg-destructive/10 hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
                {currentEmotions.other && (
                  <Card className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                            💭
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{currentEmotions.other}</h4>
                            <p className="text-sm text-muted-foreground">
                              {(currentEmotions.otherIntensity || 0) === 0 && "Not present"}
                              {(currentEmotions.otherIntensity || 0) > 0 && (currentEmotions.otherIntensity || 0) <= 2 && "Mild"}
                              {(currentEmotions.otherIntensity || 0) > 2 && (currentEmotions.otherIntensity || 0) <= 5 && "Moderate"} 
                              {(currentEmotions.otherIntensity || 0) > 5 && (currentEmotions.otherIntensity || 0) <= 7 && "Strong"}
                              {(currentEmotions.otherIntensity || 0) > 7 && (currentEmotions.otherIntensity || 0) <= 9 && "Very strong"}
                              {(currentEmotions.otherIntensity || 0) === 10 && "Overwhelming"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary">{currentEmotions.otherIntensity || 0}/10</span>
                      </div>
                      <div className="space-y-1">
                        <TherapySlider
                          type="intensity"
                          label=""
                          value={currentEmotions.otherIntensity || 1}
                          onChange={(value) => handleEmotionChange('otherIntensity', value)}
                          min={1}
                          max={10}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CBTStepWrapper>
  );
}