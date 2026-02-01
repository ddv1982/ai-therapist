'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CBTStepWrapper } from '@/features/therapy/components/cbt-step-wrapper';
import { TherapySlider } from '@/features/therapy/components/ui/therapy-slider';
import type { CBTStepType, EmotionData } from '@/types';
import { useTranslations } from 'next-intl';
import { therapeuticTypography } from '@/lib/ui/design-tokens';
import { useDraftSaving } from '@/hooks/use-draft-saving';
import { TIMING } from '@/constants/ui';

interface EmotionScaleProps {
  value?: EmotionData | null;
  onChange?: (data: EmotionData) => void;
  onComplete: (data: EmotionData) => void;
  onNavigateStep?: (step: CBTStepType) => void;
  type?: 'initial' | 'final';
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

const DEFAULT_EMOTIONS: EmotionData = {
  fear: 0,
  anger: 0,
  sadness: 0,
  joy: 0,
  anxiety: 0,
  shame: 0,
  guilt: 0,
};

const EMOTION_COLORS: Record<string, string> = {
  joy: 'bg-emotion-joy',
  fear: 'bg-emotion-fear',
  anger: 'bg-emotion-anger',
  sadness: 'bg-emotion-sadness',
  anxiety: 'bg-emotion-anxiety',
  shame: 'bg-emotion-shame',
  guilt: 'bg-emotion-guilt',
};

export function EmotionScale({
  value,
  onChange,
  onComplete,
  onNavigateStep,
  type = 'initial',
  className,
}: EmotionScaleProps) {
  const t = useTranslations('cbt');

  const [localData, setLocalData] = useState<EmotionData>(() => value ?? DEFAULT_EMOTIONS);
  const [showCustom, setShowCustom] = useState(() => Boolean(value?.other));

  const { saveDraft } = useDraftSaving<EmotionData>({
    onSave: (data) => onChange?.(data),
    debounceMs: TIMING.DEBOUNCE.DEFAULT,
    enabled: !!onChange,
  });

  useEffect(() => {
    if (value) setLocalData(value);
  }, [value]);

  const coreEmotions = useMemo(
    () => [
      { key: 'fear', label: t('emotions.labels.fear'), emoji: '😨', color: EMOTION_COLORS.fear },
      { key: 'anger', label: t('emotions.labels.anger'), emoji: '😠', color: EMOTION_COLORS.anger },
      {
        key: 'sadness',
        label: t('emotions.labels.sadness'),
        emoji: '😢',
        color: EMOTION_COLORS.sadness,
      },
      { key: 'joy', label: t('emotions.labels.joy'), emoji: '😊', color: EMOTION_COLORS.joy },
      {
        key: 'anxiety',
        label: t('emotions.labels.anxiety'),
        emoji: '😰',
        color: EMOTION_COLORS.anxiety,
      },
      { key: 'shame', label: t('emotions.labels.shame'), emoji: '😳', color: EMOTION_COLORS.shame },
      { key: 'guilt', label: t('emotions.labels.guilt'), emoji: '😔', color: EMOTION_COLORS.guilt },
    ],
    [t]
  );

  const handleEmotionChange = useCallback(
    (key: keyof EmotionData, val: number) => {
      const updated = { ...localData, [key]: val };
      setLocalData(updated);
      saveDraft(updated);
    },
    [localData, saveDraft]
  );

  const handleCustomEmotionChange = useCallback(
    (val: string) => {
      const updated = { ...localData, other: val };
      setLocalData(updated);
      saveDraft(updated);
    },
    [localData, saveDraft]
  );

  const clearCustomEmotion = useCallback(() => {
    setShowCustom(false);
    const updated = { ...localData, other: '', otherIntensity: 0 };
    setLocalData(updated);
    saveDraft(updated);
  }, [localData, saveDraft]);

  const hasSelectedEmotions = useMemo(
    () =>
      Object.entries(localData).some(([key, val]) => {
        if (key === 'other') return false;
        if (key === 'otherIntensity') return localData.other && typeof val === 'number' && val > 0;
        return typeof val === 'number' && val > 0;
      }),
    [localData]
  );

  const selectedCount = useMemo(
    () =>
      Object.entries(localData).filter(([key, val]) => {
        if (key === 'other') return false;
        if (key === 'otherIntensity') return localData.other && typeof val === 'number' && val > 0;
        return typeof val === 'number' && val > 0;
      }).length,
    [localData]
  );

  const handleNext = useCallback(() => {
    if (hasSelectedEmotions) onComplete(localData);
  }, [hasSelectedEmotions, localData, onComplete]);

  const getIntensityLabel = (val: number) => {
    if (val === 0) return t('emotionIntensity.none');
    if (val <= 2) return t('emotionIntensity.mild');
    if (val <= 5) return t('emotionIntensity.moderate');
    if (val <= 7) return t('emotionIntensity.strong');
    if (val <= 9) return t('emotionIntensity.veryStrong');
    return t('emotionIntensity.overwhelming');
  };

  return (
    <CBTStepWrapper
      step="emotions"
      title={type === 'initial' ? t('emotions.title') : t('emotions.titleNow')}
      subtitle={type === 'initial' ? t('emotions.subtitle') : t('emotions.subtitleNow')}
      icon={<Heart className="h-6 w-6" />}
      isValid={hasSelectedEmotions}
      validationErrors={[]}
      onNext={handleNext}
      nextButtonText={t('emotions.next')}
      helpText={t('emotions.help')}
      hideProgressBar={true}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {coreEmotions.map((emotion) => {
              const val = localData[emotion.key as keyof EmotionData] as number;
              const isSelected = val > 0;

              return (
                <Card
                  key={emotion.key}
                  className={cn(
                    'cursor-pointer p-3 transition-colors duration-200',
                    isSelected
                      ? 'ring-primary bg-primary/5 border-primary/30 ring-2'
                      : 'hover:border-primary/20 bg-muted/30'
                  )}
                  onClick={() =>
                    !isSelected && handleEmotionChange(emotion.key as keyof EmotionData, 5)
                  }
                >
                  <div className="space-y-2">
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
                              {getIntensityLabel(val)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <>
                            <span className="text-primary text-sm font-semibold">{val}/10</span>
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

                    {isSelected && (
                      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                        <TherapySlider
                          type="intensity"
                          label=""
                          value={val}
                          onChange={(v) => handleEmotionChange(emotion.key as keyof EmotionData, v)}
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
                    value={localData.other || ''}
                    onChange={(e) => handleCustomEmotionChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={clearCustomEmotion}
                    size="sm"
                    className="hover:bg-destructive/10 hover:text-destructive px-3"
                  >
                    ✕
                  </Button>
                </div>
                {localData.other && (
                  <Card className="from-primary/5 to-accent/5 border-primary/20 bg-gradient-to-r p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
                            💭
                          </div>
                          <div>
                            <h4 className="text-foreground text-sm font-semibold">
                              {localData.other}
                            </h4>
                            <p className="text-muted-foreground text-sm">
                              {getIntensityLabel(localData.otherIntensity || 0)}
                            </p>
                          </div>
                        </div>
                        <span className="text-primary text-sm font-semibold">
                          {localData.otherIntensity || 0}/10
                        </span>
                      </div>
                      <TherapySlider
                        type="intensity"
                        label=""
                        value={localData.otherIntensity || 1}
                        onChange={(v) => handleEmotionChange('otherIntensity', v)}
                        min={1}
                        max={10}
                        className="w-full"
                      />
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
