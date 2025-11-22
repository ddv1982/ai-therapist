'use client';

import { useMemo } from 'react';
import { getMoonPhase, type MoonPhaseName } from '@/lib/astronomy/moon';
import { RealisticMoon } from './realistic-moon';

interface ChatEmptyStateProps {
  isMobile: boolean;
  translate: (key: string) => string;
}

export function ChatEmptyState({ isMobile, translate }: ChatEmptyStateProps) {
  // Calculate moon phase once on mount
  const moonPhase = useMemo(() => getMoonPhase(new Date()), []);

  const getPhaseTranslation = (name: MoonPhaseName) => {
    const keyMap: Record<MoonPhaseName, string> = {
      'New Moon': 'moon.phase.new',
      'Waxing Crescent': 'moon.phase.waxing_crescent',
      'First Quarter': 'moon.phase.first_quarter',
      'Waxing Gibbous': 'moon.phase.waxing_gibbous',
      'Full Moon': 'moon.phase.full',
      'Waning Gibbous': 'moon.phase.waning_gibbous',
      'Last Quarter': 'moon.phase.last_quarter',
      'Waning Crescent': 'moon.phase.waning_crescent',
    };
    return translate(keyMap[name] || 'moon.phase.new');
  };

  const getPhaseQuote = (name: MoonPhaseName) => {
    const quoteKeyMap: Record<MoonPhaseName, string> = {
      'New Moon': 'moon.quote.new',
      'Waxing Crescent': 'moon.quote.waxing_crescent',
      'First Quarter': 'moon.quote.first_quarter',
      'Waxing Gibbous': 'moon.quote.waxing_gibbous',
      'Full Moon': 'moon.quote.full',
      'Waning Gibbous': 'moon.quote.waning_gibbous',
      'Last Quarter': 'moon.quote.last_quarter',
      'Waning Crescent': 'moon.quote.waning_crescent',
    };
    return translate(quoteKeyMap[name] || 'moon.quote.new');
  };

  return (
    <div className={`flex items-center justify-center ${isMobile ? 'py-8' : 'py-16'}`}>
      {/* Apple-style frosted glass card */}
      <div className={`animate-fade-in max-w-xl text-center ${isMobile ? 'px-6 py-8' : 'px-12 py-12'} bg-[var(--glass-white)] backdrop-blur-glass backdrop-saturate-glass border border-[var(--glass-border)] rounded-2xl shadow-apple-xl transition-all duration-base ease-out-smooth hover:shadow-apple-xl hover:-translate-y-0.5`}>
        {/* Realistic Moon Illustration */}
        <div className={`${isMobile ? 'mb-6' : 'mb-8'} flex flex-col items-center justify-center`}>
          <RealisticMoon 
            phase={moonPhase} 
            size={isMobile ? 180 : 240} 
            className="mb-4"
          />
          
          {/* Phase Label */}
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground/70">
            {getPhaseTranslation(moonPhase.name)} • {moonPhase.illumination}% {translate('moon.illumination')}
          </span>
          
          {/* Spiritual Quote */}
          <p className="mt-6 max-w-lg animate-fade-in px-6 text-center text-base font-light italic leading-relaxed text-primary/80 dark:text-primary/70 animation-delay-300">
            "{getPhaseQuote(moonPhase.name)}"
          </p>
        </div>

        {/* Welcome text */}
        <h2 className="gradient-text mt-8 text-3xl tracking-tight">
          {translate('empty.welcome')}
        </h2>
      </div>
    </div>
  );
}
