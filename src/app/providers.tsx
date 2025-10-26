"use client";

import React from 'react';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { ReduxProvider } from '@/providers/redux-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { publicEnv } from '@/config/env.public';

interface RootProvidersProps {
  children: React.ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  const convexUrl = publicEnv.NEXT_PUBLIC_CONVEX_URL;
  const clerkPublishableKey = publicEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured');
  }

  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }

  const [convexClient] = React.useState(() => new ConvexReactClient(convexUrl));

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <ThemeProvider>
          <ReduxProvider>
            <ToastProvider>
              <Toaster />
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </ToastProvider>
          </ReduxProvider>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

