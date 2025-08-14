'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { loadCBTDraft, useDraftSaver, CBT_DRAFT_KEYS, clearCBTDraft } from '@/lib/utils/cbt-draft-utils';

export interface EmotionData {
  fear: number;
  anger: number;
  sadness: number;
  joy: number;
  anxiety: number;
  shame: number;
  guilt: number;
  other?: string;
  otherIntensity?: number;
}

interface EmotionScaleProps {
  onComplete: (data: EmotionData) => void;
  initialData?: EmotionData;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}


export function EmotionScale({ 
  onComplete, 
  initialData,
  stepNumber,
  totalSteps,
  className 
}: EmotionScaleProps) {
  // Default emotion data
  const defaultEmotionData: EmotionData = {
    fear: 0,
    anger: 0,
    sadness: 0,
    joy: 0,
    anxiety: 0,
    shame: 0,
    guilt: 0,
    other: '',
    otherIntensity: 0
  };

  const [emotions, setEmotions] = useState<EmotionData>(() => {
    const draftData = loadCBTDraft(CBT_DRAFT_KEYS.EMOTIONS, defaultEmotionData);
    return {
      fear: initialData?.fear || draftData.fear,
      anger: initialData?.anger || draftData.anger,
      sadness: initialData?.sadness || draftData.sadness,
      joy: initialData?.joy || draftData.joy,
      anxiety: initialData?.anxiety || draftData.anxiety,
      shame: initialData?.shame || draftData.shame,
      guilt: initialData?.guilt || draftData.guilt,
      other: initialData?.other || draftData.other || '',
      otherIntensity: initialData?.otherIntensity || draftData.otherIntensity || 0
    };
  });

  const [showCustom, setShowCustom] = useState(Boolean(emotions.other));

  // Auto-save draft as user interacts
  const { isDraftSaved } = useDraftSaver(CBT_DRAFT_KEYS.EMOTIONS, emotions);

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
    if (key === 'otherIntensity') {
      setEmotions(prev => ({ ...prev, [key]: value }));
    } else {
      setEmotions(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  const handleCustomEmotionChange = useCallback((value: string) => {
    setEmotions(prev => ({ ...prev, other: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    // Clear the draft since step is completed
    clearCBTDraft(CBT_DRAFT_KEYS.EMOTIONS);
    
    onComplete(emotions);
  }, [emotions, onComplete]);

  // Check if any emotions are selected
  const hasSelectedEmotions = Object.entries(emotions).some(([key, value]) => {
    if (key === 'other') return false;
    if (key === 'otherIntensity') return emotions.other && value > 0;
    return typeof value === 'number' && value > 0;
  });

  const selectedCount = Object.entries(emotions).filter(([key, value]) => {
    if (key === 'other') return false;
    if (key === 'otherIntensity') return emotions.other && value > 0;
    return typeof value === 'number' && value > 0;
  }).length;

  return (
    <div className={cn("max-w-4xl mx-auto w-full", className)}>
      {/* Conversational Header */}
      <div className="mb-6 text-center px-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
          <Heart className="w-4 h-4" />
          Step {stepNumber} of {totalSteps}: How are you feeling?
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Select and rate the emotions you&apos;re experiencing (0-10 scale)
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          {hasSelectedEmotions && (
            <p className="text-xs text-primary/70 font-medium">{selectedCount} emotions selected</p>
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

      <Card className="p-4 border-border bg-card">
        <div className="space-y-4">
          {/* Emotion Cards Grid - 2 per row for compact layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {coreEmotions.map((emotion) => {
            const value = emotions[emotion.key as keyof EmotionData] as number;
            const isSelected = value > 0;
            
            return (
              <Card 
                key={emotion.key} 
                className={cn(
                  "p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
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
                          <p className="text-xs text-muted-foreground">
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
                    value={emotions.other || ''}
                    onChange={(e) => handleCustomEmotionChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCustom(false);
                      setEmotions(prev => ({ ...prev, other: '', otherIntensity: 0 }));
                    }}
                    size="sm"
                    className="px-3 hover:bg-destructive/10 hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
                {emotions.other && (
                  <Card className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                            💭
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{emotions.other}</h4>
                            <p className="text-xs text-muted-foreground">
                              {(emotions.otherIntensity || 0) === 0 && "Not present"}
                              {(emotions.otherIntensity || 0) > 0 && (emotions.otherIntensity || 0) <= 2 && "Mild"}
                              {(emotions.otherIntensity || 0) > 2 && (emotions.otherIntensity || 0) <= 5 && "Moderate"} 
                              {(emotions.otherIntensity || 0) > 5 && (emotions.otherIntensity || 0) <= 7 && "Strong"}
                              {(emotions.otherIntensity || 0) > 7 && (emotions.otherIntensity || 0) <= 9 && "Very strong"}
                              {(emotions.otherIntensity || 0) === 10 && "Overwhelming"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-primary">{emotions.otherIntensity || 0}/10</span>
                      </div>
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={emotions.otherIntensity || 1}
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
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!hasSelectedEmotions}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-50"
            >
              {/* Shimmer effect */}
              <div className="shimmer-effect"></div>
              <Send className="w-4 h-4 mr-2 relative z-10" />
              <span className="relative z-10">{selectedCount > 0 ? `Share My Emotions (${selectedCount} selected)` : "Continue to Thoughts"}</span>
            </Button>
            
            {!hasSelectedEmotions && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Adjust the sliders above to rate any emotions you&apos;re experiencing
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}