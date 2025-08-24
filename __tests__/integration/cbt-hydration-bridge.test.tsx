import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';

describe('CBT hydration bridge', () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch {}
  });

  it('hydrates Redux state from RHF draft once', () => {
    const draft = {
      date: '2025-01-01',
      situation: 'Hydration test',
      initialEmotions: {
        fear: 1, anger: 2, sadness: 3, joy: 4, anxiety: 5, shame: 6, guilt: 7, other: '', otherIntensity: 0
      },
      finalEmotions: {
        fear: 1, anger: 2, sadness: 3, joy: 4, anxiety: 5, shame: 6, guilt: 7, other: '', otherIntensity: 0
      },
      automaticThoughts: [{ thought: 'x', credibility: 5 }],
      coreBeliefText: '',
      coreBeliefCredibility: 5,
      challengeQuestions: [],
      rationalThoughts: [],
      schemaModes: [],
      newBehaviors: '',
      alternativeResponses: [{ response: '' }],
      originalThoughtCredibility: 5
    };
    try { localStorage.setItem('cbt-draft', JSON.stringify(draft)); } catch {}

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useCBTDataManager(), { wrapper });
    // Trigger effects
    void result.current;

    // Check that situation was hydrated
    const state = store.getState().cbt.sessionData;
    expect(state.situation?.situation).toBe('Hydration test');
    expect(state.emotions?.fear).toBe(1);
  });
});


