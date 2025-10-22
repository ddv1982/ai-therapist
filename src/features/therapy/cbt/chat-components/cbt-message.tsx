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
  FinalEmotionReflection,
  ActionPlan,
  type SituationData,
  type EmotionData,
  type ThoughtData,
  type ActionPlanData,
  type CoreBeliefData
} from './index';
import type { ChallengeQuestionsData, RationalThoughtsData, CBTStepType } from '@/types/therapy';

interface CBTMessageProps {
  step: CBTStepType;
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
  onNavigateStep?: (step: CBTStepType) => void;
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
  initialEmotionData,
  initialThoughtData,
  initialCoreBeliefData,
  initialChallengeQuestionsData,
  initialRationalThoughtsData,
  initialActionData,
  className,
  onNavigateStep,
}: CBTMessageProps) {
  
  const renderCBTComponent = () => {
    switch (step) {
      case 'situation':
        return (
          <SituationPrompt
            onComplete={onSituationComplete!}
            onNavigateStep={onNavigateStep}
          />
        );
        
      case 'emotions':
        return (
          <EmotionScale
            onComplete={onEmotionComplete!}
            onNavigateStep={onNavigateStep}
          />
        );
        
      case 'thoughts':
        return (
          <ThoughtRecord
            onComplete={onThoughtComplete!}
            initialData={initialThoughtData}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
            onNavigateStep={onNavigateStep}
          />
        );
        
      case 'core-belief':
        return (
          <CoreBelief
            onComplete={onCoreBeliefComplete!}
            initialData={initialCoreBeliefData}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
            onNavigateStep={onNavigateStep}
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
            onNavigateStep={onNavigateStep}
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
            onNavigateStep={onNavigateStep}
          />
        );
      
      case 'final-emotions':
        return (
          <FinalEmotionReflection
            onComplete={() => {}}
            onNavigateStep={onNavigateStep}
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
            onNavigateStep={onNavigateStep}
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
