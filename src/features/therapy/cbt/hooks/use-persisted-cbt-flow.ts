'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCBTFlow, type CBTSessionData } from './use-cbt-flow';
import type { CBTStepId } from '../flow/types';
import { logger } from '@/lib/utils/logger';
import {
  ClientCryptoError,
  decryptClientData,
  encryptClientData,
} from '@/lib/encryption/client-crypto';

const STORAGE_KEY = 'cbt-flow-draft';
const EMPTY_TIMESTAMP = new Date(0).toISOString();
const STORAGE_VERSION = 1;

interface EncryptedDraftPayload {
  version: number;
  encrypted: true;
  payload: string;
  lastModified: string;
}

/**
 * Check if there's a persisted draft in localStorage.
 * Can be called outside of React components for initial checks.
 */
export function hasPersistedDraft(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored) as Partial<CBTSessionData> | EncryptedDraftPayload;
    if ('encrypted' in data && data.encrypted) {
      return Boolean(data.payload);
    }
    const legacy = data as Partial<CBTSessionData>;
    // Check if there's any meaningful data
    return !!(
      legacy.situation ||
      legacy.emotions ||
      (legacy.thoughts && legacy.thoughts.length > 0) ||
      legacy.coreBelief ||
      legacy.challengeQuestions ||
      legacy.rationalThoughts ||
      legacy.schemaModes ||
      legacy.actionPlan ||
      legacy.finalEmotions
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
    const data = JSON.parse(stored) as Partial<CBTSessionData> | EncryptedDraftPayload;
    if ('encrypted' in data && data.encrypted) {
      return data.lastModified || null;
    }
    const legacy = data as Partial<CBTSessionData>;
    return legacy.lastModified && legacy.lastModified !== EMPTY_TIMESTAMP
      ? legacy.lastModified
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
async function loadPersistedData(): Promise<
  | {
      data?: Partial<CBTSessionData>;
      needsMigration?: boolean;
      error?: ClientCryptoError;
    }
  | undefined
> {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return undefined;

    const parsed = JSON.parse(stored) as Partial<CBTSessionData> | EncryptedDraftPayload;

    if ('encrypted' in parsed && parsed.encrypted) {
      const decrypted = await decryptClientData(parsed.payload);
      const data = JSON.parse(decrypted) as Partial<CBTSessionData>;
      return { data, needsMigration: false };
    }

    return { data: parsed as Partial<CBTSessionData>, needsMigration: true };
  } catch (err) {
    const error =
      err instanceof ClientCryptoError
        ? err
        : new ClientCryptoError('Failed to decrypt stored draft', err as Error);
    return { error };
  }
}

/**
 * Save session data to localStorage.
 */
async function savePersistedData(data: CBTSessionData): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const payload = await encryptClientData(JSON.stringify(data));
    const envelope: EncryptedDraftPayload = {
      version: STORAGE_VERSION,
      encrypted: true,
      payload,
      lastModified: data.lastModified,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
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
  const [initialData, setInitialData] = useState<Partial<CBTSessionData> | undefined>(undefined);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [migrationPending, setMigrationPending] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const flow = useCBTFlow({
    initialData,
    onChange,
  });

  useEffect(() => {
    if (skipHydration) {
      setIsHydrated(true);
      return;
    }

    let isMounted = true;
    const hydrate = async () => {
      try {
        const result = await loadPersistedData();
        if (!isMounted) return;

        if (result?.error) {
          const message = result.error.message;
          setHydrationError(message);
          logger.error('Failed to decrypt persisted CBT draft', {
            component: 'usePersistedCBTFlow',
            error: result.error.message,
          });
          return;
        }

        if (result?.data) {
          setInitialData(result.data);
          setMigrationPending(Boolean(result.needsMigration));
        }
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof ClientCryptoError
            ? err.message
            : 'Unable to load your saved draft. You can clear and restart.';
        setHydrationError(message);
        logger.error('Failed to hydrate persisted CBT draft', {
          component: 'usePersistedCBTFlow',
          error: err instanceof Error ? err.message : 'unknown',
        });
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    };

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, [skipHydration]);

  // Auto-persist on session data changes
  const prevLastModifiedRef = useRef<string>(flow.sessionData.lastModified);
  useEffect(() => {
    // Skip if not hydrated yet or if lastModified hasn't changed
    if (!isHydrated) return;
    if (flow.sessionData.lastModified === prevLastModifiedRef.current) return;
    if (flow.sessionData.lastModified === EMPTY_TIMESTAMP) return;

    prevLastModifiedRef.current = flow.sessionData.lastModified;
    void savePersistedData(flow.sessionData);
  }, [flow.sessionData, isHydrated]);

  useEffect(() => {
    if (!migrationPending) return;
    if (!isHydrated) return;
    if (flow.sessionData.lastModified === EMPTY_TIMESTAMP) return;

    setMigrationPending(false);
    void savePersistedData(flow.sessionData);
  }, [migrationPending, isHydrated, flow.sessionData]);

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
    setHydrationError(null);
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
    hydrationError,
  };
}

export type UsePersistedCBTFlowReturn = ReturnType<typeof usePersistedCBTFlow>;
