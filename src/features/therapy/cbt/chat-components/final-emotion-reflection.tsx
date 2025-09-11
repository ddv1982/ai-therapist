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
import type { EmotionData, ActionPlanData } from '@/types/therapy';
import {useTranslations} from 'next-intl';
import { therapeuticTypography } from '@/lib/ui/design-tokens';

interface FinalEmotionReflectionProps {
  onComplete?: (data: EmotionData) => void;
  onSendToChat?: () => void;
  className?: string;
}

export function FinalEmotionReflection({ onComplete, onSendToChat, className }: FinalEmotionReflectionProps) {
  const { sessionData, actionActions } = useCBTDataManager();
  const t = useTranslations('cbt');

  // Pull final emotions from action plan if present, else start from zeros
  const currentFinalEmotions = useMemo<EmotionData>(() => (
    sessionData?.actionPlan?.finalEmotions || {
      fear: 0,
      anger: 0,
      sadness: 0,
      joy: 0,
      anxiety: 0,
      shame: 0,
      guilt: 0,
      other: sessionData?.emotions?.other || '',
      otherIntensity: 0
    }
  ), [sessionData?.actionPlan?.finalEmotions, sessionData?.emotions?.other]);

  const [localFinal, setLocalFinal] = useState<EmotionData>(currentFinalEmotions);
  const [showCustom, setShowCustom] = useState(Boolean(localFinal.other));

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
    setLocalFinal(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCustomEmotionLabel = useCallback((value: string) => {
    setLocalFinal(prev => ({ ...prev, other: value }));
  }, []);

  const hasSelectedEmotions = useMemo(() => (
    Object.entries(localFinal).some(([key, value]) => {
      if (key === 'other') return false;
      if (key === 'otherIntensity') return localFinal.other && typeof value === 'number' && value > 0;
      return typeof value === 'number' && value > 0;
    })
  ), [localFinal]);

  const selectedCount = useMemo(() => (
    Object.entries(localFinal).filter(([key, value]) => {
      if (key === 'other') return false;
      if (key === 'otherIntensity') return localFinal.other && typeof value === 'number' && value > 0;
      return typeof value === 'number' && value > 0;
    }).length
  ), [localFinal]);

  const handleNext = useCallback(async () => {
    if (!hasSelectedEmotions) return;

    // Persist into action plan
    const nextActionPlan: ActionPlanData = {
      ...(sessionData?.actionPlan || { originalThoughtCredibility: 5, newBehaviors: '' }),
      finalEmotions: localFinal,
    } as ActionPlanData;
    actionActions.updateActionPlan(nextActionPlan);

    if (onComplete) {
      onComplete(localFinal);
    }
    if (onSendToChat) {
      onSendToChat();
    }
  }, [hasSelectedEmotions, localFinal, sessionData?.actionPlan, actionActions, onComplete, onSendToChat]);

  return (
    <CBTStepWrapper
      step="final-emotions"
      title={t('finalEmotions.title')}
      subtitle={t('finalEmotions.subtitle')}
      icon={<Heart className="w-5 h-5" />}
      isValid={hasSelectedEmotions}
      validationErrors={[]}
      onNext={handleNext}
      nextButtonText={`${t('actions.sendToChat')}${selectedCount > 0 ? ` (${selectedCount} ${t('finalEmotions.emotions')})` : ''}`}
      hideProgressBar={true}
      className={className}
    >
      <div className="space-y-6">
        {hasSelectedEmotions && (
          <div className="text-center">
            <p className="text-sm text-primary font-semibold">{selectedCount} {t('finalEmotions.selected')}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coreEmotions.map((emotion) => {
              const value = localFinal[emotion.key as keyof EmotionData] as number;
              const isSelected = value > 0;
              return (
                <Card
                  key={emotion.key}
                  className={cn(
                    "p-3 cursor-pointer transition-colors duration-200",
                    isSelected ? "ring-2 ring-primary bg-primary/5 border-primary/30" : "hover:border-primary/20 bg-muted/30"
                  )}
                  onClick={() => {
                    if (!isSelected) handleEmotionChange(emotion.key as keyof EmotionData, 5);
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm", emotion.color)}>
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
                            <span className="text-sm font-semibold text-primary">{value}/10</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleEmotionChange(emotion.key as keyof EmotionData, 0); }}
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
                {t('finalEmotions.addCustom')}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('finalEmotions.customPlaceholder')}
                    value={localFinal.other || ''}
                    onChange={(e) => handleCustomEmotionLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => { setShowCustom(false); setLocalFinal(prev => ({ ...prev, other: '', otherIntensity: 0 })); }}
                    size="sm"
                    className="px-3 hover:bg-destructive/10 hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
                {localFinal.other && (
                  <Card className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">💭</div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{localFinal.other}</h4>
                            <p className="text-sm text-muted-foreground">
                              {(localFinal.otherIntensity || 0) === 0 && t('emotionIntensity.none')}
                              {(localFinal.otherIntensity || 0) > 0 && (localFinal.otherIntensity || 0) <= 2 && t('emotionIntensity.mild')}
                              {(localFinal.otherIntensity || 0) > 2 && (localFinal.otherIntensity || 0) <= 5 && t('emotionIntensity.moderate')}
                              {(localFinal.otherIntensity || 0) > 5 && (localFinal.otherIntensity || 0) <= 7 && t('emotionIntensity.strong')}
                              {(localFinal.otherIntensity || 0) > 7 && (localFinal.otherIntensity || 0) <= 9 && t('emotionIntensity.veryStrong')}
                              {(localFinal.otherIntensity || 0) === 10 && t('emotionIntensity.overwhelming')}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary">{localFinal.otherIntensity || 0}/10</span>
                      </div>
                      <div className="space-y-1">
                        <TherapySlider
                          type="intensity"
                          label=""
                          value={localFinal.otherIntensity || 1}
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
