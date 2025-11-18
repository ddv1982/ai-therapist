'use client';

import { useSession } from '@/contexts/session-context';

/**
 * Unified session selection logic used across sidebar, command palette, etc.
 * Updates local state and syncs with the server authority.
 */
export function useSelectSession() {
  const { selectSession } = useSession();

  return { selectSession };
}
