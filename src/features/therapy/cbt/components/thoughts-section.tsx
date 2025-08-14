'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain } from 'lucide-react';
import { useDraftSaver, CBT_DRAFT_KEYS } from '@/lib/utils/cbt-draft-utils';
import { ArrayField } from './array-field';

import { CBTDiaryFormData } from '@/types/therapy';

interface ThoughtsSectionProps {
  formData: CBTDiaryFormData;
  updateField: <K extends keyof CBTDiaryFormData>(field: K, value: CBTDiaryFormData[K]) => void;
  addAutomaticThought: () => void;
  removeAutomaticThought: (index: number) => void;
  errors: Record<string, string>;
}

export const ThoughtsSection: React.FC<ThoughtsSectionProps> = ({
  formData,
  updateField,
  addAutomaticThought,
  removeAutomaticThought,
  errors
}) => {
  // Auto-save draft with visual indicator
  const { isDraftSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.THOUGHTS, 
    formData.automaticThoughts
  );

  return (
    <Card className="p-6 space-y-8 min-h-[500px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Automatic Thoughts
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
        <ArrayField
          items={formData.automaticThoughts}
          onAdd={addAutomaticThought}
          onRemove={removeAutomaticThought}
          addButtonText="Add Another Thought"
          emptyMessage="No automatic thoughts recorded yet"
          renderItem={(thought, index) => (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-medium text-foreground">
                  Automatic Thought {index + 1}
                </label>
                <Textarea
                  placeholder="What thoughts immediately came to mind? What was I telling myself?"
                  value={thought.thought}
                  onChange={(e) => {
                    const newThoughts = [...formData.automaticThoughts];
                    newThoughts[index] = { ...newThoughts[index], thought: e.target.value };
                    updateField('automaticThoughts', newThoughts);
                  }}
                  className="min-h-[120px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-base font-medium text-foreground">
                  How much do you believe this thought? (Credibility 0-10)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={thought.credibility}
                  onChange={(e) => {
                    const newThoughts = [...formData.automaticThoughts];
                    newThoughts[index] = { ...newThoughts[index], credibility: parseInt(e.target.value) };
                    updateField('automaticThoughts', newThoughts);
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 - Don&apos;t believe</span>
                  <span className="font-medium">Credibility: {thought.credibility}/10</span>
                  <span>10 - Completely believe</span>
                </div>
              </div>
            </div>
          )}
        />
        {errors.automaticThoughts && (
          <p className="text-red-500 text-xs mt-1">{errors.automaticThoughts}</p>
        )}
      </CardContent>
    </Card>
  );
};