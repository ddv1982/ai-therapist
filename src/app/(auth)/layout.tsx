/**
 * Authentication Layout
 * Layout for authentication pages (setup, verify)
 */
import React from 'react';
import { LanguageToggle } from '@/components/ui/language-switcher';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}