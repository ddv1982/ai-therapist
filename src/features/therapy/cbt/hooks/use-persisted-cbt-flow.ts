'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCBTFlow, type CBTSessionData } from './use-cbt-flow';
import type { CBTStepId } from '../flow/types';
import { logger } from '@/lib/utils/logger';

const STORAGE_KEY = 'cbt-flow-draft';
const EMPTY_TIMESTAMP = new Date(0).toISOString();

/**
 * Check if there's a persisted draft in localStorage.
 * Can be called outside of React components for initial checks.
 */
export function hasPersistedDraft(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored) as Partial<CBTSessionData>;
    // Check if there's any meaningful data
    return !!(
      data.situation ||
      data.emotions ||
      (data.thoughts && data.thoughts.length > 0) ||
      data.coreBelief ||
      data.challengeQuestions ||
      data.rationalThoughts ||
      data.schemaModes ||
      data.actionPlan ||
      data.finalEmotions
    );
  } catch {
    return false;
  }
}

/**
 * Get the last saved timestamp from persisted draft.
 */
export function getPersistedDraftTimestamp(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored) as Partial<CBTSessionData>;
    return data.lastModified && data.lastModified !== EMPTY_TIMESTAMP
      ? data.lastModified
      : null;
  } catch {
    return null;
  }
}

/**
 * Clear the persisted draft from localStorage.
 */
export function clearPersistedDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logger.warn('Failed to clear persisted draft', {
      component: 'usePersistedCBTFlow',
      error: err instanceof Error ? err.name : 'unknown',
    });
  }
}

/**
 * Load persisted draft data from localStorage.
 */
function loadPersistedData(): Partial<CBTSessionData> | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return undefined;
    return JSON.parse(stored) as Partial<CBTSessionData>;
  } catch {
    return undefined;
  }
}

/**
 * Save session data to localStorage.
 */
function savePersistedData(data: CBTSessionData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    logger.warn('Failed to save persisted draft', {
      component: 'usePersistedCBTFlow',
      error: err instanceof Error ? err.name : 'unknown',
    });
  }
}

interface UsePersistedCBTFlowOptions {
  /** Skip loading from localStorage (for "Start Fresh" scenario) */
  skipHydration?: boolean;
  /** Called when session data changes */
  onChange?: (data: CBTSessionData) => Promise<void> | void;
}

/**
 * A persisted version of useCBTFlow that automatically saves/loads from localStorage.
 * This provides a single source of truth for CBT draft state.
 */
export function usePersistedCBTFlow(options: UsePersistedCBTFlowOptions = {}) {
  const { skipHydration = false, onChange } = options;

  // Track if we've done initial hydration
  const hasHydratedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load initial data from localStorage (unless skipped)
  const getInitialData = useCallback((): Partial<CBTSessionData> | undefined => {
    if (skipHydration) return undefined;
    return loadPersistedData();
  }, [skipHydration]);

  // Initialize the flow with persisted data
  const flow = useCBTFlow({
    initialData: hasHydratedRef.current ? undefined : getInitialData(),
    onChange,
  });

  // Mark as hydrated after first render
  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      setIsHydrated(true);
    }
  }, []);

  // Auto-persist on session data changes
  const prevLastModifiedRef = useRef<string>(flow.sessionData.lastModified);
  useEffect(() => {
    // Skip if not hydrated yet or if lastModified hasn't changed
    if (!isHydrated) return;
    if (flow.sessionData.lastModified === prevLastModifiedRef.current) return;
    if (flow.sessionData.lastModified === EMPTY_TIMESTAMP) return;

    prevLastModifiedRef.current = flow.sessionData.lastModified;
    savePersistedData(flow.sessionData);
  }, [flow.sessionData, isHydrated]);

  // Clear draft when flow is completed
  useEffect(() => {
    if (flow.currentStep === 'complete') {
      clearPersistedDraft();
    }
  }, [flow.currentStep]);

  // Enhanced reset that also clears localStorage
  const reset = useCallback(() => {
    clearPersistedDraft();
    flow.reset();
  }, [flow]);

  // Enhanced goToStep for navigation
  const goToStep = useCallback(
    (step: CBTStepId | 'complete') => {
      flow.goToStep(step);
    },
    [flow]
  );

  return {
    ...flow,
    reset,
    goToStep,
    isHydrated,
  };
}

export type UsePersistedCBTFlowReturn = ReturnType<typeof usePersistedCBTFlow>;
