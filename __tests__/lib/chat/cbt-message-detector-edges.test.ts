import { analyzeCBTMessage, isCBTDiaryMessage, hasUserQuantifiedAssessments, extractUserRatings, getCBTIdentificationReason, detectCBTMessage } from '@/lib/chat/cbt-message-detector';

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

  it('detects British spelling (analyse)', () => {
    const msg = '##📍 Situation: Work stress\n\n## 🧠 Automatic Thoughts:\n- "I should analyse this" *(8/10)*';
    const sig = detectCBTMessage(msg);
    expect(sig.hasAutomaticThoughts).toBe(true);
    expect(sig.confidence).toBeGreaterThan(0.5);
  });

  it('handles messages with schema analysis patterns', () => {
    const msg = '## 🎯 Core Schema Analysis\n\nCore Belief: I am not good enough\nBehavioral Patterns: Avoidance\n*Credibility: 7/10*';
    const sig = detectCBTMessage(msg);
    expect(sig.hasSchemaAnalysis).toBe(true);
    expect(sig.confidence).toBeGreaterThan(0.6);
  });

  it('detects final reflection sections', () => {
    const msg = '## 📍 Situation\nWork meeting\n\n## ✨ Final Reflection\nLearned to challenge negative thoughts';
    const sig = detectCBTMessage(msg);
    expect(sig.hasReflection).toBe(true);
  });

  it('calculates schema reflection depth as comprehensive', () => {
    const msg = '## 🎯 Core Schema Analysis\n\nCore Belief: Inadequacy\n*Credibility: 8/10*\nBehavioral Patterns:\n- Confirming behaviors: Perfectionism\n- Avoidant behaviors: Procrastination\nSchema Modes: Self-critical\n\nThis affects my daily interactions significantly and shapes how I view myself in relationships.';
    const sig = detectCBTMessage(msg);
    expect(sig.schemaReflectionDepth).toBe('comprehensive');
  });

  it('calculates schema reflection depth as moderate', () => {
    const msg = '## 🎯 Core Schema Analysis\nCore Belief: Fear of failure\n*Credibility: 6/10*\nBehavioral Patterns: Avoidance';
    const sig = detectCBTMessage(msg);
    expect(sig.schemaReflectionDepth).toBe('moderate');
  });

  it('calculates schema reflection depth as minimal', () => {
    const msg = '## 🎯 Core Schema Analysis\nCore Belief: Unworthiness';
    const sig = detectCBTMessage(msg);
    expect(sig.schemaReflectionDepth).toBe('minimal');
  });

  it('handles messages with multiple user-provided ratings', () => {
    const msg = 'I assess my anxiety as 8/10\nMy self-assessment: 7\nI rate this as 6\n- Anxiety: 9/10\n*(7/10)*';
    const sig = detectCBTMessage(msg);
    expect(sig.hasUserProvidedRatings).toBe(true);
    expect(sig.hasQuantifiedSelfAssessment).toBe(true);
  });
});


