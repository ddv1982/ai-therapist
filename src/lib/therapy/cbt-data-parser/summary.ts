import type { CBTStructuredAssessment } from '@/types/therapy';

export function generateCBTSummary(cbtData: CBTStructuredAssessment): string {
  const sections: string[] = [];
  if (cbtData.situation) {
    sections.push(`**Situation**: ${cbtData.situation.description} (${cbtData.situation.date})`);
  }
  if (cbtData.emotions?.initial) {
    const emotionList = Object.entries(cbtData.emotions.initial)
      .filter(([, value]) => value > 0)
      .map(([emotion, value]) => `${emotion}: ${value}/10`)
      .join(', ');
    sections.push(`**Initial Emotions**: ${emotionList}`);
  }
  if (cbtData.thoughts?.automaticThoughts.length) {
    sections.push(
      `**Automatic Thoughts**: ${cbtData.thoughts.automaticThoughts.length} identified`
    );
  }
  if (cbtData.coreBeliefs) {
    sections.push(
      `**Core Belief**: "${cbtData.coreBeliefs.belief}" (${cbtData.coreBeliefs.credibility}/10 credibility)`
    );
  }
  if (cbtData.schemaModes?.length) {
    sections.push(`**Active Schema Modes**: ${cbtData.schemaModes.length} modes identified`);
  }
  if (cbtData.emotionComparison?.changes.length) {
    sections.push(
      `**Emotional Progress**: ${cbtData.emotionComparison.changes.length} emotions showed significant changes`
    );
  }
  return sections.join('\n\n');
}
