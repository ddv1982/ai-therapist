/**
 * Loading UI for dashboard routes
 * Shows immediately while navigating between dashboard pages
 */

export default function DashboardLoading() {
  return (
    <div className="bg-background flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
