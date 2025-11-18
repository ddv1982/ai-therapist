import {
  extractEmotionData,
  extractChallengeData,
  parseCBTFromMarkdown,
} from '@/lib/therapy/cbt-data-parser/extractors/markdown';

describe('cbt markdown extractors', () => {
  it('parses rich CBT markdown content into structured data', () => {
    const markdown = `
**Date:** March 5, 2024

## 📍 Situation Context
Feeling pressure to finish multiple projects.

## 💭 Emotional Landscape
- Fear: 4/10
- Joy: 2/10
- Pride: 5/10

### Updated Feelings
- Fear: 2/10
- Joy: 6/10
- Mystery: 7/10

## 🧠 Automatic Thoughts
- "I will fail" *(8/10)*
- "Nobody supports me" *(6/10)*

## 🔄 Rational Thoughts
- "I have succeeded before" *(7/10)*

## 🎯 Core Schema Analysis
**Core Belief:** I must be perfect
*Credibility: 6/10*
**Confirming behaviors:** Overworking
**Avoidant behaviors:** Procrastination
**Overriding behaviors:** Asking for help

### Active Schema Modes
- [x] Vulnerable Child *(Intensity 6/10)*
- [x] Detached Protector *(Intensity 5/10)*

## 🔍 SCHEMA REFLECTION OF THERAPEUTIC INSIGHTS
### 🌱 Personal Self-Assessment
"Learning to accept support."
### 🧭 Guided Reflection Insights
**💡 childhood Pattern:** *Question:* "When do you feel this?" *Insight:* "During deadlines."
**🛡️ coping Pattern:** *Question:* "How do you react?" *Insight:* "I withdraw."
**⭐ custom Pattern:** *Question:* "What else?" *Insight:* "I reach out."

## Challenge Questions
| Question | Answer |
| Q1? | A1 |
| Question | Answer |

### Additional Questions
| Question | Answer |
| Additional | Response |
|  |  |

### New Behaviors
Practice delegating tasks and celebrating small wins.

**Credibility of Original Thoughts:** 4/10
`;

    const parsed = parseCBTFromMarkdown(markdown);

    expect(parsed.formData.date).toMatch(/^2024-03-0[45]$/);
    expect(parsed.formData.situation).toContain('Feeling pressure');

    expect(parsed.formData.initialEmotions).toMatchObject({
      fear: 4,
      joy: 2,
      other: 'Pride',
      otherIntensity: 5,
    });
    expect(parsed.formData.finalEmotions).toMatchObject({
      fear: 2,
      joy: 6,
      other: 'Mystery',
      otherIntensity: 7,
    });

    expect(parsed.formData.automaticThoughts).toEqual([
      { thought: 'I will fail', credibility: 8 },
      { thought: 'Nobody supports me', credibility: 6 },
    ]);
    expect(parsed.formData.rationalThoughts).toEqual([
      { thought: 'I have succeeded before', confidence: 7 },
    ]);

    expect(parsed.formData.coreBeliefText).toBe('I must be perfect');
    expect(parsed.formData.coreBeliefCredibility).toBe(6);
    expect((parsed.formData as any).confirmingBehaviors).toBe('Overworking');
    expect((parsed.formData as any).avoidantBehaviors).toBe('Procrastination');
    expect((parsed.formData as any).overridingBehaviors).toBe('Asking for help');

    const selectedModes = parsed.formData.schemaModes
      .filter((mode) => mode.selected)
      .map((mode) => mode.name);
    expect(selectedModes).toEqual(['Vulnerable Child', 'Detached Protector']);

    const reflection = (parsed.formData as any).schemaReflection;
    expect(reflection.enabled).toBe(true);
    expect(reflection.selfAssessment).toBe('Learning to accept support.');
    expect(reflection.questions).toEqual([
      {
        question: 'When do you feel this?',
        answer: 'During deadlines.',
        category: 'custom',
        isRequired: false,
      },
      {
        question: 'How do you react?',
        answer: 'I withdraw.',
        category: 'custom',
        isRequired: false,
      },
    ]);

    expect(parsed.formData.challengeQuestions).toEqual([{ question: 'Q1?', answer: 'A1' }]);
    expect((parsed.formData as any).additionalQuestions).toEqual([
      { question: 'Additional', answer: 'Response' },
    ]);

    expect(parsed.formData.newBehaviors).toContain(
      'Practice delegating tasks and celebrating small wins.'
    );
    expect(parsed.formData.originalThoughtCredibility).toBe(4);
    expect(parsed.isComplete).toBeDefined();
  });

  it('extracts emotion and challenge data from legacy session format', () => {
    const legacyMarkdown = `
**CBT Session - Emotion Assessment**
💭 **Current Emotional State**:
• **Fear**: 7/10
• **Curiosity**: 5/10

**CBT Session - Thought Challenging**
❓ **Challenge Questions & Responses**:

**Question 1**: What evidence supports this?
**Answer**: Some teammates offered help.

**Question 2**: What evidence contradicts this?
**Answer**: Deadlines were extended.

---`;

    const emotions = extractEmotionData(legacyMarkdown);
    expect(emotions).toEqual({ initial: { fear: 7, other: 5 }, customEmotion: 'Curiosity' });

    const challenges = extractChallengeData(legacyMarkdown);
    expect(challenges).toEqual([
      { question: 'What evidence supports this?', answer: 'Some teammates offered help.' },
      { question: 'What evidence contradicts this?', answer: 'Deadlines were extended.' },
    ]);
  });
});
