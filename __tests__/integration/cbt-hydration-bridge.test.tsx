import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import { applyCBTEvent, clearCBTSession, startCBTSession } from '@/store/slices/cbt-slice';

describe('CBT Redux-only persistence', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {}
    // Reset the Redux store
    store.dispatch(clearCBTSession());
  });

  it('migrates localStorage draft to Redux once', async () => {
    const draft = {
      date: '2025-01-01',
      situation: 'Migration test',
      initialEmotions: {
        fear: 1,
        anger: 2,
        sadness: 3,
        joy: 4,
        anxiety: 5,
        shame: 6,
        guilt: 7,
        other: '',
        otherIntensity: 0,
      },
      finalEmotions: {
        fear: 1,
        anger: 2,
        sadness: 3,
        joy: 4,
        anxiety: 5,
        shame: 6,
        guilt: 7,
        other: '',
        otherIntensity: 0,
      },
      automaticThoughts: [{ thought: 'x', credibility: 5 }],
      coreBeliefText: '',
      coreBeliefCredibility: 5,
      challengeQuestions: [],
      rationalThoughts: [],
      schemaModes: [],
      newBehaviors: '',
      alternativeResponses: [{ response: '' }],
      originalThoughtCredibility: 5,
    };

    // Set up localStorage with existing draft
    try {
      localStorage.setItem('cbt-draft', JSON.stringify(draft));
    } catch {}

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useCBTDataManager(), { wrapper });
    void result.current;

    await waitFor(
      () => {
        const flow = store.getState().cbt.flow;
        expect(flow.context.situation?.situation).toBe('Migration test');
        expect(flow.context.emotions?.fear).toBe(1);
      },
      { timeout: 2000 }
    );

    expect(localStorage.getItem('cbt-draft')).toBeNull();
    expect(localStorage.getItem('cbt-migration-completed')).toBe('true');
  });

  it('does not migrate if Redux already has data', async () => {
    const draft = {
      date: '2025-01-01',
      situation: 'Should not migrate',
      initialEmotions: {
        fear: 1,
        anger: 2,
        sadness: 3,
        joy: 4,
        anxiety: 5,
        shame: 6,
        guilt: 7,
        other: '',
        otherIntensity: 0,
      },
    };

    // Set up localStorage with existing draft
    try {
      localStorage.setItem('cbt-draft', JSON.stringify(draft));
    } catch {}

    // Pre-populate Redux with data
    store.dispatch(startCBTSession({ sessionId: 'existing-session' }));
    store.dispatch(
      applyCBTEvent({
        type: 'UPDATE_STEP',
        stepId: 'situation',
        payload: { situation: 'Existing Redux data', date: '2025-01-01' },
      })
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useCBTDataManager(), { wrapper });
    void result.current;

    await waitFor(
      () => {
        const flow = store.getState().cbt.flow;
        expect(flow.context.situation?.situation).toBe('Existing Redux data');
      },
      { timeout: 2000 }
    );

    expect(localStorage.getItem('cbt-draft')).toBe(JSON.stringify(draft));
  });
});
