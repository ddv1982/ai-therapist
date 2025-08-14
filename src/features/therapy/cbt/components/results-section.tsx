'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckSquare } from 'lucide-react';
import { useDraftSaver, CBT_DRAFT_KEYS } from '@/lib/utils/cbt-draft-utils';
import { EmotionScale } from './emotion-scale';
import { ArrayField } from './array-field';
import { NumericEmotionKeys } from '@/types/therapy';

import { CBTDiaryFormData } from '@/types/therapy';

interface ResultsSectionProps {
  formData: CBTDiaryFormData;
  updateField: <K extends keyof CBTDiaryFormData>(field: K, value: CBTDiaryFormData[K]) => void;
  updateNestedField: (path: string, value: string | number) => void;
  handleFinalEmotionChange: (emotionKey: NumericEmotionKeys, value: number) => void;
  handleOtherIntensityChange: (field: 'initialEmotions' | 'finalEmotions', value: number) => void;
  addAlternativeResponse: () => void;
  removeAlternativeResponse: (index: number) => void;
  errors: Record<string, string>;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  formData,
  updateField,
  updateNestedField,
  handleFinalEmotionChange,
  handleOtherIntensityChange,
  addAlternativeResponse,
  removeAlternativeResponse,
  errors: _errors
}) => {
  // Auto-save draft with visual indicator
  const { isDraftSaved: isFinalEmotionsSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.FINAL_EMOTIONS, 
    formData.finalEmotions
  );

  const { isDraftSaved: isNewBehaviorsSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.NEW_BEHAVIORS, 
    formData.newBehaviors
  );

  const { isDraftSaved: isAlternativeResponsesSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.ALTERNATIVE_RESPONSES, 
    formData.alternativeResponses
  );

  return (
    <Card className="p-6 space-y-8 min-h-[600px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Results & Action Plan
          {/* Draft saved indicator */}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all duration-300 ml-auto ${
            (isFinalEmotionsSaved || isNewBehaviorsSaved || isAlternativeResponsesSaved)
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 opacity-100 scale-100' 
              : 'opacity-0 scale-95'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Saved
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {/* Original Thought Credibility */}
        <div className="space-y-2">
          <label className="text-base font-medium text-foreground">
            How much do you believe your original automatic thoughts now? (0-10)
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={formData.originalThoughtCredibility}
            onChange={(e) => updateField('originalThoughtCredibility', parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 - Don&apos;t believe</span>
            <span className="font-medium">Credibility: {formData.originalThoughtCredibility}/10</span>
            <span>10 - Completely believe</span>
          </div>
        </div>

        {/* Final Emotions */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Final Emotions</h4>
          <p className="text-sm text-muted-foreground">
            How are you feeling now after this reflection?
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <EmotionScale
              label="Fear"
              value={formData.finalEmotions.fear}
              onChange={(value) => handleFinalEmotionChange('fear', value)}
            />
            <EmotionScale
              label="Anger"
              value={formData.finalEmotions.anger}
              onChange={(value) => handleFinalEmotionChange('anger', value)}
            />
            <EmotionScale
              label="Sadness"
              value={formData.finalEmotions.sadness}
              onChange={(value) => handleFinalEmotionChange('sadness', value)}
            />
            <EmotionScale
              label="Joy"
              value={formData.finalEmotions.joy}
              onChange={(value) => handleFinalEmotionChange('joy', value)}
            />
            <EmotionScale
              label="Anxiety"
              value={formData.finalEmotions.anxiety}
              onChange={(value) => handleFinalEmotionChange('anxiety', value)}
            />
            <EmotionScale
              label="Shame"
              value={formData.finalEmotions.shame}
              onChange={(value) => handleFinalEmotionChange('shame', value)}
            />
            <EmotionScale
              label="Guilt"
              value={formData.finalEmotions.guilt}
              onChange={(value) => handleFinalEmotionChange('guilt', value)}
            />
          </div>
          
          <Card className="p-4">
            <CardTitle className="text-base font-semibold mb-4">Other Emotion</CardTitle>
            <div className="space-y-4">
              <Input
                placeholder="Name of emotion (e.g., jealousy, excitement)"
                value={formData.finalEmotions.other || ''}
                onChange={(e) => updateNestedField('finalEmotions.other', e.target.value)}
              />
              {formData.finalEmotions.other && (
                <EmotionScale
                  label={formData.finalEmotions.other}
                  value={formData.finalEmotions.otherIntensity || 0}
                  onChange={(value) => handleOtherIntensityChange('finalEmotions', value)}
                />
              )}
            </div>
          </Card>
        </div>

        {/* New Behaviors */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">New Behaviors</h4>
          <div className="space-y-2">
            <label className="text-base font-medium text-foreground">
              What will you do differently next time this situation occurs?
            </label>
            <Textarea
              placeholder="Describe specific new behaviors or responses you want to try..."
              value={formData.newBehaviors}
              onChange={(e) => updateField('newBehaviors', e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <p className="text-sm text-muted-foreground">
              {formData.newBehaviors.length}/1000 characters
            </p>
          </div>
        </div>

        {/* Alternative Responses */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Alternative Responses</h4>
          <ArrayField
            items={formData.alternativeResponses}
            onAdd={addAlternativeResponse}
            onRemove={removeAlternativeResponse}
            addButtonText="Add Alternative Response"
            emptyMessage="No alternative responses added yet"
            renderItem={(response, index) => (
              <div className="space-y-2">
                <label className="text-base font-medium text-foreground">
                  Alternative Response {index + 1}
                </label>
                <Textarea
                  placeholder="Describe an alternative way to respond in future situations..."
                  value={response.response}
                  onChange={(e) => {
                    const newResponses = [...formData.alternativeResponses];
                    newResponses[index] = { ...newResponses[index], response: e.target.value };
                    updateField('alternativeResponses', newResponses);
                  }}
                  className="min-h-[100px] resize-none"
                />
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};