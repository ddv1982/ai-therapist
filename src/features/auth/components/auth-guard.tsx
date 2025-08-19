'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/use-auth';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';
import { logger } from '@/lib/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, needsSetup, needsVerification, isLoading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout for loading state to prevent endless hanging
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        logger.warn('Auth loading timed out, redirecting to setup', {
          component: 'AuthGuard',
          operation: 'loadingTimeout',
          timeout: 10000
        });
        setLoadingTimeout(true);
      }, 15000); // 15 second timeout for loading

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
      return undefined;
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading && !loadingTimeout) return;

    if (needsSetup || loadingTimeout) {
      window.location.href = '/auth/setup';
      return;
    }

    if (needsVerification) {
      window.location.href = '/auth/verify';
      return;
    }
  }, [isAuthenticated, needsSetup, needsVerification, isLoading, loadingTimeout]);

  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
          {/* Show timeout warning after 10 seconds */}
          <p className="text-muted-foreground text-sm mt-2 opacity-60">
            If this takes too long, you&apos;ll be redirected automatically
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className={therapeuticInteractive.statusIconContainer}>
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Redirecting to authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}