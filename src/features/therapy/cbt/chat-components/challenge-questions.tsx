'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CBTStepWrapper } from '@/components/ui/cbt-step-wrapper';
import { HelpCircle, Plus, Minus } from 'lucide-react';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { ChallengeQuestionsData } from '@/types/therapy';
// Removed CBTFormValidationError import - validation errors not displayed

interface ChallengeQuestionsProps {
  onComplete: (data: ChallengeQuestionsData) => void;
  initialData?: ChallengeQuestionsData;
  coreBeliefText?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

// Default challenge questions
const CHALLENGE_QUESTIONS = [
  "What evidence supports this belief? What evidence contradicts it?",
  "What would I say to a friend who had this belief?",
  "Is this thought helping me or hurting me?",
  "What would happen if I let go of this belief?",
  "How has this belief affected my life positively and negatively?",
  "Is this belief 100% true, or could there be exceptions?",
  "What alternative perspectives could I consider?",
  "How might someone who cares about me challenge this belief?"
];

export function ChallengeQuestions({ 
  onComplete, 
  initialData,
  coreBeliefText,
  stepNumber: _stepNumber,
  totalSteps: _totalSteps,
  className 
}: ChallengeQuestionsProps) {
  const { sessionData, challengeActions } = useCBTDataManager();
  
  // Get challenge questions data from unified CBT hook
  const challengeQuestionsData = sessionData.challengeQuestions;
  
  // Default questions data
  const defaultQuestionsData: ChallengeQuestionsData = {
    challengeQuestions: [
      { question: CHALLENGE_QUESTIONS[0], answer: '' },
      { question: CHALLENGE_QUESTIONS[1], answer: '' }
    ]
  };

  const [questionsData, setQuestionsData] = useState<ChallengeQuestionsData>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData?.challengeQuestions) {
      return initialData;
    }
    
    // Return Redux data if it has content, otherwise default
    return challengeQuestionsData.length > 0 ? { challengeQuestions: challengeQuestionsData } : defaultQuestionsData;
  });

  // Auto-save to unified CBT state when questions change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      challengeActions.updateChallengeQuestions(questionsData.challengeQuestions);
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [questionsData, challengeActions]);

  const handleQuestionChange = useCallback((index: number, field: 'question' | 'answer', value: string) => {
    setQuestionsData(prev => ({
      ...prev,
      challengeQuestions: prev.challengeQuestions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  }, []);

  const addQuestion = useCallback(() => {
    if (questionsData.challengeQuestions.length < 6) {
      const unusedQuestions = CHALLENGE_QUESTIONS.filter(q => 
        !questionsData.challengeQuestions.some(existing => existing.question === q)
      );
      
      setQuestionsData(prev => ({
        ...prev,
        challengeQuestions: [...prev.challengeQuestions, { 
          question: unusedQuestions[0] || "What else could I consider?", 
          answer: '' 
        }]
      }));
    }
  }, [questionsData.challengeQuestions]);

  const removeQuestion = useCallback((index: number) => {
    if (questionsData.challengeQuestions.length > 1) {
      setQuestionsData(prev => ({
        ...prev,
        challengeQuestions: prev.challengeQuestions.filter((_, i) => i !== index)
      }));
    }
  }, [questionsData.challengeQuestions.length]);

  const handleSubmit = useCallback(() => {
    const validQuestions = questionsData.challengeQuestions.filter(q => q.answer.trim());
    if (validQuestions.length > 0) {
      // Update unified CBT state with final data
      challengeActions.updateChallengeQuestions(validQuestions);
      
      onComplete({ challengeQuestions: validQuestions });
    }
  }, [questionsData, challengeActions, onComplete]);

  const answeredQuestions = questionsData.challengeQuestions.filter(q => q.answer.trim()).length;
  const isValid = answeredQuestions > 0;

  // Validation logic - keeps form functional without showing error messages

  const handleNext = useCallback(async () => {
    handleSubmit();
  }, [handleSubmit]);

  return (
    <CBTStepWrapper
      step="challenge-questions"
      title="Challenge Your Thoughts"
      subtitle={coreBeliefText ? `Examining: "${coreBeliefText}"` : "Question your beliefs with curiosity"}
      icon={<HelpCircle className="w-5 h-5" />}
      isValid={isValid}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      nextButtonText={`Continue to Rational Thoughts${answeredQuestions > 0 ? ` (${answeredQuestions} answered)` : ''}`}
      helpText="Challenge your thoughts by answering these questions with an open mind."
      className={className}
    >
      <div className="space-y-6">
          {/* Questions */}
          <div className="space-y-4">
            {questionsData.challengeQuestions.map((questionData, index) => (
              <Card key={index} className="p-4 bg-muted/30 border border-border/30">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground flex-1">
                      {questionData.question}
                    </h4>
                    {questionsData.challengeQuestions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <Textarea
                    placeholder="Take your time to really think about this..."
                    value={questionData.answer}
                    onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                    className="min-h-[60px] resize-none"
                    maxLength={300}
                  />
                  
                  <div className="flex justify-end text-xs text-muted-foreground">
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
              className="w-full h-8 border-dashed hover:bg-accent hover:text-accent-foreground"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Question
            </Button>
          )}
      </div>
    </CBTStepWrapper>
  );
}