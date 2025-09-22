import { analyzeCBTMessage, isCBTDiaryMessage, hasUserQuantifiedAssessments, extractUserRatings, getCBTIdentificationReason } from '@/lib/chat/cbt-message-detector';

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
});


