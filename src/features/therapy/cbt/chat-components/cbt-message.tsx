'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  SituationPrompt, 
  EmotionScale, 
  ThoughtRecord, 
  CoreBelief,
  ChallengeQuestions,
  RationalThoughts,
  ActionPlan,
  type SituationData,
  type EmotionData,
  type ThoughtData,
  type ActionPlanData,
  type CoreBeliefData
} from './index';
import type { ChallengeQuestionsData, RationalThoughtsData } from '@/types/therapy';
import type { CBTStep } from '../hooks/use-cbt-chat-experience';

interface CBTMessageProps {
  step: CBTStep;
  stepNumber: number;
  totalSteps: number;
  onSituationComplete?: (data: SituationData) => void;
  onEmotionComplete?: (data: EmotionData) => void;
  onThoughtComplete?: (data: ThoughtData[]) => void;
  onCoreBeliefComplete?: (data: CoreBeliefData) => void;
  onChallengeQuestionsComplete?: (data: ChallengeQuestionsData) => void;
  onRationalThoughtsComplete?: (data: RationalThoughtsData) => void;
  onActionComplete?: (data: ActionPlanData) => void;
  initialSituationData?: SituationData;
  initialEmotionData?: EmotionData;
  initialThoughtData?: ThoughtData[];
  initialCoreBeliefData?: CoreBeliefData;
  initialChallengeQuestionsData?: ChallengeQuestionsData;
  initialRationalThoughtsData?: RationalThoughtsData;
  initialActionData?: ActionPlanData;
  className?: string;
}

export function CBTMessage({ 
  step,
  stepNumber,
  totalSteps,
  onSituationComplete,
  onEmotionComplete,
  onThoughtComplete,
  onCoreBeliefComplete,
  onChallengeQuestionsComplete,
  onRationalThoughtsComplete,
  onActionComplete,
  initialSituationData: _initialSituationData,
  initialEmotionData,
  initialThoughtData,
  initialCoreBeliefData,
  initialChallengeQuestionsData,
  initialRationalThoughtsData,
  initialActionData,
  className 
}: CBTMessageProps) {
  
  const renderCBTComponent = () => {
    switch (step) {
      case 'situation':
        return (
          <SituationPrompt
            onComplete={onSituationComplete!}
          />
        );
        
      case 'emotions':
        return (
          <EmotionScale
            onComplete={onEmotionComplete!}
          />
        );
        
      case 'thoughts':
        return (
          <ThoughtRecord
            onComplete={onThoughtComplete!}
            initialData={initialThoughtData}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        );
        
      case 'core-belief':
        return (
          <CoreBelief
            onComplete={onCoreBeliefComplete!}
            initialData={initialCoreBeliefData}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        );
        
      case 'challenge-questions':
        return (
          <ChallengeQuestions
            onComplete={onChallengeQuestionsComplete!}
            initialData={initialChallengeQuestionsData}
            coreBeliefText={initialCoreBeliefData?.coreBeliefText}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        );
        
      case 'rational-thoughts':
        return (
          <RationalThoughts
            onComplete={onRationalThoughtsComplete!}
            initialData={initialRationalThoughtsData}
            coreBeliefText={initialCoreBeliefData?.coreBeliefText}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        );
        
      case 'actions':
        return (
          <ActionPlan
            onComplete={onActionComplete!}
            initialData={initialActionData}
            initialEmotions={initialEmotionData}
            customEmotion={initialEmotionData?.other}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        );
        
      default:
        return (
          <Card className="p-4">
            <p className="text-muted-foreground">CBT step not implemented: {step}</p>
          </Card>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {renderCBTComponent()}
    </motion.div>
  );
}