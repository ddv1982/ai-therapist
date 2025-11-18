import type { CBTSessionSummaryData } from '@/features/therapy/components/cbt-session-summary-card';
export type { CBTSessionSummaryData } from '@/features/therapy/components/cbt-session-summary-card';
import type { EmotionData, ThoughtData } from '@/types';
import { CBT_STEP_ORDER, type CBTFlowContext, type CBTFlowState, type CBTStepId } from './types';
import { buildSummaryCardFromState } from './summary';
import { CBT_STEP_CONFIG } from './config';

const CARD_PREFIX = '<!-- CBT_SUMMARY_CARD:';
const CARD_SUFFIX = ' -->\n<!-- END_CBT_SUMMARY_CARD -->';

function toCardString(data: Partial<CBTSessionSummaryData>): string {
  return `${CARD_PREFIX}${JSON.stringify(data)}${CARD_SUFFIX}`;
}

function emotionList(emotions?: EmotionData | null): Array<{ emotion: string; rating: number }> {
  if (!emotions) return [];
  const keys: Array<keyof EmotionData> = [
    'fear',
    'anger',
    'sadness',
    'joy',
    'anxiety',
    'shame',
    'guilt',
  ];
  const result: Array<{ emotion: string; rating: number }> = [];
  for (const key of keys) {
    const value = emotions[key];
    if (typeof value === 'number' && value > 0) {
      const label = typeof key === 'string' ? key : String(key);
      result.push({ emotion: label.charAt(0).toUpperCase() + label.slice(1), rating: value });
    }
  }
  if (
    emotions.other &&
    typeof emotions.otherIntensity === 'number' &&
    emotions.otherIntensity > 0
  ) {
    result.push({ emotion: emotions.other, rating: emotions.otherIntensity });
  }
  return result;
}

function completedLabel(stepId: CBTStepId): string {
  const config = CBT_STEP_CONFIG[stepId];
  const label = config.metadata.completedLabel?.defaultText ?? config.metadata.title.defaultText;
  return label;
}

function formatThoughts(thoughts?: ThoughtData[]): Array<{ thought: string; credibility: number }> {
  if (!thoughts || thoughts.length === 0) return [];
  return thoughts.map((thought) => ({
    thought: thought.thought,
    credibility: thought.credibility,
  }));
}

export function buildStepCard(stepId: CBTStepId, context: CBTFlowContext): string | null {
  switch (stepId) {
    case 'situation':
      if (!context.situation) return null;
      return toCardString({
        date: context.situation.date,
        situation: context.situation.situation,
        completedSteps: [completedLabel(stepId)],
      });
    case 'emotions':
      if (!context.emotions) return null;
      return toCardString({
        initialEmotions: emotionList(context.emotions),
        completedSteps: [completedLabel(stepId)],
      });
    case 'thoughts':
      if (!context.thoughts || context.thoughts.length === 0) return null;
      return toCardString({
        automaticThoughts: formatThoughts(context.thoughts),
        completedSteps: [completedLabel(stepId)],
      });
    case 'core-belief':
      if (!context.coreBelief) return null;
      return toCardString({
        coreBelief: {
          belief: context.coreBelief.coreBeliefText,
          credibility: context.coreBelief.coreBeliefCredibility,
        },
        completedSteps: [completedLabel(stepId)],
      });
    case 'challenge-questions':
      if (
        !context.challengeQuestions ||
        context.challengeQuestions.challengeQuestions.length === 0
      ) {
        return null;
      }
      return toCardString({
        automaticThoughts: context.challengeQuestions.challengeQuestions.map((item) => ({
          thought: `${item.question} → ${item.answer}`,
          credibility: 6,
        })),
        completedSteps: [completedLabel(stepId)],
      });
    case 'rational-thoughts':
      if (!context.rationalThoughts || context.rationalThoughts.rationalThoughts.length === 0) {
        return null;
      }
      return toCardString({
        rationalThoughts: context.rationalThoughts.rationalThoughts.map((item) => ({
          thought: item.thought,
          confidence: item.confidence,
        })),
        completedSteps: [completedLabel(stepId)],
      });
    case 'schema-modes':
      if (!context.schemaModes || context.schemaModes.selectedModes.length === 0) {
        return null;
      }
      return toCardString({
        schemaModes: context.schemaModes.selectedModes
          .filter((mode) => mode.selected)
          .map((mode) => ({ name: mode.name, intensity: mode.intensity })),
        completedSteps: [completedLabel(stepId)],
      });
    case 'actions':
      if (!context.actionPlan) return null;
      return toCardString({
        newBehaviors: context.actionPlan.newBehaviors
          ? [context.actionPlan.newBehaviors]
          : undefined,
        finalEmotions: emotionList(context.actionPlan.finalEmotions),
        completedSteps: [completedLabel(stepId)],
      });
    case 'final-emotions': {
      const final = context.finalEmotions ?? context.actionPlan?.finalEmotions;
      if (!final) return null;
      return toCardString({
        finalEmotions: emotionList(final),
        completedSteps: [completedLabel(stepId)],
      });
    }
    default:
      return null;
  }
}

export function buildSessionSummaryCard(state: CBTFlowState): string {
  return toCardString(buildSummaryCardFromState(state));
}

export function buildEmotionComparisonCard(initial: EmotionData, final: EmotionData): string {
  return toCardString({
    initialEmotions: emotionList(initial),
    finalEmotions: emotionList(final),
    completedSteps: ['Emotional Progress Tracking'],
  });
}

export function collectCompletedStepCards(context: CBTFlowContext): string[] {
  const cards: string[] = [];
  for (const stepId of CBT_STEP_ORDER) {
    const card = buildStepCard(stepId, context);
    if (card) cards.push(card);
  }
  return cards;
}
