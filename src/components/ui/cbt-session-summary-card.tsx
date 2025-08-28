'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const hasContent = data.situation || 
                     (data.initialEmotions && data.initialEmotions.length > 0) ||
                     (data.automaticThoughts && data.automaticThoughts.length > 0) ||
                     data.coreBelief ||
                     (data.rationalThoughts && data.rationalThoughts.length > 0) ||
                     (data.schemaModes && data.schemaModes.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={cn(
      "bg-gradient-to-br from-blue-50 to-blue-100/50 border-0 shadow-lg",
      "dark:from-blue-950/40 dark:to-blue-900/30 dark:border dark:border-blue-700/50",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 dark:bg-blue-400/30">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-blue-900 dark:text-blue-100">
              CBT Session Summary - {data.date}
            </CardTitle>
            {data.completedSteps && data.completedSteps.length > 0 && (
              <p className="text-sm text-blue-700/80 dark:text-blue-200 mt-1">
                Completed {data.completedSteps.length} therapeutic steps
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Situation */}
        {data.situation && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-200">
              <h4 className="font-medium">Situation</h4>
            </div>
            <p className="text-blue-800 dark:text-blue-100 break-words">{data.situation}</p>
          </div>
        )}

        {/* Initial Emotions */}
        {data.initialEmotions && data.initialEmotions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-200">
              <h4 className="font-medium">Initial Emotions</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.initialEmotions.map((emotion, index) => (
                <Badge key={index} variant="secondary" className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-100 border-blue-300 dark:border-blue-600">
                  {emotion.emotion}: {emotion.rating}/10
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Automatic Thoughts */}
        {data.automaticThoughts && data.automaticThoughts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-200">
              <h4 className="font-medium">Automatic Thoughts</h4>
            </div>
            <div className="rounded-md border border-blue-200/60 dark:border-blue-700/60 divide-y divide-blue-200/60 dark:divide-blue-700/40 bg-blue-50/30 dark:bg-blue-950/30">
              {data.automaticThoughts.slice(0, 3).map((thought, index) => (
                <div key={index} className="flex items-start justify-between gap-3 py-2 px-3 text-sm">
                  <div className="text-blue-800 dark:text-blue-100 break-words">&ldquo;{thought.thought}&rdquo;</div>
                  <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100 border-blue-300 dark:border-blue-500">
                    {thought.credibility}/10
                  </Badge>
                </div>
              ))}
              {data.automaticThoughts.length > 3 && (
                <div className="py-2 px-3">
                  <p className="text-xs text-blue-600 dark:text-blue-300 italic">+{data.automaticThoughts.length - 3} more thoughts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Core Belief */}
        {data.coreBelief && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-200">
              <h4 className="font-medium">Core Belief</h4>
            </div>
            <div>
              <p className="text-blue-800 dark:text-blue-100 break-words">&ldquo;{data.coreBelief.belief}&rdquo;</p>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">Credibility: {data.coreBelief.credibility}/10</p>
            </div>
          </div>
        )}

        {/* Rational Alternative Thoughts */}
        {data.rationalThoughts && data.rationalThoughts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-200">
              <h4 className="font-medium">Rational Alternative Thoughts</h4>
            </div>
            <div className="rounded-md border border-blue-200/60 dark:border-blue-700/60 divide-y divide-blue-200/60 dark:divide-blue-700/40 bg-blue-50/30 dark:bg-blue-950/30">
              {data.rationalThoughts.slice(0, 2).map((thought, index) => (
                <div key={index} className="flex items-start justify-between gap-3 py-2 px-3 text-sm">
                  <div className="text-blue-800 dark:text-blue-100 break-words">&ldquo;{thought.thought}&rdquo;</div>
                  <Badge variant="outline" className="ml-2 text-xs border-green-300 text-green-700 dark:border-green-500 dark:text-green-200 bg-green-50 dark:bg-green-900/30">
                    {thought.confidence}/10
                  </Badge>
                </div>
              ))}
              {data.rationalThoughts.length > 2 && (
                <div className="py-2 px-3">
                  <p className="text-xs text-blue-600 dark:text-blue-300 italic">+{data.rationalThoughts.length - 2} more rational thoughts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Schema Modes */}
        {data.schemaModes && data.schemaModes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
            <div className="text-blue-900 dark:text-blue-200">
              <h4 className="font-medium">Active Schema Modes</h4>
            </div>
            <div className="rounded-md border border-blue-200/60 dark:border-blue-700/60 divide-y divide-blue-200/60 dark:divide-blue-700/40 bg-blue-50/30 dark:bg-blue-950/30">
              {data.schemaModes.slice(0, 3).map((mode, index) => (
                <div key={index} className="flex items-start justify-between gap-3 py-2 px-3 text-sm">
                  <div className="text-blue-800 dark:text-blue-100">{mode.name}</div>
                  {mode.intensity && (
                    <Badge variant="outline" className="ml-2 text-xs border-purple-300 text-purple-700 dark:border-purple-500 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30">
                      {mode.intensity}/10
                    </Badge>
                  )}
                </div>
              ))}
              {data.schemaModes.length > 3 && (
                <div className="py-2 px-3">
                  <p className="text-xs text-blue-600 dark:text-blue-300 italic">+{data.schemaModes.length - 3} more modes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Plan Summary with More Detail */}
        {((data.newBehaviors && data.newBehaviors.length > 0) ||
          (data.finalEmotions && data.finalEmotions.length > 0)) && (
          <div className="space-y-3 pt-2 border-t border-blue-200/60 dark:border-blue-700/40">
            <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-x-4 gap-y-2 items-start">
              <div className="text-blue-900 dark:text-blue-200">
                <h4 className="font-medium">Action Plan & Next Steps</h4>
              </div>
              <div className="space-y-3">
              {data.newBehaviors && data.newBehaviors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">New Behaviors to Practice</p>
                  <div className="rounded-md border border-blue-200/60 dark:border-blue-700/60 divide-y divide-blue-200/60 dark:divide-blue-700/40 bg-blue-50/30 dark:bg-blue-950/30">
                    {data.newBehaviors.slice(0, 3).map((behavior, index) => (
                      <div key={index} className="flex items-center justify-between gap-3 py-2 px-3 text-xs text-blue-800 dark:text-blue-100">
                        <span className="truncate">{behavior}</span>
                      </div>
                    ))}
                    {data.newBehaviors.length > 3 && (
                      <div className="py-2 px-3">
                        <p className="text-[11px] text-blue-600 dark:text-blue-300 italic">+{data.newBehaviors.length - 3} more strategies</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.finalEmotions && data.finalEmotions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Emotional Progress</p>
                  <div className="flex flex-wrap gap-2">
                    {data.finalEmotions.map((emotion, index) => (
                      <Badge key={index} variant="outline" className="px-2 py-0.5 text-xs border-blue-300 text-blue-700 dark:border-blue-500 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30">
                        {emotion.emotion}: {emotion.rating}/10
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
        <div className="pt-3 border-t border-blue-200/60 dark:border-blue-700/40">
          <p className="text-xs leading-relaxed text-blue-600/80 dark:text-blue-300 italic">
            This CBT session was completed on {data.date} and included comprehensive work on
            situation analysis, emotion tracking, thought examination, core belief exploration,
            rational thought development, and action planning.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}