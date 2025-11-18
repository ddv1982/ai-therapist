'use client';

import { Brain, Sparkles, Lock } from 'lucide-react';

interface ChatEmptyStateProps {
  isMobile: boolean;
  translate: (key: string) => string;
}

export function ChatEmptyState({ isMobile, translate }: ChatEmptyStateProps) {
  return (
    <div className={`flex items-center justify-center ${isMobile ? 'py-2' : 'py-16'}`}>
      <div className={`animate-fade-in max-w-2xl text-center ${isMobile ? 'px-3' : 'px-6'}`}>
        <div className={isMobile ? 'mb-4' : 'mb-8 sm:mb-10'}>
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-md">
            <Brain className="text-primary h-8 w-8" />
          </div>
          <h2 className="gradient-text mb-4 text-3xl tracking-tight">
            {translate('empty.welcome')}
          </h2>
          <p
            className={`text-muted-foreground text-sm sm:text-base ${isMobile ? 'mb-6' : 'mb-8'} leading-relaxed`}
          >
            {translate('empty.intro')}
          </p>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${isMobile ? 'mb-6 gap-4' : 'mb-10 gap-6'}`}
        >
          <div className="bg-card/70 border-border flex items-start gap-3 rounded-xl border p-6 text-left shadow-sm transition-shadow hover:shadow-md">
            <Sparkles className="text-primary mt-1 h-4 w-4 flex-shrink-0" />
            <div>
              <h3 className="text-foreground mb-1 text-base font-semibold">
                {translate('empty.compassionTitle')}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {translate('empty.compassionDesc')}
              </p>
            </div>
          </div>
          <div className="bg-card/70 border-border flex items-start gap-3 rounded-xl border p-6 text-left shadow-sm transition-shadow hover:shadow-md">
            <Lock className="text-accent mt-1 h-4 w-4 flex-shrink-0" />
            <div>
              <h3 className="text-foreground mb-1 text-base font-semibold">
                {translate('empty.privateTitle')}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {translate('empty.privateDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
