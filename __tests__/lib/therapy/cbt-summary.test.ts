import { buildSummaryCardFromState, buildMarkdownSummary } from '@/features/therapy/cbt/flow/summary';
import type { CBTFlowState } from '@/features/therapy/cbt/flow/types';

function createState(overrides: Partial<CBTFlowState> = {}): CBTFlowState {
  const base: CBTFlowState = {
    sessionId: 'test-session',
    currentStepId: 'situation' as any,
    completedSteps: [],
    startedAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-01T12:05:00.000Z',
    status: 'active' as any,
    context: {
      situation: { situation: 'Felt anxious during a presentation', date: '2025-01-01T12:00:00.000Z' },
      emotions: { fear: 6, anxiety: 8, anger: 0, sadness: 2, joy: 1, shame: 0, guilt: 0, other: '', otherIntensity: 0 },
      thoughts: [
        { thought: "They'll think I'm incompetent", credibility: 7 },
        { thought: 'I will forget everything', credibility: 8 },
      ],
      coreBelief: { coreBeliefText: 'I am not good enough', coreBeliefCredibility: 6 },
      rationalThoughts: { rationalThoughts: [
        { thought: "One talk doesn't define me", confidence: 7 },
        { thought: 'I prepared sufficiently', confidence: 8 },
      ]},
      schemaModes: { selectedModes: [
        { id: 'vulnerable-child', name: 'The Vulnerable Child', selected: true, intensity: 6, description: '' },
        { id: 'punishing-parent', name: 'The Punishing Parent', selected: false, intensity: 3, description: '' },
      ]},
      actionPlan: { newBehaviors: 'Practice brief breathing exercise before presenting' } as any,
      finalEmotions: { fear: 3, anxiety: 4, anger: 0, sadness: 1, joy: 3, shame: 0, guilt: 0, other: '', otherIntensity: 0 },
    },
  };
  return { ...base, ...overrides } as CBTFlowState;
}

describe('CBT summary utilities', () => {
  it('buildSummaryCardFromState maps context into summary card fields', () => {
    const state = createState({ completedSteps: ['situation', 'emotions'] as any });
    const card = buildSummaryCardFromState(state);
    expect(card.date).toBeDefined();
    expect(card.situation).toContain('anxious');
    expect(card.initialEmotions?.find(e => e.emotion === 'Fear')?.rating).toBe(6);
    expect(card.automaticThoughts?.length).toBe(2);
    expect(card.coreBelief?.belief).toBe('I am not good enough');
    expect(card.rationalThoughts?.length).toBe(2);
    expect(card.schemaModes?.[0]).toMatchObject({ name: 'The Vulnerable Child', intensity: 6 });
    expect(card.finalEmotions?.find(e => e.emotion === 'Fear')?.rating).toBe(3);
    expect(card.newBehaviors?.[0]).toContain('breathing');
    expect(card.completedSteps?.length).toBe(2);
  });

  it('buildMarkdownSummary produces a readable markdown string with sections', () => {
    const state = createState({ completedSteps: ['situation', 'emotions'] as any });
    const md = buildMarkdownSummary(state);
    expect(md).toContain('## CBT Session Summary');
    expect(md).toContain('**Situation:**');
    expect(md).toContain('**Initial Emotions:**');
    expect(md).toContain('**Automatic Thoughts:**');
    expect(md).toContain('**Core Belief:**');
    expect(md).toContain('**Rational Alternative Thoughts:**');
    expect(md).toContain('**Active Schema Modes:**');
    expect(md).toContain('**Final Emotions:**');
    expect(md).toContain('**New Behaviors/Strategies:**');
  });

  it('handles missing/invalid fields gracefully', () => {
    const state = createState({
      startedAt: 'invalid-date',
      context: {
        situation: undefined as any,
        emotions: undefined as any,
        thoughts: [],
        coreBelief: undefined as any,
        rationalThoughts: { rationalThoughts: [] },
        schemaModes: { selectedModes: [] },
        actionPlan: { newBehaviors: '   ' } as any,
        finalEmotions: undefined as any,
      },
      completedSteps: [],
    } as any);
    const card = buildSummaryCardFromState(state);
    expect(Array.isArray(card.initialEmotions)).toBe(true);
    expect(card.automaticThoughts).toEqual([]);
    expect(card.coreBelief).toBeUndefined();
    expect(card.rationalThoughts).toEqual([]);
    expect(card.schemaModes).toEqual([]);
    expect(card.newBehaviors).toBeUndefined();
    const md = buildMarkdownSummary(state);
    expect(typeof md).toBe('string');
  });
});


