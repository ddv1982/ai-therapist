import { CBT_STEP_CONFIG } from '@/features/therapy/cbt/flow/config';

describe('CBT flow config', () => {
  it('persist functions should merge payloads correctly', () => {
    const baseContext: any = {
      situation: undefined,
      emotions: undefined,
      thoughts: undefined,
      coreBelief: undefined,
      challengeQuestions: undefined,
      rationalThoughts: undefined,
      schemaModes: undefined,
      actionPlan: { newBehaviors: 'old', originalThoughtCredibility: 4 },
      finalEmotions: undefined,
    };

    const situation = CBT_STEP_CONFIG.situation.persist(baseContext, { situation: 'A' } as any);
    expect(situation.situation).toEqual({ situation: 'A' });

    const emotions = CBT_STEP_CONFIG.emotions.persist(baseContext, { joy: 1 } as any);
    expect(emotions.emotions).toEqual({ joy: 1 });

    const thoughts = CBT_STEP_CONFIG.thoughts.persist(baseContext, [
      { thought: 'x', credibility: 5 },
    ] as any);
    expect(thoughts.thoughts?.[0].thought).toBe('x');

    const coreBelief = CBT_STEP_CONFIG['core-belief'].persist(baseContext, {
      coreBeliefText: 'bad',
      coreBeliefCredibility: 6,
    } as any);
    expect(coreBelief.coreBelief?.coreBeliefText).toBe('bad');

    const challenge = CBT_STEP_CONFIG['challenge-questions'].persist(baseContext, [
      { question: 'q', answer: 'a' },
    ] as any);
    expect(
      (challenge.challengeQuestions as Array<{ answer: string }> | undefined)?.[0]?.answer
    ).toBe('a');

    const rational = CBT_STEP_CONFIG['rational-thoughts'].persist(baseContext, {
      rationalThoughts: [{ thought: 'r', confidence: 7 }],
    } as any);
    expect(rational.rationalThoughts?.rationalThoughts?.[0].confidence).toBe(7);

    const schema = CBT_STEP_CONFIG['schema-modes'].persist(baseContext, {
      selectedModes: [{ id: '1', name: 'Mode', selected: true }],
    } as any);
    expect(schema.schemaModes?.selectedModes?.[0].name).toBe('Mode');

    const actions = CBT_STEP_CONFIG.actions.persist(baseContext, { newBehaviors: 'new' } as any);
    expect(actions.actionPlan).toMatchObject({
      newBehaviors: 'new',
      originalThoughtCredibility: 4,
    });

    const final = CBT_STEP_CONFIG['final-emotions'].persist(
      { ...baseContext, actionPlan: undefined },
      { fear: 2 } as any
    );
    expect(final.finalEmotions).toEqual({ fear: 2 });
    expect(final.actionPlan).toMatchObject({ finalEmotions: { fear: 2 } });
  });
});
