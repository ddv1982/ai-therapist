/**
 * Unit Tests for Simplified CBT Hooks
 *
 * Much simpler than testing the 693-line CBT data manager!
 */

import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCBTData, useCBTEmotions, useCBTThoughts, useCBTSession } from '../use-cbt';
import cbtSessionSlice from '@/store/slices/cbt-session.slice';

// Mock Redux store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cbtSession: cbtSessionSlice
    },
    preloadedState: {
      cbtSession: {
        sessionId: null,
        currentStep: 'situation',
        isSubmitting: false,
        situation: null,
        emotions: { fear: 0, anger: 0, sadness: 0, joy: 0, anxiety: 0, shame: 0, guilt: 0 },
        thoughts: [],
        coreBeliefs: [],
        challengeQuestions: [],
        rationalThoughts: [],
        schemaModes: [],
        actionPlan: null,
        startedAt: null,
        lastModified: null,
        ...initialState
      }
    }
  });
};

const wrapper = ({ children, store }: { children: React.ReactNode; store: ReturnType<typeof configureStore> }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useCBTData', () => {
  it('should return session data and actions', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCBTData(), {
      wrapper: ({ children }) => wrapper({ children, store })
    });

    expect(result.current.sessionData).toBeDefined();
    expect(result.current.hasData).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(typeof result.current.updateSituation).toBe('function');
    expect(typeof result.current.updateEmotions).toBe('function');
  });

  it('should detect when data is present', () => {
    const store = createMockStore({
      situation: { situation: 'Test situation', date: '2024-01-01' },
      emotions: { fear: 5, anger: 0, sadness: 0, joy: 0, anxiety: 0, shame: 0, guilt: 0 }
    });

    const { result } = renderHook(() => useCBTData(), {
      wrapper: ({ children }) => wrapper({ children, store })
    });

    expect(result.current.hasData).toBe(true);
    expect(result.current.isComplete).toBe(false);
  });
});

describe('useCBTEmotions', () => {
  it('should return emotions data and actions', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCBTEmotions(), {
      wrapper: ({ children }) => wrapper({ children, store })
    });

    expect(result.current.emotions).toEqual({
      fear: 0, anger: 0, sadness: 0, joy: 0, anxiety: 0, shame: 0, guilt: 0
    });
    expect(result.current.hasEmotions).toBe(false);
    expect(typeof result.current.updateEmotions).toBe('function');
  });

  it('should detect when emotions are present', () => {
    const store = createMockStore({
      emotions: { fear: 7, anger: 0, sadness: 0, joy: 0, anxiety: 0, shame: 0, guilt: 0 }
    });

    const { result } = renderHook(() => useCBTEmotions(), {
      wrapper: ({ children }) => wrapper({ children, store })
    });

    expect(result.current.hasEmotions).toBe(true);
  });
});

describe('useCBTThoughts', () => {
  it('should return thoughts data and actions', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCBTThoughts(), {
      wrapper: ({ children }) => wrapper({ children, store })
    });

    expect(result.current.thoughts).toEqual([]);
    expect(result.current.hasThoughts).toBe(false);
    expect(typeof result.current.updateThoughts).toBe('function');
  });

  it('should detect when thoughts are present', () => {
    const store = createMockStore({
      thoughts: [{ thought: 'Test thought', credibility: 5 }]
    });

    const { result } = renderHook(() => useCBTThoughts(), {
      wrapper: ({ children }) => wrapper({ children, store })
    });

    expect(result.current.hasThoughts).toBe(true);
    expect(result.current.thoughts).toHaveLength(1);
  });
});

describe('useCBTSession', () => {
  it('should return session metadata', () => {
    const store = createMockStore({
      sessionId: 'test-session',
      currentStep: 'emotions',
      isSubmitting: true
    });

    const { result } = renderHook(() => useCBTSession(), {
      wrapper: ({ children }) => wrapper({ children, store })
    });

    expect(result.current.sessionId).toBe('test-session');
    expect(result.current.currentStep).toBe('emotions');
    expect(result.current.isSubmitting).toBe(true);
  });
});
