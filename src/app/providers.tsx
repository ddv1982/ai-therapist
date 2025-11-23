'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/providers/query-provider';
import { SessionProvider } from '@/contexts/session-context';
import { ChatSettingsProvider } from '@/contexts/chat-settings-context';
import { CBTProvider } from '@/contexts/cbt-context';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { publicEnv } from '@/config/env.public';
import { WebVitalsReporter } from '@/components/monitoring/web-vitals-reporter';

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  const clerkPublishableKey = publicEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured');
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ThemeProvider>
        <QueryProvider>
          <SessionProvider>
            <ChatSettingsProvider>
              <CBTProvider>
                <ToastProvider>
                  <Toaster />
                  <WebVitalsReporter />
                  <ErrorBoundary>{children}</ErrorBoundary>
                </ToastProvider>
              </CBTProvider>
            </ChatSettingsProvider>
          </SessionProvider>
        </QueryProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
