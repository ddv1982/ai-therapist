'use client';

import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentSession as setCurrentSessionAction } from '@/store/slices/sessions-slice';
import { useSetCurrentSessionMutation } from '@/store/slices/sessions-api';

/**
 * Unified session selection logic used across sidebar, command palette, etc.
 * Dispatches Redux state and syncs with the server authority.
 */
export function useSelectSession() {
  const dispatch = useAppDispatch();
  const [setCurrentOnServer] = useSetCurrentSessionMutation();

  const selectSession = useCallback(
    async (sessionId: string | null) => {
      dispatch(setCurrentSessionAction(sessionId));
      if (sessionId) {
        try {
          await setCurrentOnServer(sessionId).unwrap();
        } catch {}
      }
    },
    [dispatch, setCurrentOnServer]
  );

  return { selectSession };
}
