import { generateFallbackAnalysis } from '@/lib/reports/fallback-analysis';

describe('fallback-analysis', () => {
  it('generates themes and basic fields from human-readable content', () => {
    const input = `I have been feeling overwhelmed and anxious about work deadlines. Sometimes I think it will be a disaster if I miss one. I also notice a pattern of avoidance.`;
    const analysis = generateFallbackAnalysis(input);

    expect(analysis.sessionOverview?.themes?.length).toBeGreaterThan(0);
    expect(typeof analysis.moodAssessment).toBe('string');
    expect(Array.isArray(analysis.cognitiveDistortions)).toBe(true);
    expect(Array.isArray(analysis.actionItems)).toBe(true);
  });
});


