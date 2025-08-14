/**
 * Dashboard Layout
 * Layout for main application pages (home, chat, reports, test)
 */
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="h-screen">
        {children}
      </main>
    </div>
  );
}