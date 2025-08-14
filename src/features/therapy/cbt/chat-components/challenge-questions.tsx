'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, HelpCircle, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { loadCBTDraft, useDraftSaver, CBT_DRAFT_KEYS, clearCBTDraft } from '@/lib/utils/cbt-draft-utils';

export interface ChallengeQuestionsData {
  challengeQuestions: Array<{ question: string; answer: string }>;
}

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
  stepNumber,
  totalSteps,
  className 
}: ChallengeQuestionsProps) {
  // Default questions data
  const defaultQuestionsData: ChallengeQuestionsData = {
    challengeQuestions: [
      { question: CHALLENGE_QUESTIONS[0], answer: '' },
      { question: CHALLENGE_QUESTIONS[1], answer: '' }
    ]
  };

  const [questionsData, setQuestionsData] = useState<ChallengeQuestionsData>(() => {
    const draftData = loadCBTDraft(CBT_DRAFT_KEYS.CHALLENGE_QUESTIONS, defaultQuestionsData);
    
    // Use initialData if provided, otherwise use draft data
    if (initialData?.challengeQuestions) {
      return initialData;
    }
    
    return draftData;
  });

  // Auto-save draft as user types
  const { isDraftSaved } = useDraftSaver(CBT_DRAFT_KEYS.CHALLENGE_QUESTIONS, questionsData);

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
      // Clear the draft since step is completed
      clearCBTDraft(CBT_DRAFT_KEYS.CHALLENGE_QUESTIONS);
      
      onComplete({ challengeQuestions: validQuestions });
    }
  }, [questionsData, onComplete]);

  const answeredQuestions = questionsData.challengeQuestions.filter(q => q.answer.trim()).length;
  const isValid = answeredQuestions > 0;

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Conversational Header */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
          <HelpCircle className="w-4 h-4" />
          Step {stepNumber} of {totalSteps}: Challenge your thoughts
        </div>
        {coreBeliefText && (
          <p className="text-xs text-muted-foreground mt-2">
            Examining: &ldquo;{coreBeliefText}&rdquo;
          </p>
        )}
        <div className={`mt-2 flex justify-center`}>
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

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-50"
          >
            {/* Shimmer effect */}
            <div className="shimmer-effect"></div>
            <Send className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">{answeredQuestions > 0 ? `Share my ${answeredQuestions} insights` : "Continue to Rational Thoughts"}</span>
          </Button>
          
          {!isValid && (
            <p className="text-xs text-muted-foreground text-center">
              Answer at least one question to continue
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}