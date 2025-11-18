'use client';

import { useState, ReactNode } from 'react';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { QueryProvider } from '@/providers/query-provider';
import { SessionProvider } from '@/contexts/session-context';
import { ChatSettingsProvider } from '@/contexts/chat-settings-context';
import { CBTProvider } from '@/contexts/cbt-context';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { publicEnv } from '@/config/env.public';

interface RootProvidersProps {
  children: ReactNode;
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

  const [convexClient] = useState(() => new ConvexReactClient(convexUrl));

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <ThemeProvider>
          <QueryProvider>
            <SessionProvider>
              <ChatSettingsProvider>
                <CBTProvider>
                  <ToastProvider>
                    <Toaster />
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </ToastProvider>
                </CBTProvider>
              </ChatSettingsProvider>
            </SessionProvider>
          </QueryProvider>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
