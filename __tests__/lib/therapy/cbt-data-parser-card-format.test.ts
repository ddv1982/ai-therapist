import { parseAllCBTData, hasCBTData } from '@/lib/therapy/cbt-data-parser';

describe('cbt-data-parser card format', () => {
  it('parses unified card format from HTML comment JSON', () => {
    const card =
      '<!-- CBT_SUMMARY_CARD:' +
      JSON.stringify({
        situation: 'Short desc',
        date: '2024-05-05',
        initialEmotions: [{ emotion: 'fear', rating: 6 }],
        finalEmotions: [{ emotion: 'fear', rating: 3 }],
        automaticThoughts: [{ thought: 'I will fail' }],
        coreBelief: { belief: 'I am not enough', credibility: 7 },
        rationalThoughts: [{ thought: 'I can learn' }],
        schemaModes: [{ name: 'Vulnerable Child', intensity: 4 }],
        newBehaviors: ['Try once'],
        alternativeResponses: [{ response: 'Practice reframing' }],
      }) +
      ' -->';
    const parsed = parseAllCBTData([{ role: 'assistant', content: card }]);
    expect(parsed.situation?.date).toBe('2024-05-05');
    expect(parsed.situation?.description).toBe('Short desc');
    expect(parsed.emotions?.initial?.fear).toBe(6);
    expect(parsed.emotions?.final?.fear).toBe(3);
    expect(parsed.thoughts?.automaticThoughts[0]).toBe('I will fail');
    expect(parsed.coreBeliefs?.belief).toBe('I am not enough');
    expect(parsed.rationalThoughts?.thoughts[0]).toBe('I can learn');
    expect(parsed.schemaModes?.[0].name).toBe('Vulnerable Child');
    expect(parsed.actionPlan?.newBehaviors[0]).toBe('Try once');
  });

  it('detects card format via hasCBTData', () => {
    const card = '<!-- CBT_SUMMARY_CARD:{} -->';
    expect(hasCBTData([{ role: 'assistant', content: card }])).toBe(true);
  });
});
