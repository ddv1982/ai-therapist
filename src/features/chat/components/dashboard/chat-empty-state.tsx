'use client';

import { useState, useEffect, useMemo } from 'react';
import { getMoonPhase, type MoonPhaseName } from '@/lib/astronomy/moon';
import { RealisticMoon } from './realistic-moon';

interface ChatEmptyStateProps {
  isMobile: boolean;
  translate: (key: string) => string;
}

export function ChatEmptyState({ isMobile, translate }: ChatEmptyStateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Prevent hydration mismatch by only rendering moon after client mount
  if (!mounted) {
    return (
      <div className={`flex items-center justify-center ${isMobile ? 'py-8' : 'py-16'}`}>
        <div
          className={`max-w-xl text-center ${isMobile ? 'px-6 py-8' : 'px-12 py-12'} backdrop-blur-glass backdrop-saturate-glass shadow-apple-xl rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-white)]`}
        >
          <div
            className={`${isMobile ? 'mb-6' : 'mb-8'} flex flex-col items-center justify-center`}
          >
            {/* Placeholder during SSR */}
            <div className={`${isMobile ? 'h-[180px] w-[180px]' : 'h-[240px] w-[240px]'} mb-4`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${isMobile ? 'py-8' : 'py-16'}`}>
      {/* Apple-style frosted glass card */}
      <div
        className={`animate-fade-in max-w-xl text-center ${isMobile ? 'px-6 py-8' : 'px-12 py-12'} backdrop-blur-glass backdrop-saturate-glass shadow-apple-xl duration-base ease-out-smooth hover:shadow-apple-xl rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-white)] transition-all hover:-translate-y-0.5`}
      >
        {/* Realistic Moon Illustration */}
        <div className={`${isMobile ? 'mb-6' : 'mb-8'} flex flex-col items-center justify-center`}>
          <RealisticMoon phase={moonPhase} size={isMobile ? 180 : 240} className="mb-4" />

          {/* Phase Label */}
          <span className="text-muted-foreground/70 text-xs font-medium tracking-widest uppercase">
            {getPhaseTranslation(moonPhase.name)} • {moonPhase.illumination}%{' '}
            {translate('moon.illumination')}
          </span>

          {/* Spiritual Quote */}
          <p className="animate-fade-in text-primary/70 animation-delay-300 mt-6 max-w-lg px-6 text-center text-base leading-relaxed font-light italic">
            "{getPhaseQuote(moonPhase.name)}"
          </p>
        </div>

        {/* Welcome text */}
        <h2 className="gradient-text mt-8 text-3xl tracking-tight">{translate('empty.welcome')}</h2>
      </div>
    </div>
  );
}
