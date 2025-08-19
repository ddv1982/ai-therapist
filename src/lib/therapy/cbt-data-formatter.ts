/**
 * CBT Data Formatting Utilities
 * 
 * @deprecated This file is deprecated. Please use the functions from:
 * @/lib/therapy/cbt-data-manager.ts instead.
 * 
 * The functions in cbt-data-manager.ts now return structured 
 * CBTSessionSummaryCard format instead of plain markdown.
 * 
 * Formats completed CBT step data into structured chat messages for
 * session report generation and therapeutic analysis.
 */

import type {
  EmotionData,
  CoreBeliefData,
  CBTSituationData,
  CBTThoughtsData,
  CBTChallengeData,
  CBTRationalData,
  CBTActionPlanData,
  SchemaModesData
} from '@/types/therapy';

/**
 * Format situation data for chat inclusion
 */
export function formatSituationForChat(data: CBTSituationData): string {
  return `**CBT Session - Situation Analysis**

📅 **Date**: ${data.date}
📝 **Situation**: ${data.situation}

---
*This data will be included in your therapeutic session report for analysis and insights.*`;
}

/**
 * Format emotion data for chat inclusion
 */
export function formatEmotionsForChat(data: EmotionData): string {
  const emotions = [];
  
  // Add core emotions with ratings > 0
  const coreEmotions = ['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'] as const;
  for (const emotion of coreEmotions) {
    const value = data[emotion];
    if (value > 0) {
      emotions.push(`• **${emotion.charAt(0).toUpperCase() + emotion.slice(1)}**: ${value}/10`);
    }
  }
  
  // Add custom emotion if present
  if (data.other && data.otherIntensity && data.otherIntensity > 0) {
    emotions.push(`• **${data.other}**: ${data.otherIntensity}/10`);
  }
  
  return `**CBT Session - Emotion Assessment**

💭 **Current Emotional State**:
${emotions.join('\n')}

**Total Emotions Identified**: ${emotions.length}

---
*Emotion ratings help track your emotional patterns and therapeutic progress.*`;
}

/**
 * Format automatic thoughts for chat inclusion
 */
export function formatThoughtsForChat(data: CBTThoughtsData): string {
  return `**CBT Session - Automatic Thoughts**

🧠 **Identified Thoughts**:
${data.automaticThoughts.map((thought, index) => `${index + 1}. "${thought}"`).join('\n')}

**Total Thoughts Recorded**: ${data.automaticThoughts.length}

---
*Automatic thoughts are the immediate mental responses that contribute to emotional states.*`;
}

/**
 * Format core belief data for chat inclusion
 */
export function formatCoreBeliefForChat(data: CoreBeliefData): string {
  return `**CBT Session - Core Belief Exploration**

🎯 **Identified Core Belief**: "${data.coreBeliefText}"
📊 **Belief Strength**: ${data.coreBeliefCredibility}/10

---
*Core beliefs are fundamental assumptions about yourself, others, and the world that drive thoughts and emotions.*`;
}

/**
 * Format challenge questions for chat inclusion
 */
export function formatChallengeQuestionsForChat(data: CBTChallengeData): string {
  const formattedQuestions = data.challengeQuestions.map((qa, index) => 
    `**Question ${index + 1}**: ${qa.question}\n**Answer**: ${qa.answer}`
  ).join('\n\n');

  return `**CBT Session - Thought Challenging**

❓ **Challenge Questions & Responses**:

${formattedQuestions}

**Total Questions Explored**: ${data.challengeQuestions.length}

---
*Challenging questions help examine the validity and helpfulness of automatic thoughts.*`;
}

/**
 * Format rational thoughts for chat inclusion
 */
export function formatRationalThoughtsForChat(data: CBTRationalData): string {
  return `**CBT Session - Rational Response Development**

💡 **Alternative Rational Thoughts**:
${data.rationalThoughts.map((thought, index) => `${index + 1}. "${thought}"`).join('\n')}

**Total Rational Responses**: ${data.rationalThoughts.length}

---
*Rational thoughts provide balanced, evidence-based alternatives to automatic thinking patterns.*`;
}

/**
 * Format schema modes for chat inclusion
 */
export function formatSchemaModesForChat(data: SchemaModesData): string {
  const activeModes = data.selectedModes.filter(mode => mode.selected);
  
  const formattedModes = activeModes.map(mode => 
    `• **${mode.name}** (${mode.intensity}/10): ${mode.description}`
  ).join('\n');

  return `**CBT Session - Schema Mode Analysis**

👥 **Active Schema Modes**:
${formattedModes}

**Total Active Modes**: ${activeModes.length}

---
*Schema modes represent different emotional states or "parts" of yourself that become active in situations.*`;
}

/**
 * Format action plan for chat inclusion
 */
export function formatActionPlanForChat(data: CBTActionPlanData): string {
  // Format final emotions
  const finalEmotions = [];
  const coreEmotions = ['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'] as const;
  for (const emotion of coreEmotions) {
    const value = data.finalEmotions[emotion];
    if (value > 0) {
      finalEmotions.push(`• ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}: ${value}/10`);
    }
  }
  
  if (data.finalEmotions.other && data.finalEmotions.otherIntensity && data.finalEmotions.otherIntensity > 0) {
    finalEmotions.push(`• ${data.finalEmotions.other}: ${data.finalEmotions.otherIntensity}/10`);
  }

  return `**CBT Session - Action Plan & Final Assessment**

🎯 **New Behaviors to Practice**:
${data.newBehaviors.map((behavior, index) => `${index + 1}. ${behavior}`).join('\n')}

🔄 **Alternative Response Strategies**:
${data.alternativeResponses.map((response, index) => `${index + 1}. ${response}`).join('\n')}

😌 **Final Emotional State**:
${finalEmotions.join('\n')}

---
*Action plans translate insights into concrete steps for therapeutic progress.*`;
}

/**
 * Generate a unified CBT session summary card (DRY implementation)
 */
export function generateUnifiedCBTSessionCard(steps: {
  situation?: CBTSituationData;
  emotions?: EmotionData;
  thoughts?: CBTThoughtsData;
  coreBeliefs?: CoreBeliefData;
  challenges?: CBTChallengeData;
  rationalThoughts?: CBTRationalData;
  schemaModes?: SchemaModesData;
  actionPlan?: CBTActionPlanData;
}): string {
  // Convert to CBTSessionSummaryData format
  const summaryData = {
    date: steps.situation?.date || new Date().toLocaleDateString(),
    situation: steps.situation?.situation,
    initialEmotions: steps.emotions ? convertEmotionsToArray(steps.emotions) : [],
    automaticThoughts: steps.thoughts?.automaticThoughts.map((thought, _index) => ({ 
      thought, 
      credibility: 7 // Default credibility since not tracked in current structure
    })) || [],
    coreBelief: steps.coreBeliefs ? {
      belief: steps.coreBeliefs.coreBeliefText,
      credibility: steps.coreBeliefs.coreBeliefCredibility
    } : undefined,
    rationalThoughts: steps.rationalThoughts?.rationalThoughts.map((thought, _index) => ({
      thought,
      confidence: 8 // Default confidence since not tracked in current structure
    })) || [],
    schemaModes: steps.schemaModes?.selectedModes.filter(mode => mode.selected).map(mode => ({
      name: mode.name,
      intensity: mode.intensity
    })) || [],
    finalEmotions: steps.actionPlan?.finalEmotions ? convertEmotionsToArray(steps.actionPlan.finalEmotions) : [],
    newBehaviors: steps.actionPlan?.newBehaviors || [],
    alternativeResponses: steps.actionPlan?.alternativeResponses.map(response => ({ response })) || [],
    completedSteps: Object.keys(steps).map(key => {
      const stepNames: Record<string, string> = {
        situation: 'Situation Analysis',
        emotions: 'Emotion Assessment', 
        thoughts: 'Automatic Thoughts',
        coreBeliefs: 'Core Belief Exploration',
        challenges: 'Thought Challenging',
        rationalThoughts: 'Rational Response Development',
        schemaModes: 'Schema Mode Analysis',
        actionPlan: 'Action Plan Development'
      };
      return stepNames[key] || key;
    })
  };

  // Generate the CBT session summary card comment
  return `<!-- CBT_SUMMARY_CARD:${JSON.stringify(summaryData)} -->
<!-- END_CBT_SUMMARY_CARD -->`;
}

/**
 * Convert EmotionData to array format for summary card
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
 * Generate a complete CBT session summary (legacy - kept for backward compatibility)
 */
export function generateCBTSessionSummary(steps: {
  situation?: CBTSituationData;
  emotions?: EmotionData;
  thoughts?: CBTThoughtsData;
  coreBeliefs?: CoreBeliefData;
  challenges?: CBTChallengeData;
  rationalThoughts?: CBTRationalData;
  schemaModes?: SchemaModesData;
  actionPlan?: CBTActionPlanData;
}): string {
  // Use the new unified card format instead of the old separate sections
  return generateUnifiedCBTSessionCard(steps);
}

/**
 * Extract emotion comparison data for progress analysis
 */
export function generateEmotionComparison(initialEmotions: EmotionData, finalEmotions: EmotionData): string {
  const changes = [];
  const coreEmotions = ['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'] as const;
  
  for (const emotion of coreEmotions) {
    const initial = initialEmotions[emotion] || 0;
    const final = finalEmotions[emotion] || 0;
    const change = final - initial;
    
    if (Math.abs(change) >= 1) { // Only show changes of 1 point or more
      const direction = change > 0 ? 'increased' : 'decreased';
      const arrow = change > 0 ? '↗️' : '↘️';
      changes.push(`${arrow} **${emotion.charAt(0).toUpperCase() + emotion.slice(1)}**: ${initial} → ${final} (${direction} by ${Math.abs(change)})`);
    }
  }
  
  if (changes.length === 0) {
    return '📊 **Emotional Stability**: No significant changes in emotion ratings during this session.';
  }
  
  return `📊 **Emotional Changes During Session**:

${changes.join('\n')}

**Total Changes**: ${changes.length} emotions showed significant shifts during this CBT session.`;
}