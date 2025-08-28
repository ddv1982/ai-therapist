'use client';

import React from 'react';
import { ReduxProvider } from './redux-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/layout/error-boundary';
import { NextIntlClientProvider } from 'next-intl';
import type { AbstractIntlMessages } from 'next-intl';

interface AppProviderProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function AppProvider({ children, locale, messages }: AppProviderProps) {
  return (
    <ReduxProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </ReduxProvider>
  );
}
