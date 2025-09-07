import React from 'react';
import { ThemeProvider } from '@/components/providers/theme-provider';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <main>{children}</main>
      </div>
    </ThemeProvider>
  );
}