import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Loading UI for reports page
 * Shows skeleton layout while reports data is being fetched
 */
export default function ReportsLoading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-7 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Main card skeleton */}
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className="mx-auto mb-2 h-6 w-48" />
            <Skeleton className="mx-auto h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Skeleton className="mx-auto h-4 w-56" />
            <div className="mx-auto max-w-md space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="pt-4">
              <Skeleton className="mx-auto h-10 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
