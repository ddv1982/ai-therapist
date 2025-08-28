import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';

describe('CBT Redux-only persistence', () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch {}
    // Reset the Redux store
    store.dispatch({ type: 'cbt/clearCBTSession' });
  });

  it('migrates localStorage draft to Redux once', () => {
    const draft = {
      date: '2025-01-01',
      situation: 'Migration test',
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

    // Set up localStorage with existing draft
    try { localStorage.setItem('cbt-draft', JSON.stringify(draft)); } catch {}

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useCBTDataManager(), { wrapper });
    // Trigger effects
    void result.current;

    // Wait a bit for the migration effect to run
    return new Promise(resolve => {
      setTimeout(() => {
        // Check that situation was migrated
        const state = store.getState().cbt.sessionData;
        expect(state.situation?.situation).toBe('Migration test');
        expect(state.emotions?.fear).toBe(1);

        // Check that localStorage was cleaned up
        expect(localStorage.getItem('cbt-draft')).toBeNull();
        expect(localStorage.getItem('cbt-migration-completed')).toBe('true');

        resolve(void 0);
      }, 100);
    });
  });

  it('does not migrate if Redux already has data', () => {
    const draft = {
      date: '2025-01-01',
      situation: 'Should not migrate',
      initialEmotions: {
        fear: 1, anger: 2, sadness: 3, joy: 4, anxiety: 5, shame: 6, guilt: 7, other: '', otherIntensity: 0
      }
    };

    // Set up localStorage with existing draft
    try { localStorage.setItem('cbt-draft', JSON.stringify(draft)); } catch {}

    // Pre-populate Redux with data
    store.dispatch({
      type: 'cbt/updateSituation',
      payload: { situation: 'Existing Redux data', date: '2025-01-01' }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useCBTDataManager(), { wrapper });
    // Trigger effects
    void result.current;

    // Wait a bit for the migration effect to run
    return new Promise(resolve => {
      setTimeout(() => {
        // Check that existing Redux data was preserved
        const state = store.getState().cbt.sessionData;
        expect(state.situation?.situation).toBe('Existing Redux data');

        // Check that localStorage draft was not cleaned up (migration didn't run)
        expect(localStorage.getItem('cbt-draft')).toBe(JSON.stringify(draft));

        resolve(void 0);
      }, 100);
    });
  });
});
