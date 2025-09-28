'use client';

import { Brain, Sparkles, Lock } from 'lucide-react';

interface ChatEmptyStateProps {
  isMobile: boolean;
  translate: (key: string) => string;
}

export function ChatEmptyState({ isMobile, translate }: ChatEmptyStateProps) {
  return (
    <div className={`flex items-center justify-center ${isMobile ? 'py-2' : 'py-16'}`}>
      <div className={`text-center max-w-2xl animate-fade-in ${isMobile ? 'px-3' : 'px-6'}`}>
        <div className={isMobile ? 'mb-4' : 'mb-8 sm:mb-10'}>
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 shadow-md">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl mb-4 tracking-tight gradient-text">
            {translate('empty.welcome')}
          </h2>
          <p className={`text-sm sm:text-base text-muted-foreground ${isMobile ? 'mb-6' : 'mb-8'} leading-relaxed`}>
            {translate('empty.intro')}
          </p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isMobile ? 'gap-4 mb-6' : 'gap-6 mb-10'}`}>
          <div className="p-6 rounded-xl bg-card/70 border border-border text-left flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">{translate('empty.compassionTitle')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{translate('empty.compassionDesc')}</p>
            </div>
          </div>
          <div className="p-6 rounded-xl bg-card/70 border border-border text-left flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
            <Lock className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">{translate('empty.privateTitle')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{translate('empty.privateDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
