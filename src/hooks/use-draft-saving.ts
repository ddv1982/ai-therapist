import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

export interface UseDraftSavingOptions<T> {
  /**
   * Callback to save the draft value
   * Can be sync or async
   */
  onSave: (value: T) => Promise<void> | void;

  /**
   * Debounce delay in milliseconds
   * @default 500
   */
  debounceMs?: number;

  /**
   * Whether to enable draft saving
   * Useful for conditional saving
   * @default true
   */
  enabled?: boolean;
}

export interface UseDraftSavingReturn<T> {
  /**
   * Save a draft value (debounced)
   */
  saveDraft: (value: T) => void;

  /**
   * Whether a save is currently in progress
   */
  isSaving: boolean;

  /**
   * Timestamp of the last successful save
   */
  lastSaved: Date | null;

  /**
   * Whether the draft has been saved (not currently saving)
   */
  isSaved: boolean;

  /**
   * Cancel any pending save
   */
  cancelPending: () => void;

  /**
   * Immediately save without debouncing
   */
  saveImmediately: (value: T) => Promise<void>;
}

/**
 * Reusable hook for debounced draft saving
 *
 * @example
 * ```tsx
 * const { saveDraft, isSaving, isSaved } = useDraftSaving({
 *   onSave: async (value) => {
 *     await api.saveDraft(value);
 *   },
 *   debounceMs: 600,
 * });
 *
 * // In onChange
 * const handleChange = (value: string) => {
 *   setValue(value);
 *   saveDraft(value);
 * };
 *
 * // Show indicator
 * {isSaving && <Spinner />}
 * {isSaved && <CheckIcon />}
 * ```
 */
export function useDraftSaving<T = unknown>(
  options: UseDraftSavingOptions<T>
): UseDraftSavingReturn<T> {
  const { onSave, debounceMs = 500, enabled = true } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);

  // Keep onSave reference fresh
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Cancel any pending save
  const cancelPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Save immediately without debouncing
  const saveImmediately = useCallback(
    async (value: T) => {
      if (!enabled) return;

      cancelPending();
      setIsSaving(true);

      try {
        await onSaveRef.current(value);
        setLastSaved(new Date());
      } catch (error) {
        logger.error('Draft save failed', {
          hook: 'useDraftSaving',
          operation: 'saveNow',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [enabled, cancelPending]
  );

  // Save with debouncing
  const saveDraft = useCallback(
    (value: T) => {
      if (!enabled || debounceMs <= 0) return;

      // Cancel any existing timeout
      cancelPending();

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        setIsSaving(true);

        try {
          await onSaveRef.current(value);
          setLastSaved(new Date());
        } catch (error) {
          logger.error('Draft save failed', {
            hook: 'useDraftSaving',
            operation: 'saveDraft',
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          setIsSaving(false);
        }
      }, debounceMs);
    },
    [enabled, debounceMs, cancelPending]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPending();
    };
  }, [cancelPending]);

  const isSaved = lastSaved !== null && !isSaving;

  return {
    saveDraft,
    isSaving,
    lastSaved,
    isSaved,
    cancelPending,
    saveImmediately,
  };
}
