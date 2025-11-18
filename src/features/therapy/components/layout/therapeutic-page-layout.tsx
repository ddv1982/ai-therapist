'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TherapeuticLayout, TherapeuticLayoutProps } from '@/components/ui/therapeutic-layout';

interface TherapeuticPageLayoutProps extends Omit<TherapeuticLayoutProps, 'layout' | 'variant'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}

/**
 * Specialized layout for therapeutic pages.
 * Enforces consistent max-width, centering, and typography.
 */
export function TherapeuticPageLayout({
  title,
  subtitle,
  children,
  className,
  ...props
}: TherapeuticPageLayoutProps) {
  return (
    <TherapeuticLayout
      layout="therapeutic"
      variant="therapeutic"
      typography="therapeutic"
      background="therapeutic"
      padding="therapeutic"
      maxWidth="4xl"
      centerContent={true}
      responsive={true}
      className={cn('min-h-[calc(100vh-4rem)]', className)}
      {...props}
    >
      {title && (
        <header className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-primary mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
              {subtitle}
            </p>
          )}
        </header>
      )}
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        {children}
      </div>
    </TherapeuticLayout>
  );
}
