/**
 * Dashboard Layout
 * Layout for main application pages (home, chat, reports, test)
 */
import React from 'react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ErrorBoundary } from '@/components/layout/error-boundary';
import { ToastProvider } from '@/components/ui/toast';
import { ReduxProvider } from '@/providers/redux-provider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ReduxProvider>
      <ThemeProvider>
        <ToastProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-background">
              <main className="h-screen">
                {children}
              </main>
            </div>
          </ErrorBoundary>
        </ToastProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}