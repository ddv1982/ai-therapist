'use client';

import React from 'react';
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

  const hasContent = data.situation || 
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

  return (
    <Card className={cn(
      "bg-muted border-0 shadow-lg",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-blue-900 dark:text-blue-100">
              {t('summary.title', { date: data.date })}
            </CardTitle>
            {data.completedSteps && data.completedSteps.length > 0 && (
              <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1">
                {t('summary.completedSteps', { count: data.completedSteps.length })}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Situation */}
        {data.situation && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-100">
              <h4 className="font-semibold">{t('summary.situation')}</h4>
            </div>
            <p className="text-blue-800 dark:text-blue-200 break-words">{data.situation}</p>
          </div>
        )}

        {/* Initial Emotions */}
        {data.initialEmotions && data.initialEmotions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-100">
              <h4 className="font-semibold">{t('summary.initialEmotions')}</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.initialEmotions.map((emotion, index) => (
                <Badge key={index} variant="secondary" className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  {translateEmotion(emotion.emotion)}: {emotion.rating}/10
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Automatic Thoughts */}
        {data.automaticThoughts && data.automaticThoughts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-100">
              <h4 className="font-semibold">{t('summary.automaticThoughts')}</h4>
            </div>
            <div className="rounded-md border border-blue-200/60 dark:border-blue-800/40 divide-y divide-blue-200/60 dark:divide-blue-800/40 bg-blue-50/20 dark:bg-blue-950/10">
              {data.automaticThoughts.slice(0, 3).map((thought, index) => (
                <div key={index} className="flex items-start justify-between gap-3 py-2 px-3 text-sm">
                  <div className="text-blue-800 dark:text-blue-200 break-words">&ldquo;{thought.thought}&rdquo;</div>
                  <Badge variant="secondary" className="ml-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    {thought.credibility}/10
                  </Badge>
                </div>
              ))}
              {data.automaticThoughts.length > 3 && (
                <div className="py-2 px-3">
                  <p className="text-sm text-blue-600 dark:text-blue-400 italic">{t('summary.moreThoughts', { count: data.automaticThoughts.length - 3 })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Core Belief */}
        {data.coreBelief && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-100">
              <h4 className="font-semibold">{t('summary.coreBelief')}</h4>
            </div>
            <div>
              <p className="text-blue-800 dark:text-blue-200 break-words">&ldquo;{data.coreBelief.belief}&rdquo;</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{t('summary.credibility')}: {data.coreBelief.credibility}/10</p>
            </div>
          </div>
        )}

        {/* Rational Alternative Thoughts */}
        {data.rationalThoughts && data.rationalThoughts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-100">
              <h4 className="font-semibold">{t('summary.rationalThoughts')}</h4>
            </div>
            <div className="rounded-md border border-blue-200/60 dark:border-blue-800/40 divide-y divide-blue-200/60 dark:divide-blue-800/40 bg-blue-50/20 dark:bg-blue-950/10">
              {data.rationalThoughts.slice(0, 2).map((thought, index) => (
                <div key={index} className="flex items-start justify-between gap-3 py-2 px-3 text-sm">
                  <div className="text-blue-800 dark:text-blue-200 break-words">&ldquo;{thought.thought}&rdquo;</div>
                  <Badge variant="outline" className="ml-2 text-sm border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
                    {thought.confidence}/10
                  </Badge>
                </div>
              ))}
              {data.rationalThoughts.length > 2 && (
                <div className="py-2 px-3">
                  <p className="text-sm text-blue-600 dark:text-blue-400 italic">{t('summary.moreRationalThoughts', { count: data.rationalThoughts.length - 2 })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Schema Modes */}
        {data.schemaModes && data.schemaModes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-100">
              <h4 className="font-semibold">{t('summary.activeSchemaModes')}</h4>
            </div>
            <div className="rounded-md border border-blue-200/60 dark:border-blue-800/40 divide-y divide-blue-200/60 dark:divide-blue-800/40 bg-blue-50/20 dark:bg-blue-950/10">
              {data.schemaModes.slice(0, 3).map((mode, index) => (
                <div key={index} className="flex items-start justify-between gap-3 py-2 px-3 text-sm">
                  <div className="text-blue-800 dark:text-blue-200">{mode.name}</div>
                  {mode.intensity && (
                    <Badge variant="outline" className="ml-2 text-sm border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300">
                      {mode.intensity}/10
                    </Badge>
                  )}
                </div>
              ))}
              {data.schemaModes.length > 3 && (
                <div className="py-2 px-3">
                  <p className="text-sm text-blue-600 dark:text-blue-400 italic">{t('summary.moreModes', { count: data.schemaModes.length - 3 })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Plan Summary with More Detail */}
        {((data.newBehaviors && data.newBehaviors.length > 0) || 
          (data.finalEmotions && data.finalEmotions.length > 0)) && (
          <div className="space-y-3 pt-2 border-t border-blue-200/60 dark:border-blue-800/30">
            <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
              <div className="text-blue-900 dark:text-blue-100">
                <h4 className="font-semibold">{t('summary.actionAndNext')}</h4>
              </div>
              <div className="space-y-3">
              {data.newBehaviors && data.newBehaviors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">{t('summary.newBehaviors')}</p>
                  <div className="rounded-md border border-blue-200/60 dark:border-blue-800/40 divide-y divide-blue-200/60 dark:divide-blue-800/40 bg-blue-50/20 dark:bg-blue-950/10">
                    {data.newBehaviors.slice(0, 3).map((behavior, index) => (
                      <div key={index} className="flex items-center justify-between gap-3 py-2 px-3 text-sm text-blue-800 dark:text-blue-200">
                        <span className="truncate">{behavior}</span>
                      </div>
                    ))}
                    {data.newBehaviors.length > 3 && (
                      <div className="py-2 px-3">
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 italic">{t('summary.moreStrategies', { count: data.newBehaviors.length - 3 })}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              
              
              {data.finalEmotions && data.finalEmotions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">{t('summary.emotionalProgress')}</p>
                  <div className="flex flex-wrap gap-2">
                    {data.finalEmotions.map((emotion, index) => (
                      <Badge key={index} variant="outline" className="px-2 py-0.5 text-sm border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
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
        <div className="pt-3 border-t border-blue-200/60 dark:border-blue-800/30">
          <p className="text-sm leading-relaxed text-blue-600/80 dark:text-blue-400/80 italic">
            {t('summary.completionNote', { date: data.date })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}