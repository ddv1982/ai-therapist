'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Target } from 'lucide-react';
import { useDraftSaver, CBT_DRAFT_KEYS } from '@/lib/utils/cbt-draft-utils';

import { CBTDiaryFormData } from '@/types/therapy';

interface SituationSectionProps {
  formData: CBTDiaryFormData;
  updateField: <K extends keyof CBTDiaryFormData>(field: K, value: CBTDiaryFormData[K]) => void;
  errors: Record<string, string>;
}

export const SituationSection: React.FC<SituationSectionProps> = ({
  formData,
  updateField,
  errors
}) => {
  // Auto-save draft with visual indicator
  const { isDraftSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.SITUATION, 
    { date: formData.date, situation: formData.situation }
  );

  return (
    <Card className="p-6 space-y-8 min-h-[400px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          Situation Context
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
          <div className="space-y-2">
            <label className="text-base font-medium text-foreground">
              Date
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-base font-medium text-foreground">
            Situation <span className="text-destructive">*</span>
          </label>
          <Textarea
            placeholder="Where am I? With whom? What is happening? Describe the specific context, location, people present, and circumstances..."
            value={formData.situation}
            onChange={(e) => updateField('situation', e.target.value)}
            className="min-h-[200px] resize-none"
            maxLength={1000}
          />
          {errors.situation && (
            <p className="text-destructive text-sm mt-1">{errors.situation}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formData.situation.length}/1000 characters
          </p>
        </div>
      </CardContent>
    </Card>
  );
};