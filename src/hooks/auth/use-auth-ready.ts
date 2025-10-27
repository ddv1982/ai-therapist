"use client";

import { useAuth } from '@clerk/nextjs';

/**
 * Indicates when Clerk auth is fully loaded and a user is present.
 * Use to gate initial API hydration that requires authenticated cookies.
 */
export function useAuthReady(): boolean {
  const { isLoaded, userId } = useAuth();
  return Boolean(isLoaded && userId);
}
