import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading UI for CBT diary page
 * Shows skeleton layout while diary data is being loaded
 */
export default function CBTDiaryLoading() {
  return (
    <div className="bg-background min-h-screen p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Diary entries skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card space-y-4 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
