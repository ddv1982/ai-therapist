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
        'bg-primary text-white border-0 rounded-2xl',
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 flex h-12 w-12 items-center justify-center rounded-full">
            <Brain className="text-white h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-white text-xl font-semibold">
              {t('summary.title', { date: data.date })}
            </CardTitle>
            {data.completedSteps && data.completedSteps.length > 0 && (
              <p className="text-white/70 mt-1 text-sm">
                {t('summary.completedSteps', { count: data.completedSteps.length })}
              </p>
            )}
          </div>
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
                  className="bg-white/20 text-white px-2 py-0.5 font-bold border border-white/30"
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
            <div className="bg-white/10 divide-y divide-white/20 rounded-md border border-white/20">
              {data.automaticThoughts.slice(0, 3).map((thought, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="text-white/90 break-words">&ldquo;{thought.thought}&rdquo;</div>
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white ml-2 text-sm border-0"
                  >
                    {thought.credibility}/10
                  </Badge>
                </div>
              ))}
              {data.automaticThoughts.length > 3 && (
                <div className="px-3 py-2">
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
            <div>
              <p className="text-white/90 break-words">&ldquo;{data.coreBelief.belief}&rdquo;</p>
              <p className="text-white/60 mt-1 text-sm">
                {t('summary.credibility')}: {data.coreBelief.credibility}/10
              </p>
            </div>
          </div>
        )}

        {/* Rational Alternative Thoughts */}
        {data.rationalThoughts && data.rationalThoughts.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[220px,1fr]">
            <div className="text-white">
              <h4 className="font-semibold">{t('summary.rationalThoughts')}</h4>
            </div>
            <div className="bg-white/10 divide-y divide-white/20 rounded-md border border-white/20">
              {data.rationalThoughts.slice(0, 2).map((thought, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="text-white/90 break-words">&ldquo;{thought.thought}&rdquo;</div>
                  <Badge
                    variant="outline"
                    className="ml-2 border-green-400/50 text-sm text-green-300"
                  >
                    {thought.confidence}/10
                  </Badge>
                </div>
              ))}
              {data.rationalThoughts.length > 2 && (
                <div className="px-3 py-2">
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
            <div className="bg-white/10 divide-y divide-white/20 rounded-md border border-white/20">
              {data.schemaModes.slice(0, 3).map((mode, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="text-white/90">{translateSchemaModeLabel(mode.name)}</div>
                  {mode.intensity && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-purple-400/50 text-sm text-purple-300"
                    >
                      {mode.intensity}/10
                    </Badge>
                  )}
                </div>
              ))}
              {data.schemaModes.length > 3 && (
                <div className="px-3 py-2">
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
          <div className="space-y-3 border-t border-white/20 pt-2">
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
                    <div className="bg-white/10 divide-y divide-white/20 rounded-md border border-white/20">
                      {data.newBehaviors.slice(0, 3).map((behavior, index) => (
                        <div
                          key={index}
                          className="text-white/90 flex items-center justify-between gap-3 px-3 py-2 text-sm"
                        >
                          <span className="truncate">{behavior}</span>
                        </div>
                      ))}
                      {data.newBehaviors.length > 3 && (
                        <div className="px-3 py-2">
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
                          variant="outline"
                          className="border-white/30 text-white px-2 py-0.5 text-sm"
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
        <div className="border-t border-white/20 pt-3">
          <p className="text-white/60 text-sm leading-relaxed italic">
            {t('summary.completionNote', { date: data.date })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
