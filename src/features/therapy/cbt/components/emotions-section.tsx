'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Heart } from 'lucide-react';
import { EmotionScale } from './emotion-scale';
import { NumericEmotionKeys } from '@/types/therapy';
import { useDraftSaver, CBT_DRAFT_KEYS } from '@/lib/utils/cbt-draft-utils';

interface EmotionsSectionProps {
  formData: {
    initialEmotions: {
      fear: number;
      anger: number;
      sadness: number;
      joy: number;
      anxiety: number;
      shame: number;
      guilt: number;
      other?: string;
      otherIntensity?: number;
    };
  };
  handleEmotionChange: (emotionKey: NumericEmotionKeys, value: number) => void;
  handleOtherIntensityChange: (field: 'initialEmotions' | 'finalEmotions', value: number) => void;
  updateNestedField: (path: string, value: string) => void;
  errors: Record<string, string>;
}

export const EmotionsSection: React.FC<EmotionsSectionProps> = ({
  formData,
  handleEmotionChange,
  handleOtherIntensityChange,
  updateNestedField,
  errors
}) => {
  // Auto-save draft with visual indicator
  const { isDraftSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.EMOTIONS, 
    formData.initialEmotions
  );

  return (
    <Card className="p-6 space-y-8 min-h-[500px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Initial Emotions
          {/* Draft saved indicator */}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all duration-300 ml-auto ${
            isDraftSaved 
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 opacity-100 scale-100' 
              : 'opacity-0 scale-95'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Saved
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <EmotionScale
            label="Fear"
            value={formData.initialEmotions.fear}
            onChange={(value) => handleEmotionChange('fear', value)}
          />
          <EmotionScale
            label="Anger"
            value={formData.initialEmotions.anger}
            onChange={(value) => handleEmotionChange('anger', value)}
          />
          <EmotionScale
            label="Sadness"
            value={formData.initialEmotions.sadness}
            onChange={(value) => handleEmotionChange('sadness', value)}
          />
          <EmotionScale
            label="Joy"
            value={formData.initialEmotions.joy}
            onChange={(value) => handleEmotionChange('joy', value)}
          />
          <EmotionScale
            label="Anxiety"
            value={formData.initialEmotions.anxiety}
            onChange={(value) => handleEmotionChange('anxiety', value)}
          />
          <EmotionScale
            label="Shame"
            value={formData.initialEmotions.shame}
            onChange={(value) => handleEmotionChange('shame', value)}
          />
          <EmotionScale
            label="Guilt"
            value={formData.initialEmotions.guilt}
            onChange={(value) => handleEmotionChange('guilt', value)}
          />
        </div>
        
        <Card className="p-4">
          <CardTitle className="text-base font-semibold mb-4">Other Emotion</CardTitle>
          <div className="space-y-4">
            <Input
              placeholder="Name of emotion (e.g., jealousy, excitement)"
              value={formData.initialEmotions.other || ''}
              onChange={(e) => updateNestedField('initialEmotions.other', e.target.value)}
            />
            {formData.initialEmotions.other && (
              <EmotionScale
                label={formData.initialEmotions.other}
                value={formData.initialEmotions.otherIntensity || 0}
                onChange={(value) => handleOtherIntensityChange('initialEmotions', value)}
              />
            )}
          </div>
        </Card>

        {errors.initialEmotions && (
          <p className="text-destructive text-sm">{errors.initialEmotions}</p>
        )}
      </CardContent>
    </Card>
  );
};