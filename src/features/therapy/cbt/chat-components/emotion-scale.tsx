'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CBTStepWrapper } from '@/components/ui/cbt-step-wrapper';
import { TherapySlider } from '@/components/ui/therapy-slider';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { CBTStepType, EmotionData } from '@/types';
import { useTranslations } from 'next-intl';
import { therapeuticTypography } from '@/lib/ui/design-tokens';

interface EmotionScaleProps {
  onComplete?: (data: EmotionData) => void;
  type?: 'initial' | 'final';
  className?: string;
  onNavigateStep?: (step: CBTStepType) => void;
}

export function EmotionScale({
  onComplete,
  type = 'initial',
  className,
  onNavigateStep,
}: EmotionScaleProps) {
  const { sessionData, sessionActions } = useCBTDataManager();
  const t = useTranslations('cbt');

  // Get current emotion data from unified state (sessionData stores current emotions)
  const currentEmotions = useMemo(
    () =>
      sessionData?.emotions || {
        fear: 0,
        anger: 0,
        sadness: 0,
        joy: 0,
        anxiety: 0,
        shame: 0,
        guilt: 0,
      },
    [sessionData?.emotions]
  );
  const [showCustom, setShowCustom] = useState(Boolean(currentEmotions.other));

  // Emotion color mapping using DS tokens; balanced, accessible hues
  const emotionColor: Record<string, string> = {
    joy: 'bg-emotion-joy',
    fear: 'bg-emotion-fear',
    anger: 'bg-emotion-anger',
    sadness: 'bg-emotion-sadness',
    anxiety: 'bg-emotion-anxiety',
    shame: 'bg-emotion-shame',
    guilt: 'bg-emotion-guilt',
  };

  // Core emotions with visual styling using emotionColor mapping
  const coreEmotions = [
    {
      key: 'fear',
      label: t('emotions.labels.fear'),
      emoji: '😨',
      color: emotionColor.fear || 'bg-muted-foreground',
    },
    {
      key: 'anger',
      label: t('emotions.labels.anger'),
      emoji: '😠',
      color: emotionColor.anger || 'bg-muted-foreground',
    },
    {
      key: 'sadness',
      label: t('emotions.labels.sadness'),
      emoji: '😢',
      color: emotionColor.sadness || 'bg-muted-foreground',
    },
    {
      key: 'joy',
      label: t('emotions.labels.joy'),
      emoji: '😊',
      color: emotionColor.joy || 'bg-primary',
    },
    {
      key: 'anxiety',
      label: t('emotions.labels.anxiety'),
      emoji: '😰',
      color: emotionColor.anxiety || 'bg-muted-foreground',
    },
    {
      key: 'shame',
      label: t('emotions.labels.shame'),
      emoji: '😳',
      color: emotionColor.shame || 'bg-muted-foreground',
    },
    {
      key: 'guilt',
      label: t('emotions.labels.guilt'),
      emoji: '😔',
      color: emotionColor.guilt || 'bg-muted-foreground',
    },
  ];

  // Validation logic - keeps form functional without showing error messages

  const handleEmotionChange = useCallback(
    (key: keyof EmotionData, value: number) => {
      const updatedEmotions = { ...currentEmotions, [key]: value };
      sessionActions.updateEmotions(updatedEmotions);
    },
    [currentEmotions, sessionActions]
  );

  // Check if any emotions are selected
  const hasSelectedEmotions = Object.entries(currentEmotions).some(([key, value]) => {
    if (key === 'other') return false;
    if (key === 'otherIntensity')
      return currentEmotions.other && typeof value === 'number' && value > 0;
    return typeof value === 'number' && value > 0;
  });

  const handleCustomEmotionChange = useCallback(
    (value: string) => {
      const updatedEmotions = { ...currentEmotions, other: value };
      sessionActions.updateEmotions(updatedEmotions);
    },
    [currentEmotions, sessionActions]
  );

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
    if (key === 'otherIntensity')
      return currentEmotions.other && typeof value === 'number' && value > 0;
    return typeof value === 'number' && value > 0;
  }).length;

  return (
    <CBTStepWrapper
      step="emotions"
      title={type === 'initial' ? t('emotions.title') : t('emotions.titleNow')}
      subtitle={type === 'initial' ? t('emotions.subtitle') : t('emotions.subtitleNow')}
      icon={<Heart className="h-6 w-6" />}
      isValid={hasSelectedEmotions}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={t('emotions.next')}
      helpText={t('emotions.help')}
      hideProgressBar={true} // Parent page shows progress
      className={className}
      onNavigateStep={onNavigateStep}
    >
      <div className="space-y-6">
        {hasSelectedEmotions && (
          <div className="text-center">
            <p className="text-primary text-sm font-semibold">
              {selectedCount} {t('finalEmotions.selected')}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Emotion Cards Grid - 2 per row for compact layout */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {coreEmotions.map((emotion) => {
              const value = currentEmotions[emotion.key as keyof EmotionData] as number;
              const isSelected = value > 0;

              return (
                <Card
                  key={emotion.key}
                  className={cn(
                    'cursor-pointer p-3 transition-colors duration-200',
                    isSelected
                      ? 'ring-primary bg-primary/5 border-primary/30 ring-2'
                      : 'hover:border-primary/20 bg-muted/30'
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
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white',
                            emotion.color
                          )}
                        >
                          {emotion.emoji}
                        </div>
                        <div>
                          <h4 className={therapeuticTypography.label}>{emotion.label}</h4>
                          {isSelected && (
                            <p className={therapeuticTypography.smallSecondary}>
                              {value === 0 && t('emotionIntensity.none')}
                              {value > 0 && value <= 2 && t('emotionIntensity.mild')}
                              {value > 2 && value <= 5 && t('emotionIntensity.moderate')}
                              {value > 5 && value <= 7 && t('emotionIntensity.strong')}
                              {value > 7 && value <= 9 && t('emotionIntensity.veryStrong')}
                              {value === 10 && t('emotionIntensity.overwhelming')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <>
                            <span className="text-primary text-sm font-semibold">{value}/10</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmotionChange(emotion.key as keyof EmotionData, 0);
                              }}
                              className="hover:bg-destructive/10 hover:text-destructive h-6 w-6 p-0"
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <div className="border-muted-foreground/10 h-6 w-6 rounded-full border" />
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
                          onChange={(newValue) =>
                            handleEmotionChange(emotion.key as keyof EmotionData, newValue)
                          }
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
          <div className="border-border/30 border-t pt-4">
            {!showCustom ? (
              <Button
                variant="outline"
                onClick={() => setShowCustom(true)}
                className="hover:bg-accent hover:text-accent-foreground h-10 w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('emotions.addCustom')}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('emotions.customPlaceholder')}
                    value={currentEmotions.other || ''}
                    onChange={(e) => handleCustomEmotionChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCustom(false);
                      sessionActions.updateEmotions({
                        ...currentEmotions,
                        other: '',
                        otherIntensity: 0,
                      });
                    }}
                    size="sm"
                    className="hover:bg-destructive/10 hover:text-destructive px-3"
                  >
                    ✕
                  </Button>
                </div>
                {currentEmotions.other && (
                  <Card className="from-primary/5 to-accent/5 border-primary/20 bg-gradient-to-r p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
                            💭
                          </div>
                          <div>
                            <h4 className="text-foreground text-sm font-semibold">
                              {currentEmotions.other}
                            </h4>
                            <p className="text-muted-foreground text-sm">
                              {(currentEmotions.otherIntensity || 0) === 0 &&
                                t('emotionIntensity.none')}
                              {(currentEmotions.otherIntensity || 0) > 0 &&
                                (currentEmotions.otherIntensity || 0) <= 2 &&
                                t('emotionIntensity.mild')}
                              {(currentEmotions.otherIntensity || 0) > 2 &&
                                (currentEmotions.otherIntensity || 0) <= 5 &&
                                t('emotionIntensity.moderate')}
                              {(currentEmotions.otherIntensity || 0) > 5 &&
                                (currentEmotions.otherIntensity || 0) <= 7 &&
                                t('emotionIntensity.strong')}
                              {(currentEmotions.otherIntensity || 0) > 7 &&
                                (currentEmotions.otherIntensity || 0) <= 9 &&
                                t('emotionIntensity.veryStrong')}
                              {(currentEmotions.otherIntensity || 0) === 10 &&
                                t('emotionIntensity.overwhelming')}
                            </p>
                          </div>
                        </div>
                        <span className="text-primary text-sm font-semibold">
                          {currentEmotions.otherIntensity || 0}/10
                        </span>
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
