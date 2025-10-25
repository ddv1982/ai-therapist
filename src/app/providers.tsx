"use client";

import React from 'react';
import { ReduxProvider } from '@/providers/redux-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { publicEnv } from '@/config/env.public';

interface RootProvidersProps {
  children: React.ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  const convexUrl = publicEnv.NEXT_PUBLIC_CONVEX_URL;
  const [client] = React.useState(() => (convexUrl ? new ConvexReactClient(convexUrl) : null));
  return (
    <ReduxProvider>
      <ThemeProvider>
        <ToastProvider>
          <ErrorBoundary>
            {client ? (
              <ConvexProvider client={client}>{children}</ConvexProvider>
            ) : (
              children
            )}
          </ErrorBoundary>
        </ToastProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}

