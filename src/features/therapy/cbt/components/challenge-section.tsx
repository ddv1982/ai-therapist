'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb } from 'lucide-react';
import { useDraftSaver, CBT_DRAFT_KEYS } from '@/lib/utils/cbt-draft-utils';
import { ArrayField } from './array-field';

import { CBTDiaryFormData } from '@/types/therapy';

interface ChallengeSectionProps {
  formData: CBTDiaryFormData;
  updateField: <K extends keyof CBTDiaryFormData>(field: K, value: CBTDiaryFormData[K]) => void;
  addAdditionalQuestion: () => void;
  removeAdditionalQuestion: (index: number) => void;
  addRationalThought: () => void;
  removeRationalThought: (index: number) => void;
  errors: Record<string, string>;
}

export const ChallengeSection: React.FC<ChallengeSectionProps> = ({
  formData,
  updateField,
  addAdditionalQuestion,
  removeAdditionalQuestion,
  addRationalThought,
  removeRationalThought,
  errors
}) => {
  // Auto-save draft with visual indicator
  const { isDraftSaved: isChallengeQuestionsSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.CHALLENGE_QUESTIONS, 
    formData.challengeQuestions
  );

  const { isDraftSaved: isRationalThoughtsSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.RATIONAL_THOUGHTS, 
    formData.rationalThoughts
  );

  return (
    <Card className="p-6 space-y-8 min-h-[600px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Challenge & Reframe
          {/* Draft saved indicator */}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all duration-300 ml-auto ${
            (isChallengeQuestionsSaved || isRationalThoughtsSaved)
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 opacity-100 scale-100' 
              : 'opacity-0 scale-95'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Saved
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {/* Challenge Questions */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Challenge Questions</h4>
          <div className="space-y-4">
            {formData.challengeQuestions.map((question, index) => (
              <div key={index} className="p-4 border rounded-lg bg-card/50">
                <div className="font-medium text-sm mb-2 text-primary">
                  {question.question}
                </div>
                <Textarea
                  placeholder="Explore your thoughts and feelings about this question..."
                  value={question.answer}
                  onChange={(e) => {
                    const newQuestions = [...formData.challengeQuestions];
                    newQuestions[index] = { ...newQuestions[index], answer: e.target.value };
                    updateField('challengeQuestions', newQuestions);
                  }}
                  className="min-h-[120px] resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Additional Questions */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Additional Questions</h4>
          <ArrayField
            items={formData.additionalQuestions}
            onAdd={addAdditionalQuestion}
            onRemove={removeAdditionalQuestion}
            addButtonText="Add Custom Question"
            emptyMessage="No additional questions added"
            renderItem={(question, index) => (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-base font-medium text-foreground">
                    Question
                  </label>
                  <Input
                    placeholder="Enter your question"
                    value={question.question}
                    onChange={(e) => {
                      const newQuestions = [...formData.additionalQuestions];
                      newQuestions[index] = { ...newQuestions[index], question: e.target.value };
                      updateField('additionalQuestions', newQuestions);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium text-foreground">
                    Answer
                  </label>
                  <Textarea
                    placeholder="Explore your thoughts about this question..."
                    value={question.answer}
                    onChange={(e) => {
                      const newQuestions = [...formData.additionalQuestions];
                      newQuestions[index] = { ...newQuestions[index], answer: e.target.value };
                      updateField('additionalQuestions', newQuestions);
                    }}
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </div>
            )}
          />
        </div>

        {/* Rational Thoughts */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Rational Thoughts</h4>
          <ArrayField
            items={formData.rationalThoughts}
            onAdd={addRationalThought}
            onRemove={removeRationalThought}
            addButtonText="Add Rational Thought"
            emptyMessage="No rational thoughts developed yet"
            renderItem={(thought, index) => (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-base font-medium text-foreground">
                    Rational Thought
                  </label>
                  <Textarea
                    placeholder="Write a more balanced, realistic thought..."
                    value={thought.thought}
                    onChange={(e) => {
                      const newThoughts = [...formData.rationalThoughts];
                      newThoughts[index] = { ...newThoughts[index], thought: e.target.value };
                      updateField('rationalThoughts', newThoughts);
                    }}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium text-foreground">
                    Confidence Level (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={thought.confidence}
                    onChange={(e) => {
                      const newThoughts = [...formData.rationalThoughts];
                      newThoughts[index] = { ...newThoughts[index], confidence: parseInt(e.target.value) };
                      updateField('rationalThoughts', newThoughts);
                    }}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 - No confidence</span>
                    <span className="font-medium">Confidence: {thought.confidence}/10</span>
                    <span>10 - Complete confidence</span>
                  </div>
                </div>
              </div>
            )}
          />
        </div>

        {errors.challengeQuestions && (
          <p className="text-destructive text-sm">{errors.challengeQuestions}</p>
        )}
      </CardContent>
    </Card>
  );
};