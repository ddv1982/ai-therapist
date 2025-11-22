'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      theme="system"
      position="top-center"
      toastOptions={{
        style: {
          // Apple-style toast with glassmorphism
          background: 'var(--glass-white)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-apple-lg)',
          color: 'var(--foreground)',
          padding: '16px',
        },
        className: 'animate-slide-down',
      }}
      gap={8}
    />
  );
}
