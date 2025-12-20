import type { CBTSessionSummaryData } from '@/features/therapy/components/cbt-session-summary-card';
import type { ActionPlanData, EmotionData, ThoughtData } from '@/types';
import { CBT_STEP_CONFIG } from './config';
import { CBT_STEP_ORDER, type CBTFlowContext, type CBTFlowState, type CBTStepId } from './types';

function toIsoDateLabel(timestamp?: string | null): string {
  if (!timestamp) return new Date().toLocaleDateString();
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString();
  }
  return date.toLocaleDateString();
}

function emotionList(emotions?: EmotionData | null): Array<{ emotion: string; rating: number }> {
  if (!emotions) return [];
  const coreKeys: Array<keyof EmotionData> = [
    'fear',
    'anger',
    'sadness',
    'joy',
    'anxiety',
    'shame',
    'guilt',
  ];
  const result: Array<{ emotion: string; rating: number }> = [];
  for (const key of coreKeys) {
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

function mapThoughts(thoughts?: ThoughtData[]): Array<{ thought: string; credibility: number }> {
  if (!thoughts || thoughts.length === 0) return [];
  return thoughts.map((thought) => ({
    thought: thought.thought,
    credibility: thought.credibility,
  }));
}

function mapRationalThoughts(
  context: CBTFlowContext
): Array<{ thought: string; confidence: number }> {
  const rational = context.rationalThoughts?.rationalThoughts;
  if (!rational || rational.length === 0) return [];
  return rational.map((thought) => ({ thought: thought.thought, confidence: thought.confidence }));
}

function mapSchemaModes(context: CBTFlowContext): Array<{ name: string; intensity?: number }> {
  const modes = context.schemaModes?.selectedModes;
  if (!modes || modes.length === 0) return [];
  return modes
    .filter((mode) => mode.selected)
    .map((mode) => ({ name: mode.name, intensity: mode.intensity }));
}

function mapCompletedSteps(stepIds: CBTStepId[]): string[] {
  return stepIds.map((stepId) => CBT_STEP_CONFIG[stepId].metadata.title.defaultText);
}

function extractNewBehaviours(actionPlan?: ActionPlanData): string[] | undefined {
  if (!actionPlan?.newBehaviors) return undefined;
  const value = actionPlan.newBehaviors.trim();
  if (!value) return undefined;
  return [value];
}

export function buildSummaryCardFromState(state: CBTFlowState): CBTSessionSummaryData {
  const { context } = state;
  return {
    date: toIsoDateLabel(state.startedAt),
    situation: context.situation?.situation,
    initialEmotions: emotionList(context.emotions),
    automaticThoughts: mapThoughts(context.thoughts),
    coreBelief: context.coreBelief
      ? {
          belief: context.coreBelief.coreBeliefText,
          credibility: context.coreBelief.coreBeliefCredibility,
        }
      : undefined,
    rationalThoughts: mapRationalThoughts(context),
    schemaModes: mapSchemaModes(context),
    finalEmotions: emotionList(
      context.finalEmotions ?? context.actionPlan?.finalEmotions ?? undefined
    ),
    newBehaviors: extractNewBehaviours(context.actionPlan),
    completedSteps: mapCompletedSteps(state.completedSteps),
  };
}

export function buildMarkdownSummary(state: CBTFlowState): string {
  const { context } = state;
  const dateLabel = toIsoDateLabel(state.startedAt);
  let summary = `## CBT Session Summary - ${dateLabel}\n\n`;

  if (context.situation) {
    summary += `**Situation**: ${context.situation.situation}\n\n`;
  }

  const initialEmotions = emotionList(context.emotions);
  if (initialEmotions.length > 0) {
    const formatted = initialEmotions
      .map((emotion) => `${emotion.emotion}: ${emotion.rating}/10`)
      .join(', ');
    summary += `**Initial Emotions**: ${formatted}\n\n`;
  }

  if (context.thoughts && context.thoughts.length > 0) {
    summary += '**Automatic Thoughts**:\n';
    context.thoughts.forEach((thought, index) => {
      summary += `${index + 1}. "${thought.thought}" (${thought.credibility}/10)\n`;
    });
    summary += '\n';
  }

  if (context.coreBelief) {
    summary += `**Core Belief**: "${context.coreBelief.coreBeliefText}" (${context.coreBelief.coreBeliefCredibility}/10)\n\n`;
  }

  const rationalThoughts = mapRationalThoughts(context);
  if (rationalThoughts.length > 0) {
    summary += '**Rational Alternative Thoughts**:\n';
    rationalThoughts.forEach((thought, index) => {
      summary += `${index + 1}. "${thought.thought}" (${thought.confidence}/10)\n`;
    });
    summary += '\n';
  }

  const schemaModes = mapSchemaModes(context);
  if (schemaModes.length > 0) {
    summary += '**Active Schema Modes**:\n';
    schemaModes.forEach((mode, index) => {
      summary += `${index + 1}. ${mode.name}${typeof mode.intensity === 'number' ? ` (${mode.intensity}/10)` : ''}\n`;
    });
    summary += '\n';
  }

  const finalEmotionList = emotionList(
    context.finalEmotions ?? context.actionPlan?.finalEmotions ?? undefined
  );
  if (finalEmotionList.length > 0) {
    const formatted = finalEmotionList
      .map((emotion) => `${emotion.emotion}: ${emotion.rating}/10`)
      .join(', ');
    summary += `**Final Emotions**: ${formatted}\n\n`;
  }

  if (context.actionPlan?.newBehaviors) {
    summary += `**New Behaviors/Strategies**: ${context.actionPlan.newBehaviors}\n\n`;
  }

  summary +=
    '*Structured reflection: Situation, Emotions, Thoughts, Core Beliefs, Rational Alternatives, Schema Modes, and Action Plan.*';

  return summary;
}

export function deriveCompletedSteps(state: CBTFlowState): CBTStepId[] {
  return state.completedSteps;
}

export function derivePendingStep(state: CBTFlowState): CBTStepId | 'complete' {
  return state.currentStepId;
}

export function deriveTimelineOrder(): readonly CBTStepId[] {
  return CBT_STEP_ORDER;
}
