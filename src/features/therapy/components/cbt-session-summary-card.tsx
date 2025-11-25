'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
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

  return (
    <Card
      role="region"
      aria-label={t('summary.ariaLabel', { date: data.date })}
      className={cn(
        'cbt-summary-card w-full',
        'bg-primary text-white border-0 rounded-2xl overflow-hidden',
        className
      )}
    >
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="text-white/80 h-5 w-5" />
            <CardTitle className="text-white text-lg font-semibold">
              {t('summary.title', { date: data.date })}
            </CardTitle>
          </div>
          {data.completedSteps && data.completedSteps.length > 0 && (
            <span 
              className="text-white text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(0, 50, 70, 0.6)' }}
            >
              {data.completedSteps.length} steps
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Situation */}
        {data.situation && (
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[220px,1fr]">
            <div className="text-white">
              <h4 className="font-semibold">{t('summary.situation')}</h4>
            </div>
            <p className="text-white/90 break-words">{data.situation}</p>
          </div>
        )}

        {/* Initial Emotions */}
        {data.initialEmotions && data.initialEmotions.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[220px,1fr]">
            <div className="text-white">
              <h4 className="font-semibold">{t('summary.initialEmotions')}</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.initialEmotions.map((emotion, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-white px-3 py-1 font-semibold border-0"
                  style={{ backgroundColor: 'rgba(0, 50, 70, 0.8)' }}
                >
                  {translateEmotion(emotion.emotion)}: {emotion.rating}/10
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Automatic Thoughts */}
        {data.automaticThoughts && data.automaticThoughts.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[220px,1fr]">
            <div className="text-white">
              <h4 className="font-semibold">{t('summary.automaticThoughts')}</h4>
            </div>
            <div 
              className="divide-y divide-white/10 rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(0, 50, 70, 0.7)' }}
            >
              {data.automaticThoughts.slice(0, 3).map((thought, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="text-white break-words">&ldquo;{thought.thought}&rdquo;</div>
                  <Badge
                    variant="secondary"
                    className="text-white ml-2 text-sm border-0 shrink-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    {thought.credibility}/10
                  </Badge>
                </div>
              ))}
              {data.automaticThoughts.length > 3 && (
                <div className="px-4 py-2" style={{ backgroundColor: 'rgba(0, 40, 60, 0.5)' }}>
                  <p className="text-white/60 text-sm italic">
                    {t('summary.moreThoughts', { count: data.automaticThoughts.length - 3 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Core Belief */}
        {data.coreBelief && (
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[220px,1fr]">
            <div className="text-white">
              <h4 className="font-semibold">{t('summary.coreBelief')}</h4>
            </div>
            <div 
              className="rounded-lg overflow-hidden px-4 py-3"
              style={{ backgroundColor: 'rgba(0, 50, 70, 0.7)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-white break-words text-sm">&ldquo;{data.coreBelief.belief}&rdquo;</p>
                <Badge
                  variant="secondary"
                  className="text-white ml-2 text-sm border-0 shrink-0"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  {data.coreBelief.credibility}/10
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Rational Alternative Thoughts */}
        {data.rationalThoughts && data.rationalThoughts.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[220px,1fr]">
            <div className="text-white">
              <h4 className="font-semibold">{t('summary.rationalThoughts')}</h4>
            </div>
            <div 
              className="divide-y divide-white/10 rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(0, 60, 50, 0.7)' }}
            >
              {data.rationalThoughts.slice(0, 2).map((thought, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="text-white break-words">&ldquo;{thought.thought}&rdquo;</div>
                  <Badge
                    variant="secondary"
                    className="text-white ml-2 text-sm border-0 shrink-0"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    {thought.confidence}/10
                  </Badge>
                </div>
              ))}
              {data.rationalThoughts.length > 2 && (
                <div className="px-4 py-2" style={{ backgroundColor: 'rgba(0, 50, 40, 0.5)' }}>
                  <p className="text-white/60 text-sm italic">
                    {t('summary.moreRationalThoughts', { count: data.rationalThoughts.length - 2 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Schema Modes */}
        {data.schemaModes && data.schemaModes.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[220px,1fr]">
            <div className="text-white">
              <h4 className="font-semibold">{t('summary.activeSchemaModes')}</h4>
            </div>
            <div 
              className="divide-y divide-white/10 rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(60, 30, 80, 0.7)' }}
            >
              {data.schemaModes.slice(0, 3).map((mode, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="text-white">{translateSchemaModeLabel(mode.name)}</div>
                  {mode.intensity && (
                    <Badge
                      variant="secondary"
                      className="text-white ml-2 text-sm border-0 shrink-0"
                      style={{ backgroundColor: '#a855f7' }}
                    >
                      {mode.intensity}/10
                    </Badge>
                  )}
                </div>
              ))}
              {data.schemaModes.length > 3 && (
                <div className="px-4 py-2" style={{ backgroundColor: 'rgba(50, 20, 70, 0.5)' }}>
                  <p className="text-white/60 text-sm italic">
                    {t('summary.moreModes', { count: data.schemaModes.length - 3 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Plan Summary with More Detail */}
        {((data.newBehaviors && data.newBehaviors.length > 0) ||
          (data.finalEmotions && data.finalEmotions.length > 0)) && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[220px,1fr]">
              <div className="text-white">
                <h4 className="font-semibold">{t('summary.actionAndNext')}</h4>
              </div>
              <div className="space-y-3">
                {data.newBehaviors && data.newBehaviors.length > 0 && (
                  <div>
                    <p className="text-white mb-1 text-sm font-semibold">
                      {t('summary.newBehaviors')}
                    </p>
                    <div 
                      className="divide-y divide-white/10 rounded-lg overflow-hidden"
                      style={{ backgroundColor: 'rgba(0, 50, 70, 0.7)' }}
                    >
                      {data.newBehaviors.slice(0, 3).map((behavior, index) => (
                        <div
                          key={index}
                          className="text-white flex items-center justify-between gap-3 px-4 py-3 text-sm"
                        >
                          <span className="truncate">{behavior}</span>
                        </div>
                      ))}
                      {data.newBehaviors.length > 3 && (
                        <div className="px-4 py-2" style={{ backgroundColor: 'rgba(0, 40, 60, 0.5)' }}>
                          <p className="text-white/60 text-[11px] italic">
                            {t('summary.moreStrategies', { count: data.newBehaviors.length - 3 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {data.finalEmotions && data.finalEmotions.length > 0 && (
                  <div>
                    <p className="text-white mb-2 text-sm font-semibold">
                      {t('summary.emotionalProgress')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.finalEmotions.map((emotion, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-white px-3 py-1 text-sm border-0"
                          style={{ backgroundColor: 'rgba(0, 50, 70, 0.8)' }}
                        >
                          {translateEmotion(emotion.emotion)}: {emotion.rating}/10
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Session Completion Note */}
        <div className="pt-3">
          <p className="text-white/60 text-sm leading-relaxed italic">
            {t('summary.completionNote', { date: data.date })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
