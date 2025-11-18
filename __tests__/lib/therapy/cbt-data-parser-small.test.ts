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
  parseAllCBTData,
  hasCBTData,
  generateCBTSummary,
} from '@/lib/therapy/parsers';

describe('cbt-data-parser small unit tests', () => {
  const sample =
    `**CBT Session - Situation Analysis**\n📅 **Date**: 2024-01-01\n📝 **Situation**: Example situation\n---\n` +
    `**CBT Session - Emotion Assessment**\n💭 **Current Emotional State**:\n• **Fear**: 7/10\n• **OtherX**: 5/10\n**Total Emotions**\n` +
    `**CBT Session - Automatic Thoughts**\n🧠 **Identified Thoughts**:\n1. "I will fail"\n**Total Thoughts**\n` +
    `**CBT Session - Core Belief Exploration**\n🎯 **Identified Core Belief**: "I am not good enough"\n📊 **Belief Strength**: 6/10\n` +
    `**CBT Session - Thought Challenging**\n❓ **Challenge Questions & Responses**:\n\n**Question 1**: What evidence supports this?\n**Answer**: Some.\n\n**Total Questions**\n` +
    `**CBT Session - Rational Response Development**\n💡 **Alternative Rational Thoughts**:\n1. "I can improve"\n**Total Rational**\n` +
    `**CBT Session - Schema Mode Analysis**\n👥 **Active Schema Modes**:\n• **Vulnerable Child** (5/10): scared\n**Total Active**\n` +
    `**CBT Session - Action Plan & Final Assessment**\n🎯 **New Behaviors to Practice**:\n1. Try once\n😌 Final\n` +
    `📊 **Emotional Changes During Session**:\n\n↘️ **Fear**: 7 → 3 (decreased by 4)\n**Total Changes**`;

  it('extractors return expected minimal structures', () => {
    expect(extractSituationData(sample)).toEqual({
      date: '2024-01-01',
      description: 'Example situation',
    });
    expect(extractEmotionData(sample)).toEqual({
      initial: { fear: 7, other: 5 },
      customEmotion: 'OtherX',
    });
    expect(extractThoughtsData(sample)).toEqual({ automaticThoughts: ['I will fail'] });
    expect(extractCoreBeliefData(sample)).toEqual({
      belief: 'I am not good enough',
      credibility: 6,
    });
    expect(extractChallengeData(sample)).toEqual([
      { question: 'What evidence supports this?', answer: 'Some.' },
    ]);
    expect(extractRationalThoughtsData(sample)).toEqual({ thoughts: ['I can improve'] });
    expect(extractSchemaModesData(sample)).toEqual([
      { name: 'Vulnerable Child', intensity: 5, description: 'scared' },
    ]);
    expect(extractActionPlanData(sample)).toEqual({ newBehaviors: ['Try once'] });
    expect(extractEmotionComparison(sample)).toEqual({
      changes: [{ emotion: 'fear', initial: 7, final: 3, direction: 'decreased', change: 4 }],
    });
  });

  it('parseAllCBTData assembles sections and generateCBTSummary summarizes key parts', () => {
    const parsed = parseAllCBTData([{ role: 'assistant', content: sample }]);
    expect(parsed.situation?.description).toBe('Example situation');
    const summary = generateCBTSummary(parsed);
    expect(summary).toContain('**Situation**');
    expect(summary).toContain('**Initial Emotions**');
  });

  it('hasCBTData detects markers', () => {
    expect(hasCBTData([{ role: 'assistant', content: sample }])).toBe(true);
    expect(hasCBTData([{ role: 'assistant', content: 'no markers' }])).toBe(false);
  });
});
