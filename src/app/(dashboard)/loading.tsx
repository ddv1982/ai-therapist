import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading UI for dashboard routes
 * Shows immediately while navigating between dashboard pages
 */
export default function DashboardLoading() {
  return (
    <div className="bg-background flex h-screen flex-col p-6">
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="mt-8 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
