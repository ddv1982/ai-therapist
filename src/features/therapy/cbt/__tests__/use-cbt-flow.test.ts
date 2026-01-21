import {
  hasStepData,
  computeStartingStep,
  type CBTSessionData,
} from '../hooks/use-cbt-flow';
import type { EmotionData, ActionPlanData } from '@/types';

// Helper to create valid EmotionData for tests
const createEmotionData = (overrides: Partial<EmotionData> = {}): EmotionData => ({
  fear: 0,
  anger: 0,
  sadness: 0,
  joy: 0,
  anxiety: 5,
  shame: 0,
  guilt: 0,
  ...overrides,
});

// Helper to create valid ActionPlanData for tests
const createActionPlanData = (overrides: Partial<ActionPlanData> = {}): ActionPlanData => ({
  finalEmotions: createEmotionData(),
  originalThoughtCredibility: 5,
  newBehaviors: 'test behaviors',
  ...overrides,
});

describe('use-cbt-flow helpers', () => {
  describe('hasStepData', () => {
    test('returns false for undefined data', () => {
      expect(hasStepData(undefined, 'situation')).toBe(false);
    });

    test('returns false for null field value', () => {
      const data: Partial<CBTSessionData> = { situation: null };
      expect(hasStepData(data, 'situation')).toBe(false);
    });

    test('returns false for empty array (thoughts)', () => {
      const data: Partial<CBTSessionData> = { thoughts: [] };
      expect(hasStepData(data, 'thoughts')).toBe(false);
    });

    test('returns true for non-empty array (thoughts)', () => {
      const data: Partial<CBTSessionData> = {
        thoughts: [{ thought: 'test thought', credibility: 5 }],
      };
      expect(hasStepData(data, 'thoughts')).toBe(true);
    });

    test('returns false for object with only empty strings', () => {
      const data: Partial<CBTSessionData> = {
        situation: { situation: '', date: '' },
      };
      expect(hasStepData(data, 'situation')).toBe(false);
    });

    test('returns true for object with meaningful data', () => {
      const data: Partial<CBTSessionData> = {
        situation: { situation: 'I felt anxious at work', date: '2026-01-21' },
      };
      expect(hasStepData(data, 'situation')).toBe(true);
    });

    test('returns true for emotions with valid data', () => {
      const data: Partial<CBTSessionData> = {
        emotions: createEmotionData({ anxiety: 7 }),
      };
      expect(hasStepData(data, 'emotions')).toBe(true);
    });

    test('returns true for coreBelief with text', () => {
      const data: Partial<CBTSessionData> = {
        coreBelief: { coreBeliefText: 'I am not good enough', coreBeliefCredibility: 8 },
      };
      expect(hasStepData(data, 'core-belief')).toBe(true);
    });

    test('returns true for coreBelief with empty text but credibility number', () => {
      const data: Partial<CBTSessionData> = {
        coreBelief: { coreBeliefText: '', coreBeliefCredibility: 5 },
      };
      // Has credibility number (truthy), so returns true
      // This tests current behavior - credibility counts as meaningful
      expect(hasStepData(data, 'core-belief')).toBe(true);
    });
  });

  describe('computeStartingStep', () => {
    test('returns situation for undefined data', () => {
      const result = computeStartingStep(undefined);
      expect(result.startStep).toBe('situation');
      expect(result.completedSteps.size).toBe(0);
    });

    test('returns situation for empty object', () => {
      const result = computeStartingStep({});
      expect(result.startStep).toBe('situation');
      expect(result.completedSteps.size).toBe(0);
    });

    test('returns emotions when only situation is filled', () => {
      const result = computeStartingStep({
        situation: { situation: 'test situation', date: '2026-01-21' },
      });
      expect(result.startStep).toBe('emotions');
      expect(result.completedSteps.has('situation')).toBe(true);
      expect(result.completedSteps.size).toBe(1);
    });

    test('returns thoughts when situation and emotions are filled', () => {
      const result = computeStartingStep({
        situation: { situation: 'test', date: '2026-01-21' },
        emotions: createEmotionData({ anxiety: 5 }),
      });
      expect(result.startStep).toBe('thoughts');
      expect(result.completedSteps.has('situation')).toBe(true);
      expect(result.completedSteps.has('emotions')).toBe(true);
      expect(result.completedSteps.size).toBe(2);
    });

    test('skips to first incomplete step in sequence', () => {
      const result = computeStartingStep({
        situation: { situation: 'test', date: '2026-01-21' },
        emotions: createEmotionData({ anxiety: 5 }),
        thoughts: [{ thought: 'negative thought', credibility: 7 }],
        coreBelief: { coreBeliefText: 'I am worthless', coreBeliefCredibility: 8 },
      });
      expect(result.startStep).toBe('challenge-questions');
      expect(result.completedSteps.size).toBe(4);
    });

    test('handles gap in data - stops at first missing step', () => {
      // Situation filled, but emotions missing (even if thoughts exist)
      const result = computeStartingStep({
        situation: { situation: 'test', date: '2026-01-21' },
        emotions: null,
        thoughts: [{ thought: 'this should be ignored', credibility: 5 }],
      });
      expect(result.startStep).toBe('emotions');
      expect(result.completedSteps.has('situation')).toBe(true);
      expect(result.completedSteps.size).toBe(1);
    });

    test('handles empty thoughts array as incomplete', () => {
      const result = computeStartingStep({
        situation: { situation: 'test', date: '2026-01-21' },
        emotions: createEmotionData({ sadness: 6 }),
        thoughts: [],
      });
      expect(result.startStep).toBe('thoughts');
      expect(result.completedSteps.size).toBe(2);
    });

    test('marks all steps complete for full session data', () => {
      const result = computeStartingStep({
        situation: { situation: 'test', date: '2026-01-21' },
        emotions: createEmotionData({ anxiety: 5 }),
        thoughts: [{ thought: 'thought', credibility: 5 }],
        coreBelief: { coreBeliefText: 'belief', coreBeliefCredibility: 5 },
        challengeQuestions: { challengeQuestions: [{ question: 'q', answer: 'a' }] },
        rationalThoughts: { rationalThoughts: [{ thought: 'rational', confidence: 5 }] },
        schemaModes: { selectedModes: [{ id: 'mode', name: 'Mode', description: '', selected: true, intensity: 5 }] },
        actionPlan: createActionPlanData({ newBehaviors: 'behaviors' }),
        finalEmotions: createEmotionData({ joy: 3 }),
      });
      // All 9 steps should be completed
      expect(result.completedSteps.size).toBe(9);
    });
  });
});
