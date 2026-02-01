import type { CBTSessionSummaryData } from '@/features/therapy/components/cbt-session-summary-card';
import type { ActionPlanData, EmotionData, ThoughtData } from '@/types';
import {
  type SupportedLocale,
  localizeSchemaMode,
} from '@/lib/cbt/schema-mode-localization';
import { CBT_STEP_CONFIG } from './config';
import { CBT_STEP_ORDER, type CBTFlowContext, type CBTFlowState, type CBTStepId } from './types';

const EMOTION_LABELS_NL: Record<string, string> = {
  fear: 'Angst',
  anger: 'Boosheid',
  sadness: 'Verdriet',
  joy: 'Blijdschap',
  anxiety: 'Onrust',
  shame: 'Schaamte',
  guilt: 'Schuld',
};

const SUMMARY_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    title: 'CBT Session Summary',
    situation: 'Situation',
    initialEmotions: 'Initial Emotions',
    automaticThoughts: 'Automatic Thoughts',
    coreBelief: 'Core Belief',
    rationalThoughts: 'Rational Alternative Thoughts',
    schemaModes: 'Active Schema Modes',
    finalEmotions: 'Final Emotions',
    newBehaviors: 'New Behaviors/Strategies',
    footer:
      'Structured reflection: Situation, Emotions, Thoughts, Core Beliefs, Rational Alternatives, Schema Modes, and Action Plan.',
    wrapperTitle: 'CBT Session Completed',
    explored: 'Explored',
    startedWith: 'Started with',
    emotionalShift: 'Emotional shift',
    coreBeliefIdentified: 'Core belief identified',
    keyThought: 'Key thought',
    credibility: 'credibility',
    activeModes: 'Active modes',
    newStrategy: 'New strategy',
    wrapperFooter: 'Full structured data below for detailed analysis.',
  },
  nl: {
    title: 'CGT-sessiesamenvatting',
    situation: 'Situatie',
    initialEmotions: 'Beginemoties',
    automaticThoughts: 'Automatische gedachten',
    coreBelief: 'Kernopvatting',
    rationalThoughts: 'Rationele gedachten',
    schemaModes: 'Actieve schema-modi',
    finalEmotions: 'Eindemoties',
    newBehaviors: 'Nieuwe gedragingen/strategieën',
    footer:
      'Gestructureerde reflectie: situatie, emoties, gedachten, kernopvattingen, rationele alternatieven, schema-modi en actieplan.',
    wrapperTitle: 'CGT-sessie voltooid',
    explored: 'Verkend',
    startedWith: 'Begonnen met',
    emotionalShift: 'Emotionele verschuiving',
    coreBeliefIdentified: 'Kernopvatting geïdentificeerd',
    keyThought: 'Kern-gedachte',
    credibility: 'geloofwaardigheid',
    activeModes: 'Actieve modi',
    newStrategy: 'Nieuwe strategie',
    wrapperFooter: 'Volledige gestructureerde data hieronder voor verdere analyse.',
  },
};

function getLocaleDateLabel(locale: SupportedLocale): string {
  return locale === 'nl' ? 'nl-NL' : 'en-US';
}

function toIsoDateLabel(timestamp: string | null | undefined, locale: SupportedLocale): string {
  const fallback = new Date().toLocaleDateString(getLocaleDateLabel(locale));
  if (!timestamp) return fallback;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleDateString(getLocaleDateLabel(locale));
}

function getEmotionLabel(key: string, locale: SupportedLocale): string {
  if (locale === 'nl') {
    return EMOTION_LABELS_NL[key] ?? key;
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function emotionList(
  emotions: EmotionData | null | undefined,
  locale: SupportedLocale
): Array<{ emotion: string; rating: number }> {
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
      result.push({ emotion: getEmotionLabel(label, locale), rating: value });
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

function mapSchemaModes(
  context: CBTFlowContext,
  locale: SupportedLocale
): Array<{ name: string; intensity?: number }> {
  const modes = context.schemaModes?.selectedModes;
  if (!modes || modes.length === 0) return [];
  return modes
    .filter((mode) => mode.selected)
    .map((mode) => ({
      name: localizeSchemaMode(mode, locale, 'report').name ?? mode.name,
      intensity: mode.intensity,
    }));
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

export function buildSummaryCardFromState(
  state: CBTFlowState,
  locale: SupportedLocale = 'en'
): CBTSessionSummaryData {
  const { context } = state;
  return {
    date: toIsoDateLabel(state.startedAt, locale),
    situation: context.situation?.situation,
    initialEmotions: emotionList(context.emotions, locale),
    automaticThoughts: mapThoughts(context.thoughts),
    coreBelief: context.coreBelief
      ? {
          belief: context.coreBelief.coreBeliefText,
          credibility: context.coreBelief.coreBeliefCredibility,
        }
      : undefined,
    rationalThoughts: mapRationalThoughts(context),
    schemaModes: mapSchemaModes(context, locale),
    finalEmotions: emotionList(
      context.finalEmotions ?? context.actionPlan?.finalEmotions ?? undefined,
      locale
    ),
    newBehaviors: extractNewBehaviours(context.actionPlan),
    completedSteps: mapCompletedSteps(state.completedSteps),
  };
}

export function buildMarkdownSummary(
  state: CBTFlowState,
  locale: SupportedLocale = 'en'
): string {
  const { context } = state;
  const labels = SUMMARY_LABELS[locale];
  const dateLabel = toIsoDateLabel(state.startedAt, locale);
  let summary = `## ${labels.title} - ${dateLabel}\n\n`;

  if (context.situation) {
    summary += `**${labels.situation}:** ${context.situation.situation}\n\n`;
  }

  const initialEmotions = emotionList(context.emotions, locale);
  if (initialEmotions.length > 0) {
    const formatted = initialEmotions
      .map((emotion) => `${emotion.emotion}: ${emotion.rating}/10`)
      .join(', ');
    summary += `**${labels.initialEmotions}:** ${formatted}\n\n`;
  }

  if (context.thoughts && context.thoughts.length > 0) {
    summary += `**${labels.automaticThoughts}:**\n`;
    context.thoughts.forEach((thought, index) => {
      summary += `${index + 1}. "${thought.thought}" (${thought.credibility}/10)\n`;
    });
    summary += '\n';
  }

  if (context.coreBelief) {
    summary += `**${labels.coreBelief}:** "${context.coreBelief.coreBeliefText}" (${context.coreBelief.coreBeliefCredibility}/10)\n\n`;
  }

  const rationalThoughts = mapRationalThoughts(context);
  if (rationalThoughts.length > 0) {
    summary += `**${labels.rationalThoughts}:**\n`;
    rationalThoughts.forEach((thought, index) => {
      summary += `${index + 1}. "${thought.thought}" (${thought.confidence}/10)\n`;
    });
    summary += '\n';
  }

  const schemaModes = mapSchemaModes(context, locale);
  if (schemaModes.length > 0) {
    summary += `**${labels.schemaModes}:**\n`;
    schemaModes.forEach((mode, index) => {
      summary += `${index + 1}. ${mode.name}${typeof mode.intensity === 'number' ? ` (${mode.intensity}/10)` : ''}\n`;
    });
    summary += '\n';
  }

  const finalEmotionList = emotionList(
    context.finalEmotions ?? context.actionPlan?.finalEmotions ?? undefined,
    locale
  );
  if (finalEmotionList.length > 0) {
    const formatted = finalEmotionList
      .map((emotion) => `${emotion.emotion}: ${emotion.rating}/10`)
      .join(', ');
    summary += `**${labels.finalEmotions}:** ${formatted}\n\n`;
  }

  if (context.actionPlan?.newBehaviors) {
    summary += `**${labels.newBehaviors}:** ${context.actionPlan.newBehaviors}\n\n`;
  }

  summary += `*${labels.footer}*`;

  return summary;
}

/**
 * Compute emotion changes between initial and final states.
 * Returns an array of emotions that changed, with direction and magnitude.
 */
export function computeEmotionDelta(
  state: CBTFlowState,
  locale: SupportedLocale = 'en'
): Array<{ emotion: string; initial: number; final: number; change: number }> {
  const { context } = state;
  const initial = emotionList(context.emotions, locale);
  const final = emotionList(
    context.finalEmotions ?? context.actionPlan?.finalEmotions ?? undefined,
    locale
  );

  if (initial.length === 0 || final.length === 0) return [];

  const finalMap = new Map(final.map((e) => [e.emotion.toLowerCase(), e.rating]));
  const deltas: Array<{ emotion: string; initial: number; final: number; change: number }> = [];

  for (const { emotion, rating: initialRating } of initial) {
    const finalRating = finalMap.get(emotion.toLowerCase());
    if (typeof finalRating === 'number' && finalRating !== initialRating) {
      deltas.push({
        emotion,
        initial: initialRating,
        final: finalRating,
        change: finalRating - initialRating,
      });
    }
  }

  // Sort by absolute change magnitude (biggest changes first)
  return deltas.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

/**
 * Build a human-readable therapeutic wrapper that provides context for the AI
 * and is also readable if user reviews chat history.
 */
export function buildTherapeuticWrapper(
  state: CBTFlowState,
  locale: SupportedLocale = 'en'
): string {
  const { context } = state;
  const labels = SUMMARY_LABELS[locale];
  const dateLabel = toIsoDateLabel(state.startedAt, locale);
  const lines: string[] = [];

  lines.push(`## ${labels.wrapperTitle} - ${dateLabel}`);
  lines.push('');

  // Situation context
  if (context.situation?.situation) {
    const situation = context.situation.situation;
    const truncated = situation.length > 150 ? situation.slice(0, 147) + '...' : situation;
    lines.push(`**${labels.explored}:** ${truncated}`);
    lines.push('');
  }

  // Initial emotional state (top 3 by intensity)
  const initialEmotions = emotionList(context.emotions, locale);
  if (initialEmotions.length > 0) {
    const top3 = initialEmotions.sort((a, b) => b.rating - a.rating).slice(0, 3);
    const formatted = top3.map((e) => `${e.emotion} ${e.rating}/10`).join(', ');
    lines.push(`**${labels.startedWith}:** ${formatted}`);
  }

  // Emotion delta if available
  const deltas = computeEmotionDelta(state, locale);
  if (deltas.length > 0) {
    const top2 = deltas.slice(0, 2);
    const formatted = top2
      .map((d) => {
        const arrow = d.change < 0 ? '↓' : '↑';
        return `${d.emotion} ${d.initial}→${d.final} ${arrow}`;
      })
      .join(', ');
    lines.push(`**${labels.emotionalShift}:** ${formatted}`);
  }

  // Key insight (core belief or top automatic thought)
  if (context.coreBelief?.coreBeliefText) {
    const belief = context.coreBelief.coreBeliefText;
    const truncated = belief.length > 80 ? belief.slice(0, 77) + '...' : belief;
    lines.push(`**${labels.coreBeliefIdentified}:** "${truncated}"`);
  } else if (context.thoughts && context.thoughts.length > 0) {
    const topThought = [...context.thoughts].sort((a, b) => b.credibility - a.credibility)[0];
    const truncated =
      topThought.thought.length > 80
        ? topThought.thought.slice(0, 77) + '...'
        : topThought.thought;
    lines.push(
      `**${labels.keyThought}:** "${truncated}" (${topThought.credibility}/10 ${labels.credibility})`
    );
  }

  // Active schema modes (if any with intensity >= 3)
  const activeModes = mapSchemaModes(context, locale).filter(
    (m) => typeof m.intensity === 'number' && m.intensity >= 3
  );
  if (activeModes.length > 0) {
    const modeNames = activeModes.map((m) => m.name).join(', ');
    lines.push(`**${labels.activeModes}:** ${modeNames}`);
  }

  // New behaviors/strategies if available
  if (context.actionPlan?.newBehaviors) {
    const behaviors = context.actionPlan.newBehaviors;
    const truncated = behaviors.length > 100 ? behaviors.slice(0, 97) + '...' : behaviors;
    lines.push(`**${labels.newStrategy}:** ${truncated}`);
  }

  lines.push('');
  lines.push(`*${labels.wrapperFooter}*`);

  return lines.join('\n');
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
