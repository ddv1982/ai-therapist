/**
 * Tracks whether the component has hydrated on the client.
 * Returns false during SSR and initial render, true after hydration.
 */

'use client';

import { useEffect, useState } from 'react';

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
