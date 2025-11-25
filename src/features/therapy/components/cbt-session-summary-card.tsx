'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageCircle, Heart, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface CBTSessionSummaryData {
  date: string;
  situation?: string;
  initialEmotions?: Array<{ emotion: string; rating: number }>;
  automaticThoughts?: Array<{ thought: string; credibility: number }>;
  coreBelief?: { belief: string; credibility: number };
  rationalThoughts?: Array<{ thought: string; confidence: number }>;
  schemaModes?: Array<{ name: string; intensity?: number }>;
  finalEmotions?: Array<{ emotion: string; rating: number }>;
  newBehaviors?: string[];
  completedSteps?: string[];
}

interface CBTSessionSummaryCardProps {
  data: CBTSessionSummaryData;
  className?: string;
}

export function CBTSessionSummaryCard({ data, className }: CBTSessionSummaryCardProps) {
  const t = useTranslations('cbt');
  const translate = useTranslations();

  const hasContent =
    data.situation ||
    (data.initialEmotions && data.initialEmotions.length > 0) ||
    (data.automaticThoughts && data.automaticThoughts.length > 0) ||
    data.coreBelief ||
    (data.rationalThoughts && data.rationalThoughts.length > 0) ||
    (data.schemaModes && data.schemaModes.length > 0);

  if (!hasContent) {
    return null;
  }

  const translateEmotion = (name: string): string => {
    const key = name.trim().toLowerCase();
    const map: Record<string, string> = {
      fear: 'emotions.labels.fear',
      anger: 'emotions.labels.anger',
      sadness: 'emotions.labels.sadness',
      joy: 'emotions.labels.joy',
      anxiety: 'emotions.labels.anxiety',
      shame: 'emotions.labels.shame',
      guilt: 'emotions.labels.guilt',
    };
    return map[key] ? t(map[key]) : name;
  };

  const translateSchemaModeLabel = (value?: string): string => {
    if (!value) return '';
    if (value.startsWith('schema.mode.')) {
      try {
        return translate(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 3) return 'bg-emerald-500';
    if (rating <= 6) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <Card
      role="region"
      aria-label={t('summary.ariaLabel', { date: data.date })}
      className={cn(
        'cbt-summary-card w-full overflow-hidden',
        'bg-slate-900 border border-slate-700/50 rounded-2xl',
        className
      )}
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm flex h-14 w-14 items-center justify-center rounded-xl">
            <Brain className="text-white h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-white text-xl font-bold tracking-tight">
              {t('summary.title', { date: data.date })}
            </h3>
            {data.completedSteps && data.completedSteps.length > 0 && (
              <p className="text-cyan-100 mt-0.5 text-sm font-medium">
                {t('summary.completedSteps', { count: data.completedSteps.length })}
              </p>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-5">
        {/* Situation */}
        {data.situation && (
          <Section icon={MessageCircle} title={t('summary.situation')}>
            <p className="text-slate-300 leading-relaxed">{data.situation}</p>
          </Section>
        )}

        {/* Initial Emotions */}
        {data.initialEmotions && data.initialEmotions.length > 0 && (
          <Section icon={Heart} title={t('summary.initialEmotions')}>
            <div className="flex flex-wrap gap-2">
              {data.initialEmotions.map((emotion, index) => (
                <Badge
                  key={index}
                  className={cn(
                    'px-3 py-1.5 text-sm font-semibold border-0 text-white',
                    getRatingColor(emotion.rating)
                  )}
                >
                  {translateEmotion(emotion.emotion)}: {emotion.rating}/10
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Automatic Thoughts */}
        {data.automaticThoughts && data.automaticThoughts.length > 0 && (
          <Section icon={MessageCircle} title={t('summary.automaticThoughts')}>
            <div className="space-y-2">
              {data.automaticThoughts.slice(0, 3).map((thought, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                >
                  <p className="text-slate-300 text-sm leading-relaxed flex-1">
                    &ldquo;{thought.thought}&rdquo;
                  </p>
                  <Badge className={cn('shrink-0 border-0 text-white', getRatingColor(thought.credibility))}>
                    {thought.credibility}/10
                  </Badge>
                </div>
              ))}
              {data.automaticThoughts.length > 3 && (
                <p className="text-slate-500 text-sm italic pl-1">
                  {t('summary.moreThoughts', { count: data.automaticThoughts.length - 3 })}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Core Belief */}
        {data.coreBelief && (
          <Section icon={Target} title={t('summary.coreBelief')}>
            <div className="bg-slate-800/50 rounded-lg px-4 py-3">
              <p className="text-slate-300 leading-relaxed">
                &ldquo;{data.coreBelief.belief}&rdquo;
              </p>
              <p className="text-slate-500 mt-2 text-sm">
                {t('summary.credibility')}: <span className="text-slate-400 font-medium">{data.coreBelief.credibility}/10</span>
              </p>
            </div>
          </Section>
        )}

        {/* Rational Alternative Thoughts */}
        {data.rationalThoughts && data.rationalThoughts.length > 0 && (
          <Section icon={Lightbulb} title={t('summary.rationalThoughts')} iconColor="text-emerald-400">
            <div className="space-y-2">
              {data.rationalThoughts.slice(0, 2).map((thought, index) => (
                <div
                  key={index}
                  className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                >
                  <p className="text-emerald-100 text-sm leading-relaxed flex-1">
                    &ldquo;{thought.thought}&rdquo;
                  </p>
                  <Badge className="shrink-0 bg-emerald-600 border-0 text-white">
                    {thought.confidence}/10
                  </Badge>
                </div>
              ))}
              {data.rationalThoughts.length > 2 && (
                <p className="text-slate-500 text-sm italic pl-1">
                  {t('summary.moreRationalThoughts', { count: data.rationalThoughts.length - 2 })}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Active Schema Modes */}
        {data.schemaModes && data.schemaModes.length > 0 && (
          <Section icon={Brain} title={t('summary.activeSchemaModes')} iconColor="text-purple-400">
            <div className="space-y-2">
              {data.schemaModes.slice(0, 3).map((mode, index) => (
                <div
                  key={index}
                  className="bg-purple-950/30 border border-purple-800/30 rounded-lg px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-purple-100 text-sm">{translateSchemaModeLabel(mode.name)}</span>
                  {mode.intensity && (
                    <Badge className="shrink-0 bg-purple-600 border-0 text-white">
                      {mode.intensity}/10
                    </Badge>
                  )}
                </div>
              ))}
              {data.schemaModes.length > 3 && (
                <p className="text-slate-500 text-sm italic pl-1">
                  {t('summary.moreModes', { count: data.schemaModes.length - 3 })}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Action Plan / Progress */}
        {((data.newBehaviors && data.newBehaviors.length > 0) ||
          (data.finalEmotions && data.finalEmotions.length > 0)) && (
          <Section icon={TrendingUp} title={t('summary.actionAndNext')} iconColor="text-blue-400">
            <div className="space-y-4">
              {data.newBehaviors && data.newBehaviors.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
                    {t('summary.newBehaviors')}
                  </p>
                  <div className="space-y-1.5">
                    {data.newBehaviors.slice(0, 3).map((behavior, index) => (
                      <div
                        key={index}
                        className="bg-slate-800/50 rounded-lg px-4 py-2.5 text-slate-300 text-sm"
                      >
                        {behavior}
                      </div>
                    ))}
                    {data.newBehaviors.length > 3 && (
                      <p className="text-slate-500 text-sm italic pl-1">
                        {t('summary.moreStrategies', { count: data.newBehaviors.length - 3 })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {data.finalEmotions && data.finalEmotions.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
                    {t('summary.emotionalProgress')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.finalEmotions.map((emotion, index) => (
                      <Badge
                        key={index}
                        className={cn(
                          'px-3 py-1.5 text-sm font-semibold border-0 text-white',
                          getRatingColor(emotion.rating)
                        )}
                      >
                        {translateEmotion(emotion.emotion)}: {emotion.rating}/10
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm italic">
            {t('summary.completionNote', { date: data.date })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface SectionProps {
  icon: React.ElementType;
  title: string;
  iconColor?: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, iconColor = 'text-cyan-400', children }: SectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <h4 className="text-slate-200 font-semibold text-sm">{title}</h4>
      </div>
      {children}
    </div>
  );
}
