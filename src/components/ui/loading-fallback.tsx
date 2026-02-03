/**
 * Loading Fallback Components
 *
 * Provides loading states for dynamically imported components.
 * Used with Next.js dynamic imports for better UX during code splitting.
 */

'use client';

import { Skeleton } from './skeleton';

/**
 * Modal loading skeleton
 */
export function ModalSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="space-y-2 pt-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
