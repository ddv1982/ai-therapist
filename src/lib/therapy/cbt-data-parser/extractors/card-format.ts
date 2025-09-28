import { logger } from '@/lib/utils/logger';
import type { CBTStructuredAssessment } from '@/types/therapy';
import { safeParseFromMatch } from '@/lib/utils/safe-json';

type CardData = {
  situation?: string;
  date?: string;
  initialEmotions?: Array<{ emotion: string; rating: number }>;
  finalEmotions?: Array<{ emotion: string; rating: number }>;
  automaticThoughts?: Array<{ thought: string }>;
  coreBelief?: { belief?: string; credibility?: number };
  rationalThoughts?: Array<{ thought: string }>;
  schemaModes?: Array<{ name: string; intensity?: number }>;
  newBehaviors?: string[];
  alternativeResponses?: Array<{ response: string }>;
};

function validateCBTData(data: unknown): data is Record<string, unknown> {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
}

export function extractCBTDataFromCardFormat(content: string): CBTStructuredAssessment | null {
  const cardPattern = /<!-- CBT_SUMMARY_CARD:(.*?) -->/;
  const match = content.match(cardPattern);
  if (!match) return null;

  const parsed = safeParseFromMatch<unknown>(match[1]);
  if (!parsed.ok) {
    logger.warn('Failed to parse card format CBT data', { error: 'invalid_json' });
    return null;
  }
  const cardData = parsed.data as Partial<CardData>;
  logger.therapeuticOperation('CBT card format detected', { hasData: true, cardFormat: 'unified' });

  if (!validateCBTData(cardData)) {
    logger.warn('Invalid CBT data structure during parsing', { dataType: typeof cardData });
    return null;
  }

  const extractedData: CBTStructuredAssessment = {};

  if (cardData.situation) {
    extractedData.situation = {
      date: String(cardData.date || 'Unknown'),
      description: String(cardData.situation || 'No description')
    };
  }

  if (Array.isArray(cardData.initialEmotions) && cardData.initialEmotions.length > 0) {
    const emotions: Record<string, number> = {};
    cardData.initialEmotions.forEach((emotion: { emotion: string; rating: number }) => {
      emotions[emotion.emotion] = emotion.rating;
    });
    extractedData.emotions = { initial: emotions };
    if (Array.isArray(cardData.finalEmotions) && cardData.finalEmotions.length > 0) {
      const finalEmotions: Record<string, number> = {};
      cardData.finalEmotions.forEach((emotion: { emotion: string; rating: number }) => {
        finalEmotions[emotion.emotion] = emotion.rating;
      });
      extractedData.emotions.final = finalEmotions;
    }
  }

  if (Array.isArray(cardData.automaticThoughts) && cardData.automaticThoughts.length > 0) {
    extractedData.thoughts = {
      automaticThoughts: cardData.automaticThoughts.map((t: { thought: string }) => t.thought)
    };
  }

  if (cardData.coreBelief && typeof cardData.coreBelief === 'object') {
    const coreBelief = cardData.coreBelief as Record<string, unknown>;
    extractedData.coreBeliefs = {
      belief: String(coreBelief.belief || 'No belief'),
      credibility: Number(coreBelief.credibility || 0)
    };
  }

  if (Array.isArray(cardData.rationalThoughts) && cardData.rationalThoughts.length > 0) {
    extractedData.rationalThoughts = {
      thoughts: cardData.rationalThoughts.map((t: { thought: string }) => t.thought)
    };
  }

  if (Array.isArray(cardData.schemaModes) && cardData.schemaModes.length > 0) {
    extractedData.schemaModes = cardData.schemaModes.map((mode: { name: string; intensity?: number }) => ({
      name: mode.name,
      intensity: mode.intensity || 0,
      description: mode.name
    }));
  }

  if (Array.isArray(cardData.newBehaviors) || Array.isArray(cardData.alternativeResponses)) {
    extractedData.actionPlan = {
      newBehaviors: Array.isArray(cardData.newBehaviors) ? cardData.newBehaviors : [],
      ...(Array.isArray(cardData.alternativeResponses)
        ? { alternativeResponses: (cardData.alternativeResponses as Array<{ response: string }>).
            map((r) => typeof r?.response === 'string' ? r.response : String(r || '')) }
        : {})
    };
  }

  return extractedData;
}
