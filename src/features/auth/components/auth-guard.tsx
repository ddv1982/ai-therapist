'use client';

import { useAuth } from '@clerk/nextjs';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Auth Guard component using Clerk
 * Middleware handles authentication, this provides a UI fallback
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
          <p className="text-muted-foreground text-sm mt-2 opacity-60">
            If this takes too long, please refresh the page
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className={therapeuticInteractive.statusIcon}>
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
