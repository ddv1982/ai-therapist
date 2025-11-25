'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for dashboard routes
 * Catches errors in dashboard pages and provides recovery option
 */
export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for debugging - errors are also sent to error tracking service
    // eslint-disable-next-line no-console
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <AlertTriangle className="text-destructive h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {error.digest && (
            <p className="text-muted-foreground text-xs">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline">
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
