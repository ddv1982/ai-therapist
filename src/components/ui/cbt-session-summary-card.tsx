'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Calendar, Heart, MessageSquare, Target, Users, Activity, Lightbulb } from 'lucide-react';
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
  alternativeResponses?: Array<{ response: string }>;
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
      "dark:from-blue-950/20 dark:to-blue-900/10",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-400/10">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-blue-900 dark:text-blue-100">
              CBT Session Summary - {data.date}
            </CardTitle>
            {data.completedSteps && data.completedSteps.length > 0 && (
              <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1">
                Completed {data.completedSteps.length} therapeutic steps
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Situation */}
        {data.situation && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Situation:</h4>
            </div>
            <p className="text-blue-800 dark:text-blue-200 pl-6">{data.situation}</p>
          </div>
        )}

        {/* Initial Emotions */}
        {data.initialEmotions && data.initialEmotions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Initial Emotions:</h4>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {data.initialEmotions.map((emotion, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  {emotion.emotion}: {emotion.rating}/10
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Automatic Thoughts */}
        {data.automaticThoughts && data.automaticThoughts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Automatic Thoughts:</h4>
            </div>
            <div className="space-y-2 pl-6">
              {data.automaticThoughts.slice(0, 3).map((thought, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div className="text-blue-800 dark:text-blue-200">
                    &ldquo;{thought.thought}&rdquo; 
                    <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                      {thought.credibility}/10
                    </Badge>
                  </div>
                </div>
              ))}
              {data.automaticThoughts.length > 3 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                  +{data.automaticThoughts.length - 3} more thoughts
                </p>
              )}
            </div>
          </div>
        )}

        {/* Core Belief */}
        {data.coreBelief && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Core Belief:</h4>
            </div>
            <div className="pl-6">
              <p className="text-blue-800 dark:text-blue-200">&ldquo;{data.coreBelief.belief}&rdquo;</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                (Credibility: {data.coreBelief.credibility}/10)
              </p>
            </div>
          </div>
        )}

        {/* Rational Alternative Thoughts */}
        {data.rationalThoughts && data.rationalThoughts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Rational Alternative Thoughts:</h4>
            </div>
            <div className="space-y-2 pl-6">
              {data.rationalThoughts.slice(0, 2).map((thought, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <div className="text-blue-800 dark:text-blue-200">
                    &ldquo;{thought.thought}&rdquo; 
                    <Badge variant="outline" className="ml-2 text-xs border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
                      {thought.confidence}/10
                    </Badge>
                  </div>
                </div>
              ))}
              {data.rationalThoughts.length > 2 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                  +{data.rationalThoughts.length - 2} more rational thoughts
                </p>
              )}
            </div>
          </div>
        )}

        {/* Active Schema Modes */}
        {data.schemaModes && data.schemaModes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Active Schema Modes:</h4>
            </div>
            <div className="space-y-2 pl-6">
              {data.schemaModes.slice(0, 3).map((mode, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                  <div className="text-blue-800 dark:text-blue-200">
                    {mode.name}
                    {mode.intensity && (
                      <Badge variant="outline" className="ml-2 text-xs border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300">
                        {mode.intensity}/10
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {data.schemaModes.length > 3 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                  +{data.schemaModes.length - 3} more modes
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Plan Summary with More Detail */}
        {((data.newBehaviors && data.newBehaviors.length > 0) || 
          (data.alternativeResponses && data.alternativeResponses.length > 0) ||
          (data.finalEmotions && data.finalEmotions.length > 0)) && (
          <div className="space-y-3 pt-2 border-t border-blue-200/60 dark:border-blue-800/30">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Action Plan & Next Steps:</h4>
            </div>
            <div className="pl-6 space-y-3">
              {data.newBehaviors && data.newBehaviors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">New Behaviors to Practice:</p>
                  <div className="space-y-1">
                    {data.newBehaviors.slice(0, 3).map((behavior, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-200">
                        <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                        {behavior}
                      </div>
                    ))}
                    {data.newBehaviors.length > 3 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 italic pl-2">
                        +{data.newBehaviors.length - 3} more strategies
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {data.alternativeResponses && data.alternativeResponses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Alternative Responses:</p>
                  <div className="space-y-1">
                    {data.alternativeResponses.slice(0, 3).map((response, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-200">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                        {typeof response === 'string' ? response : response.response}
                      </div>
                    ))}
                    {data.alternativeResponses.length > 3 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 italic pl-2">
                        +{data.alternativeResponses.length - 3} more responses
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {data.finalEmotions && data.finalEmotions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Emotional Progress:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.finalEmotions.map((emotion, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
                        {emotion.emotion}: {emotion.rating}/10
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Completion Note */}
        <div className="pt-3 border-t border-blue-200/60 dark:border-blue-800/30">
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 italic">
            This CBT session was completed on {data.date} and included comprehensive work on 
            situation analysis, emotion tracking, thought examination, core belief exploration, 
            rational thought development, and action planning.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}