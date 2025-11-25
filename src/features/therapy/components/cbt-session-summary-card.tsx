'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <CardContent className="space-y-5 pt-5 pb-5">
        {/* Situation */}
        {data.situation && (
          <div>
            <h4 className="text-white font-semibold mb-2">
              {t('summary.situation')}
            </h4>
            <div 
              className="rounded-lg overflow-hidden px-4 py-3"
              style={{ backgroundColor: 'rgba(0, 50, 70, 0.7)' }}
            >
              <p className="text-white break-words text-base">{data.situation}</p>
            </div>
          </div>
        )}

        {/* Initial Emotions */}
        {data.initialEmotions && data.initialEmotions.length > 0 && (
          <div>
            <h4 className="text-white font-semibold mb-2">
              {t('summary.initialEmotions')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.initialEmotions.map((emotion, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-white px-3 py-1 border-0"
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
          <div>
            <h4 className="text-white font-semibold mb-2">
              {t('summary.automaticThoughts')}
            </h4>
            <div 
              className="divide-y divide-white/10 rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(0, 50, 70, 0.7)' }}
            >
              {data.automaticThoughts.slice(0, 3).map((thought, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-4 py-3"
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
          <div>
            <h4 className="text-white font-semibold mb-2">
              {t('summary.coreBelief')}
            </h4>
            <div 
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(0, 50, 70, 0.7)' }}
            >
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="text-white break-words">&ldquo;{data.coreBelief.belief}&rdquo;</div>
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
          <div>
            <h4 className="text-white font-semibold mb-2">
              {t('summary.rationalThoughts')}
            </h4>
            <div 
              className="divide-y divide-white/10 rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(0, 60, 50, 0.7)' }}
            >
              {data.rationalThoughts.slice(0, 2).map((thought, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-4 py-3"
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
          <div>
            <h4 className="text-white font-semibold mb-2">
              {t('summary.activeSchemaModes')}
            </h4>
            <div 
              className="divide-y divide-white/10 rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(60, 30, 80, 0.7)' }}
            >
              {data.schemaModes.slice(0, 3).map((mode, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 px-4 py-3"
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
          <div className="space-y-4">
            {data.newBehaviors && data.newBehaviors.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('summary.newBehaviors')}
                </h4>
                    <div 
                      className="divide-y divide-white/10 rounded-lg overflow-hidden"
                      style={{ backgroundColor: 'rgba(0, 50, 70, 0.7)' }}
                    >
                      {data.newBehaviors.slice(0, 3).map((behavior, index) => (
                        <div
                          key={index}
                          className="text-white flex items-center justify-between gap-3 px-4 py-3"
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
                <h4 className="text-white font-semibold mb-2">
                  {t('summary.emotionalProgress')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.finalEmotions.map((emotion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-white px-3 py-1 border-0"
                      style={{ backgroundColor: 'rgba(0, 50, 70, 0.8)' }}
                    >
                      {translateEmotion(emotion.emotion)}: {emotion.rating}/10
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
