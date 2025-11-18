import type {
  EmotionData,
  ThoughtData,
  CoreBeliefData,
  ChallengeQuestionData,
  RationalThoughtData,
  ActionPlanData,
} from '@/types';

export const asEmotionData = (e: unknown): EmotionData => {
  const src = (e ?? {}) as Partial<Record<string, unknown>>;
  return {
    fear: Number(src.fear ?? 0),
    anger: Number(src.anger ?? 0),
    sadness: Number(src.sadness ?? 0),
    joy: Number(src.joy ?? 0),
    anxiety: Number(src.anxiety ?? 0),
    shame: Number(src.shame ?? 0),
    guilt: Number(src.guilt ?? 0),
    other: typeof src.other === 'string' ? src.other : '',
    otherIntensity: Number(src.otherIntensity ?? 0),
  };
};

export const asThoughtDataArray = (arr: unknown): ThoughtData[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((t) => {
      if (t && typeof t === 'object') {
        const o = t as Record<string, unknown>;
        const text = String(o.thought ?? o.text ?? o.content ?? '');
        const credibility = Number(o.credibility ?? 5);
        return { thought: text, credibility };
      }
      return { thought: String(t ?? ''), credibility: 5 };
    })
    .filter((t) => t.thought.length > 0);
};

export const asCoreBeliefData = (input: unknown): CoreBeliefData => {
  const src = (input ?? {}) as Partial<Record<string, unknown>>;
  return {
    coreBeliefText: String(src.coreBeliefText ?? ''),
    coreBeliefCredibility: Number(src.coreBeliefCredibility ?? 5),
  };
};

export const asChallengeQuestionsArray = (arr: unknown): ChallengeQuestionData[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((q) => {
      if (q && typeof q === 'object') {
        const o = q as Record<string, unknown>;
        const question = String(o.question ?? o.q ?? o.prompt ?? '');
        const answer = String(o.answer ?? o.a ?? o.response ?? '');
        return { question, answer };
      }
      return { question: String(q ?? ''), answer: '' };
    })
    .filter((q) => q.question.length > 0);
};

export const asRationalThoughtsArray = (arr: unknown): RationalThoughtData[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((t) => {
      if (t && typeof t === 'object') {
        const o = t as Record<string, unknown>;
        const thought = String(o.thought ?? o.text ?? o.content ?? '');
        const confidence = Number(o.confidence ?? 5);
        return { thought, confidence };
      }
      return { thought: String(t ?? ''), confidence: 5 };
    })
    .filter((t) => t.thought.length > 0);
};

export const asActionPlanData = (input: unknown): ActionPlanData => {
  const src = (input ?? {}) as Partial<Record<string, unknown>>;
  return {
    finalEmotions: asEmotionData(src.finalEmotions ?? {}),
    originalThoughtCredibility: Number(src.originalThoughtCredibility ?? 5),
    newBehaviors: String(src.newBehaviors ?? ''),
  };
};
