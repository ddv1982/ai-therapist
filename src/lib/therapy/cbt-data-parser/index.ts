import { logger } from '@/lib/utils/logger';
export type { CBTStructuredAssessment, ParsedCBTData } from '@/types/therapy';

import { extractCBTDataFromCardFormat } from './extractors/card-format';
import {
  extractSituationData,
  extractEmotionData,
  extractThoughtsData,
  extractCoreBeliefData,
  extractChallengeData,
  extractRationalThoughtsData,
  extractSchemaModesData,
  extractActionPlanData,
  extractEmotionComparison,
  parseCBTFromMarkdown,
} from './extractors/markdown';
import { generateCBTSummary } from './summary';

type MessageLike = { content: string; role: string };

export function parseAllCBTData(messages: MessageLike[]): import('@/types/therapy').CBTStructuredAssessment {
  const extractedData: import('@/types/therapy').CBTStructuredAssessment = {};
  let parsedSections = 0;

  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue;
    const cardData = extractCBTDataFromCardFormat(message.content);
    if (cardData) {
      logger.therapeuticOperation('CBT card data extracted', { format: 'unified_card', success: true });
      return cardData;
    }
  }

  logger.therapeuticOperation('CBT fallback to markdown parsing', { reason: 'no_card_format' });
  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue;
    const content = message.content;
    if (!content.includes('CBT Session -')) continue;

    if (content.includes('CBT Session - Situation Analysis')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const situationData = extractSituationData(content);
      if (situationData) { extractedData.situation = situationData; parsedSections++; logger.therapeuticOperation('CBT situation parsed', { hasDate: !!situationData.date, hasSituation: !!situationData.description }); }
    }
    if (content.includes('CBT Session - Emotion Assessment')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const emotionData = extractEmotionData(content);
      if (emotionData) {
        if (!extractedData.emotions) { extractedData.emotions = emotionData; parsedSections++; logger.therapeuticOperation('CBT initial emotions parsed', { emotionCount: Object.keys(emotionData.initial || {}).length }); }
        else if (!extractedData.emotions.final) { extractedData.emotions.final = emotionData.initial; logger.therapeuticOperation('CBT final emotions parsed', { emotionCount: Object.keys(emotionData.final || emotionData.initial || {}).length }); }
      }
    }
    if (content.includes('CBT Session - Automatic Thoughts')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const thoughtsData = extractThoughtsData(content);
      if (thoughtsData) { extractedData.thoughts = thoughtsData; parsedSections++; logger.therapeuticOperation('CBT thoughts parsed', { thoughtCount: thoughtsData.automaticThoughts?.length || 0 }); }
    }
    if (content.includes('CBT Session - Core Belief Exploration')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const coreBeliefData = extractCoreBeliefData(content);
      if (coreBeliefData) { extractedData.coreBeliefs = coreBeliefData; parsedSections++; logger.therapeuticOperation('CBT core belief parsed', { hasCoreBelief: !!coreBeliefData.belief, credibility: typeof coreBeliefData.credibility === 'number' }); }
    }
    if (content.includes('CBT Session - Thought Challenging')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const challengeData = extractChallengeData(content);
      if (challengeData) { extractedData.challengeQuestions = challengeData; parsedSections++; logger.therapeuticOperation('CBT challenges parsed', { questionCount: challengeData?.length || 0 }); }
    }
    if (content.includes('CBT Session - Rational Response Development')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const rationalData = extractRationalThoughtsData(content);
      if (rationalData) { extractedData.rationalThoughts = rationalData; parsedSections++; logger.therapeuticOperation('CBT rational thoughts parsed', { thoughtCount: rationalData.thoughts?.length || 0 }); }
    }
    if (content.includes('CBT Session - Schema Mode Analysis')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const schemaData = extractSchemaModesData(content);
      if (schemaData) { extractedData.schemaModes = schemaData; parsedSections++; logger.therapeuticOperation('CBT schema modes parsed', { modeCount: schemaData?.length || 0 }); }
    }
    if (content.includes('CBT Session - Action Plan & Final Assessment')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const actionData = extractActionPlanData(content);
      if (actionData) { extractedData.actionPlan = actionData; parsedSections++; logger.therapeuticOperation('CBT action plan parsed', { behaviorCount: actionData.newBehaviors?.length || 0 }); }
    }
    if (content.includes('Emotional Changes During Session')) {
      logger.therapeuticOperation('CBT section found', { messageRole: message.role });
      const comparisonData = extractEmotionComparison(content);
      if (comparisonData) { extractedData.emotionComparison = comparisonData; parsedSections++; logger.therapeuticOperation('CBT emotion comparison parsed', { changeCount: comparisonData.changes?.length || 0 }); }
    }
  }

  logger.therapeuticOperation('CBT parsing completed', {
    sectionsFound: parsedSections,
    hasSituation: !!extractedData.situation,
    hasEmotions: !!extractedData.emotions,
    hasThoughts: !!extractedData.thoughts,
    hasCoreBeliefs: !!extractedData.coreBeliefs,
    hasChallenges: !!extractedData.challengeQuestions,
    hasRationalThoughts: !!extractedData.rationalThoughts,
    hasSchemaModes: !!extractedData.schemaModes,
    hasActionPlan: !!extractedData.actionPlan,
    hasEmotionComparison: !!extractedData.emotionComparison
  });
  return extractedData;
}

export function hasCBTData(messages: MessageLike[]): boolean {
  const foundOldFormat = messages.some(m => (m.role === 'user' || m.role === 'assistant') && m.content.includes('CBT Session -'));
  const foundNewFormat = messages.some(m => (m.role === 'user' || m.role === 'assistant') && m.content.includes('<!-- CBT_SUMMARY_CARD:'));
  const foundCBT = foundOldFormat || foundNewFormat;
  logger.therapeuticOperation('CBT data detection completed', { foundCBT, oldFormat: foundOldFormat, newFormat: foundNewFormat, messagesChecked: messages.length });
  return foundCBT;
}

export { parseCBTFromMarkdown, generateCBTSummary };
export {
  extractSituationData,
  extractEmotionData,
  extractThoughtsData,
  extractCoreBeliefData,
  extractChallengeData,
  extractRationalThoughtsData,
  extractSchemaModesData,
  extractActionPlanData,
  extractEmotionComparison,
};
