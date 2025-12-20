import {
  analyzeCBTMessage,
  isCBTDiaryMessage,
  hasUserQuantifiedAssessments,
  extractUserRatings,
  getCBTIdentificationReason,
} from '@/features/chat/lib/cbt-message-detector';

describe('cbt-message-detector edges', () => {
  it('returns low confidence for non-CBT content', () => {
    const sig = analyzeCBTMessage('Just a casual chat about weather and lunch.');
    expect(sig.confidence).toBeLessThan(0.2);
    expect(isCBTDiaryMessage('random text', 0.3)).toBe(false);
  });

  it('detects user quantified assessments in free text', () => {
    const text = 'I feel anxiety at 7/10 and my stress level is 6.';
    expect(hasUserQuantifiedAssessments(text)).toBe(true);
  });

  it('extracts structured and free-text ratings and produces reasons', () => {
    const text = `
    ## 📍 Situation Context
    - Anxiety: 7/10
    - Fear: 5/10
    I would rate this 6.
    * (7/10) *
    SCHEMA REFLECTION
    Therapeutic Insights
    `;
    const ratings = extractUserRatings(text);
    expect(ratings.length).toBeGreaterThanOrEqual(3);
    const sig = analyzeCBTMessage(text);
    const reason = getCBTIdentificationReason(sig);
    expect(reason.toLowerCase()).toContain('schema reflection');
  });

  it('detects schema analysis patterns', () => {
    const msg =
      '## 🎯 Core Schema Analysis\n\nCore Belief: I am not good enough\nBehavioral Patterns: Avoidance\n*Credibility: 7/10*';
    const sig = analyzeCBTMessage(msg);
    expect(sig.hasSchemaAnalysis).toBe(true);
  });

  it('handles messages with multiple user ratings patterns', () => {
    const msg = 'I feel anxiety at 8/10\n- Stress: 9/10\n*(7/10)*';
    const sig = analyzeCBTMessage(msg);
    expect(sig.hasQuantifiedSelfAssessment).toBe(true);
  });
});
