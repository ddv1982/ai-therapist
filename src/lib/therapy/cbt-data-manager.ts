/**
 * CBT Data Manager - Unified Data Handling
 * 
 * Consolidated CBT data formatting, validation, and utility functions.
 * Provides:
 * - Chat message formatting (structured cards for AI analysis)
 * - Data validation and sanitization
 * - Utility functions for data transformation
 * - Session summary generation
 */

import type {
  EmotionData,
  CoreBeliefData,
  SchemaModesData,
  CBTSituationData,
  CBTThoughtsData,
  CBTChallengeData,
  CBTRationalData,
  CBTActionPlanData,
  CBTCompleteSessionData
} from '@/types/therapy';

// Re-export types for convenience
export type {
  EmotionData,
  CoreBeliefData,
  SchemaModesData,
  SchemaMode,
  CBTSituationData,
  CBTThoughtsData,
  CBTChallengeData,
  CBTRationalData,
  CBTActionPlanData,
  CBTCompleteSessionData
} from '@/types/therapy';

/**
 * Helper Functions
 */

/**
 * Convert EmotionData to array format for summary cards
 */
function convertEmotionsToArray(emotions: EmotionData): Array<{ emotion: string; rating: number }> {
  const result = [];
  const coreEmotions = ['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'] as const;
  
  for (const emotion of coreEmotions) {
    const value = emotions[emotion];
    if (value > 0) {
      result.push({
        emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        rating: value
      });
    }
  }
  
  if (emotions.other && emotions.otherIntensity && emotions.otherIntensity > 0) {
    result.push({
      emotion: emotions.other,
      rating: emotions.otherIntensity
    });
  }
  
  return result;
}

/**
 * Chat Message Formatting Functions
 * (Used for user-visible chat messages only)
 */

export function formatSituationForChat(data: CBTSituationData): string {
  // Create CBTSessionSummaryData for structured card display
  const summaryData = {
    date: data.date,
    situation: data.situation,
    completedSteps: ['Situation Analysis']
  };

  // Return structured card format instead of plain markdown
  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

export function formatEmotionsForChat(data: EmotionData): string {
  const emotions = convertEmotionsToArray(data);

  // Create CBTSessionSummaryData for structured card display
  const summaryData = {
    date: new Date().toLocaleDateString(),
    initialEmotions: emotions,
    completedSteps: ['Emotion Assessment']
  };

  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

export function formatThoughtsForChat(data: CBTThoughtsData): string {
  // Convert thoughts to structured format for summary card
  const automaticThoughts = data.automaticThoughts.map(thought => ({
    thought,
    credibility: 7 // Default credibility since not tracked in current structure
  }));

  // Create CBTSessionSummaryData for structured card display
  const summaryData = {
    date: new Date().toLocaleDateString(),
    automaticThoughts,
    completedSteps: ['Automatic Thoughts']
  };

  // Return structured card format instead of plain markdown
  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

export function formatCoreBeliefForChat(data: CoreBeliefData): string {
  // Create CBTSessionSummaryData for structured card display
  const summaryData = {
    date: new Date().toLocaleDateString(),
    coreBelief: {
      belief: data.coreBeliefText,
      credibility: data.coreBeliefCredibility
    },
    completedSteps: ['Core Belief Exploration']
  };

  // Return structured card format instead of plain markdown
  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

export function formatChallengeQuestionsForChat(data: CBTChallengeData): string {
  // Create CBTSessionSummaryData for structured card display
  // Note: Challenge questions aren't directly supported in CBTSessionSummaryData,
  // so we'll include them as automatic thoughts with the questions and answers
  const thoughtsFromChallenges = data.challengeQuestions.map(qa => ({
    thought: `${qa.question} → ${qa.answer}`,
    credibility: 6 // Default credibility for challenge work
  }));

  const summaryData = {
    date: new Date().toLocaleDateString(),
    automaticThoughts: thoughtsFromChallenges,
    completedSteps: ['Thought Challenging']
  };

  // Return structured card format instead of plain markdown
  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

export function formatRationalThoughtsForChat(data: CBTRationalData): string {
  // Convert thoughts to structured format for summary card
  const rationalThoughts = data.rationalThoughts.map(thought => ({
    thought,
    confidence: 8 // Default confidence since not tracked in current structure
  }));

  // Create CBTSessionSummaryData for structured card display
  const summaryData = {
    date: new Date().toLocaleDateString(),
    rationalThoughts,
    completedSteps: ['Rational Response Development']
  };

  // Return structured card format instead of plain markdown
  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

export function formatSchemaModesForChat(data: SchemaModesData): string {
  // Filter and convert selected modes to structured format for summary card
  const schemaModes = data.selectedModes
    .filter(mode => mode.selected)
    .map(mode => ({
      name: mode.name,
      intensity: mode.intensity
    }));

  // Create CBTSessionSummaryData for structured card display
  const summaryData = {
    date: new Date().toLocaleDateString(),
    schemaModes,
    completedSteps: ['Schema Mode Analysis']
  };

  // Return structured card format instead of plain markdown
  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

export function formatActionPlanForChat(data: CBTActionPlanData): string {
  const finalEmotions = convertEmotionsToArray(data.finalEmotions);

  // Create CBTSessionSummaryData for structured card display
  const summaryData = {
    date: new Date().toLocaleDateString(),
    finalEmotions,
    newBehaviors: data.newBehaviors,
    alternativeResponses: data.alternativeResponses.map(response => ({ response })),
    completedSteps: ['Action Plan Development']
  };

  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

/**
 * Data Validation Functions
 */

export function validateEmotionData(data: unknown): data is EmotionData {
  if (!data || typeof data !== 'object') return false;
  
  const emotionData = data as Record<string, unknown>;
  const requiredEmotions = ['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'];
  
  for (const emotion of requiredEmotions) {
    const value = emotionData[emotion];
    if (typeof value !== 'number' || value < 0 || value > 10) {
      return false;
    }
  }
  
  return true;
}

export function validateCoreBeliefData(data: unknown): data is CoreBeliefData {
  if (!data || typeof data !== 'object') return false;
  
  const beliefData = data as Record<string, unknown>;
  return (
    typeof beliefData.coreBeliefText === 'string' && 
    beliefData.coreBeliefText.trim().length > 0 &&
    typeof beliefData.coreBeliefCredibility === 'number' &&
    beliefData.coreBeliefCredibility >= 0 && 
    beliefData.coreBeliefCredibility <= 10
  );
}

export function validateSchemaModesData(data: unknown): data is SchemaModesData {
  if (!data || typeof data !== 'object') return false;
  
  const schemaData = data as Record<string, unknown>;
  if (!Array.isArray(schemaData.selectedModes)) {
    return false;
  }
  
  return schemaData.selectedModes.every((mode: unknown) => {
    if (!mode || typeof mode !== 'object') return false;
    const modeData = mode as Record<string, unknown>;
    return (
      typeof modeData.id === 'string' &&
      typeof modeData.name === 'string' &&
      typeof modeData.selected === 'boolean' &&
      (modeData.intensity === undefined || (typeof modeData.intensity === 'number' && modeData.intensity >= 1 && modeData.intensity <= 10))
    );
  });
}

/**
 * Data Utility Functions
 */

export function calculateEmotionalIntensity(emotions: EmotionData): number {
  const coreEmotions = ['fear', 'anger', 'sadness', 'anxiety', 'shame', 'guilt'] as const;
  const totalIntensity = coreEmotions.reduce((sum, emotion) => sum + emotions[emotion], 0);
  const emotionCount = coreEmotions.filter(emotion => emotions[emotion] > 0).length;
  
  if (emotionCount === 0) return 0;
  return Math.round(totalIntensity / emotionCount);
}

export function identifyPrimaryEmotions(emotions: EmotionData, threshold = 5): string[] {
  const coreEmotions = ['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'] as const;
  const primary: string[] = coreEmotions.filter(emotion => emotions[emotion] >= threshold);
  
  if (emotions.other && emotions.otherIntensity && emotions.otherIntensity >= threshold) {
    primary.push(emotions.other);
  }
  
  return primary;
}

export function generateCBTSessionSummary(data: CBTCompleteSessionData): string {
  // Convert CBTCompleteSessionData to CBTSessionSummaryData format
  const summaryData: Record<string, unknown> = {
    date: data.situation?.date || new Date().toLocaleDateString(),
    situation: data.situation?.situation,
    completedSteps: []
  };

  // Add initial emotions if available
  if (data.emotions) {
    summaryData.initialEmotions = convertEmotionsToArray(data.emotions);
    (summaryData.completedSteps as string[]).push('Emotion Assessment');
  }

  // Add automatic thoughts if available
  if (data.thoughts?.automaticThoughts) {
    summaryData.automaticThoughts = data.thoughts.automaticThoughts.map(thought => ({
      thought,
      credibility: 7 // Default credibility
    }));
    (summaryData.completedSteps as string[]).push('Automatic Thoughts');
  }

  // Add core belief if available
  if (data.coreBeliefs) {
    summaryData.coreBelief = {
      belief: data.coreBeliefs.coreBeliefText,
      credibility: data.coreBeliefs.coreBeliefCredibility
    };
    (summaryData.completedSteps as string[]).push('Core Belief Exploration');
  }

  // Add rational thoughts if available
  if (data.rationalThoughts?.rationalThoughts) {
    summaryData.rationalThoughts = data.rationalThoughts.rationalThoughts.map(thought => ({
      thought,
      confidence: 8 // Default confidence
    }));
    (summaryData.completedSteps as string[]).push('Rational Response Development');
  }

  // Add schema modes if available
  if (data.schemaModes?.selectedModes?.length) {
    summaryData.schemaModes = data.schemaModes.selectedModes
      .filter(mode => mode.selected)
      .map(mode => ({
        name: mode.name,
        intensity: mode.intensity
      }));
    (summaryData.completedSteps as string[]).push('Schema Mode Analysis');
  }

  // Add action plan data if available
  if (data.actionPlan) {
    summaryData.newBehaviors = data.actionPlan.newBehaviors;
    summaryData.alternativeResponses = data.actionPlan.alternativeResponses.map(response => ({ response }));
    
    // Add final emotions
    if (data.actionPlan.finalEmotions) {
      summaryData.finalEmotions = convertEmotionsToArray(data.actionPlan.finalEmotions);
    }
    
    (summaryData.completedSteps as string[]).push('Action Plan Development');
  }

  // Return structured card format instead of plain markdown
  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

export function generateEmotionComparison(initial: EmotionData, final: EmotionData): string {
  const initialEmotions = convertEmotionsToArray(initial);
  const finalEmotions = convertEmotionsToArray(final);

  // Create CBTSessionSummaryData for structured card display
  const summaryData = {
    date: new Date().toLocaleDateString(),
    initialEmotions,
    finalEmotions,
    completedSteps: ['Emotional Progress Tracking']
  };

  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

/**
 * Legacy compatibility functions (for gradual migration)
 */

// Keep these temporarily while migrating from old chat bridge
export { formatEmotionsForChat as formatEmotionData };
export { formatCoreBeliefForChat as formatCoreBeliefData };
export { formatSchemaModesForChat as formatSchemaModesData };
export { formatActionPlanForChat as formatActionPlanData };