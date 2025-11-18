'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CBTStepWrapper } from '@/features/therapy/components/cbt-step-wrapper';
import { HelpCircle, Plus, Minus } from 'lucide-react';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { CBTStepType, ChallengeQuestionsData } from '@/types';
// Removed CBTFormValidationError import - validation errors not displayed
import { useTranslations } from 'next-intl';
import { therapeuticTypography } from '@/lib/ui/design-tokens';
import { cn } from '@/lib/utils';

interface ChallengeQuestionsProps {
  onComplete: (data: ChallengeQuestionsData) => void;
  initialData?: ChallengeQuestionsData;
  coreBeliefText?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
  onNavigateStep?: (step: CBTStepType) => void;
}

// Default challenge questions
const CHALLENGE_QUESTION_KEYS = [
  'challenge.defaultQuestions.evidence',
  'challenge.defaultQuestions.friend',
  'challenge.defaultQuestions.helping',
  'challenge.defaultQuestions.letGo',
  'challenge.defaultQuestions.impact',
  'challenge.defaultQuestions.truth',
  'challenge.defaultQuestions.perspectives',
  'challenge.defaultQuestions.support',
  'challenge.defaultQuestions.fallback',
] as const;

export function ChallengeQuestions({
  onComplete,
  initialData,
  coreBeliefText,
  className,
  onNavigateStep,
}: ChallengeQuestionsProps) {
  const t = useTranslations('cbt');
  const { sessionData, challengeActions } = useCBTDataManager();

  // Get challenge questions data from unified CBT hook
  const challengeQuestionsData = sessionData?.challengeQuestions;

  // Default questions data
  const translateQuestion = useCallback(
    (key: (typeof CHALLENGE_QUESTION_KEYS)[number]) => t(key as Parameters<typeof t>[0]),
    [t]
  );

  const defaultQuestionsData: ChallengeQuestionsData = {
    challengeQuestions: [
      { question: translateQuestion(CHALLENGE_QUESTION_KEYS[0]), answer: '' },
      { question: translateQuestion(CHALLENGE_QUESTION_KEYS[1]), answer: '' },
    ],
  };

  const [questionsData, setQuestionsData] = useState<ChallengeQuestionsData>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData?.challengeQuestions) {
      return initialData;
    }

    // Return Redux data if it has content, otherwise default
    if (challengeQuestionsData && challengeQuestionsData.length > 0) {
      return { challengeQuestions: challengeQuestionsData };
    }
    return defaultQuestionsData;
  });

  // Auto-save to unified CBT state when questions change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      challengeActions.updateChallengeQuestions(questionsData.challengeQuestions);
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [questionsData, challengeActions]);

  const handleQuestionChange = useCallback(
    (index: number, field: 'question' | 'answer', value: string) => {
      setQuestionsData((prev) => ({
        ...prev,
        challengeQuestions: prev.challengeQuestions.map((q, i) =>
          i === index ? { ...q, [field]: value } : q
        ),
      }));
    },
    []
  );

  const addQuestion = useCallback(() => {
    if (questionsData.challengeQuestions.length < 6) {
      const unusedQuestions = CHALLENGE_QUESTION_KEYS.map((key) => translateQuestion(key)).filter(
        (question) =>
          !questionsData.challengeQuestions.some((existing) => existing.question === question)
      );

      setQuestionsData((prev) => ({
        ...prev,
        challengeQuestions: [
          ...prev.challengeQuestions,
          {
            question:
              unusedQuestions[0] || translateQuestion('challenge.defaultQuestions.fallback'),
            answer: '',
          },
        ],
      }));
    }
  }, [questionsData.challengeQuestions, translateQuestion]);

  const removeQuestion = useCallback(
    (index: number) => {
      if (questionsData.challengeQuestions.length > 1) {
        setQuestionsData((prev) => ({
          ...prev,
          challengeQuestions: prev.challengeQuestions.filter((_, i) => i !== index),
        }));
      }
    },
    [questionsData.challengeQuestions.length]
  );

  const handleSubmit = useCallback(() => {
    const validQuestions = questionsData.challengeQuestions.filter((q) => q.answer.trim());
    if (validQuestions.length > 0) {
      // Update unified CBT state with final data
      challengeActions.updateChallengeQuestions(validQuestions);

      onComplete({ challengeQuestions: validQuestions });
    }
  }, [questionsData, challengeActions, onComplete]);

  const answeredQuestions = questionsData.challengeQuestions.filter((q) => q.answer.trim()).length;
  const isValid = answeredQuestions > 0;

  // Validation logic - keeps form functional without showing error messages

  const handleNext = useCallback(async () => {
    handleSubmit();
  }, [handleSubmit]);

  return (
    <CBTStepWrapper
      step="challenge-questions"
      title={t('challenge.title')}
      subtitle={
        coreBeliefText
          ? t('challenge.subtitleAlt', { belief: coreBeliefText })
          : t('challenge.subtitle')
      }
      icon={<HelpCircle className="h-5 w-5" />}
      isValid={isValid}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={t('challenge.next')}
      helpText={t('challenge.help')}
      hideProgressBar={true}
      className={className}
      onNavigateStep={onNavigateStep}
    >
      <div className="space-y-6">
        {/* Questions */}
        <div className="space-y-4">
          {questionsData.challengeQuestions.map((questionData, index) => (
            <Card key={index} className="bg-muted/30 border-border/30 border p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={cn('flex-1', therapeuticTypography.label)}>
                    {questionData.question}
                  </h4>
                  {questionsData.challengeQuestions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="hover:bg-destructive/10 hover:text-destructive h-6 w-6 flex-shrink-0 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <Textarea
                  placeholder={t('challenge.placeholder')}
                  value={questionData.answer}
                  onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                  className="min-h-[60px] resize-none"
                  maxLength={300}
                />

                <div className={cn('flex justify-end', therapeuticTypography.smallSecondary)}>
                  <span>{questionData.answer.length}/300</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Question */}
        {questionsData.challengeQuestions.length < 6 && (
          <Button
            variant="outline"
            onClick={addQuestion}
            className="hover:bg-accent hover:text-accent-foreground h-8 w-full border-dashed"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Question
          </Button>
        )}
      </div>
    </CBTStepWrapper>
  );
}
