'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { MessageContent } from '@/features/chat/messages/message-content';
import { MessageAvatar } from '@/features/chat/messages/message-avatar';
import { MessageTimestamp } from '@/features/chat/messages/message-timestamp';
import { buildMessageClasses } from '@/lib/design-system/message';
import { type SessionReportDetail } from '@/lib/chat/memory-utils';
import { type ExtractedCBTData } from '@/lib/therapy/cbt-data-parser';
import { Calendar, FileText, CheckCircle, Brain, Heart, Target, Users, Activity } from 'lucide-react';

interface SessionReportViewerProps {
  reportDetail: SessionReportDetail;
  className?: string;
}








// Component to display detailed CBT data in tables
function DetailedCBTDataTables({ structuredData }: { structuredData: ExtractedCBTData }) {
  const hasAnyData = structuredData.situation || 
                     structuredData.emotions || 
                     structuredData.thoughts || 
                     structuredData.coreBeliefs || 
                     structuredData.rationalThoughts || 
                     structuredData.schemaModes || 
                     structuredData.actionPlan;

  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6" data-testid="detailed-cbt-data">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Detailed CBT Session Data</h3>
      </div>

      <div className="space-y-8">
        {/* Situation Analysis */}
        {structuredData.situation && (
          <div data-testid="cbt-situation-section">
            <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              1. Situation Analysis
            </h4>
            <table className="w-full border border-border/50 rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Situation Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/50">
                  <td className="p-4 text-sm">{structuredData.situation.date}</td>
                  <td className="p-4 text-sm">{structuredData.situation.description}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Emotional Assessment */}
        {structuredData.emotions && Object.keys(structuredData.emotions.initial).length > 0 && (
          <div data-testid="cbt-emotions-section">
            <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              2. Emotional Assessment
            </h4>
            <table className="w-full border border-border/50 rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Emotion</th>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Initial Rating</th>
                  {structuredData.emotions.final && Object.keys(structuredData.emotions.final).length > 0 && (
                    <th className="text-left p-4 font-medium text-sm text-foreground">Final Rating</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {Object.entries(structuredData.emotions.initial).map(([emotion, rating]) => (
                  <tr key={emotion} className="border-t border-border/50">
                    <td className="p-4 text-sm capitalize font-medium">{emotion}</td>
                    <td className="p-4 text-sm">{typeof rating === 'number' ? rating : 0}/10</td>
                    {structuredData.emotions?.final && (
                      <td className="p-4 text-sm">
                        {structuredData.emotions.final[emotion] !== undefined 
                          ? `${structuredData.emotions.final[emotion]}/10` 
                          : 'N/A'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Automatic Thoughts */}
        {structuredData.thoughts && structuredData.thoughts.automaticThoughts.length > 0 && (
          <div>
            <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              3. Automatic Thoughts
            </h4>
            <table className="w-full border border-border/50 rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-foreground w-16">#</th>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Automatic Thought</th>
                </tr>
              </thead>
              <tbody>
                {structuredData.thoughts.automaticThoughts.map((thought: unknown, index: number) => (
                  <tr key={index} className="border-t border-border/50">
                    <td className="p-4 text-sm font-medium">{index + 1}</td>
                    <td className="p-4 text-sm">&ldquo;{typeof thought === 'string' ? thought : String(thought || '')}&rdquo;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Core Beliefs */}
        {structuredData.coreBeliefs && (
          <div>
            <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              4. Core Belief Analysis
            </h4>
            <table className="w-full border border-border/50 rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Core Belief</th>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Credibility Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/50">
                  <td className="p-4 text-sm">&ldquo;{structuredData.coreBeliefs.belief}&rdquo;</td>
                  <td className="p-4 text-sm font-medium">{structuredData.coreBeliefs.credibility}/10</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Rational Thoughts */}
        {structuredData.rationalThoughts && structuredData.rationalThoughts.thoughts.length > 0 && (
          <div>
            <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              5. Rational Alternative Thoughts
            </h4>
            <table className="w-full border border-border/50 rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-foreground w-16">#</th>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Rational Thought</th>
                </tr>
              </thead>
              <tbody>
                {structuredData.rationalThoughts.thoughts.map((thought: unknown, index: number) => (
                  <tr key={index} className="border-t border-border/50">
                    <td className="p-4 text-sm font-medium">{index + 1}</td>
                    <td className="p-4 text-sm">&ldquo;{typeof thought === 'string' ? thought : String(thought || '')}&rdquo;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Schema Modes */}
        {structuredData.schemaModes && structuredData.schemaModes.length > 0 && (
          <div>
            <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              6. Active Schema Modes
            </h4>
            <table className="w-full border border-border/50 rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Schema Mode</th>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Intensity</th>
                  <th className="text-left p-4 font-medium text-sm text-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {structuredData.schemaModes.map((mode: { name: string; intensity: number; description: string }, index: number) => (
                  <tr key={index} className="border-t border-border/50">
                    <td className="p-4 text-sm font-medium">{mode.name}</td>
                    <td className="p-4 text-sm">{mode.intensity}/10</td>
                    <td className="p-4 text-sm">{mode.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Plan */}
        {structuredData.actionPlan && (
          <div>
            <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              7. Action Plan & Strategies
            </h4>
            <div className="space-y-6">
              {structuredData.actionPlan.newBehaviors && structuredData.actionPlan.newBehaviors.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-foreground mb-3">New Behaviors to Practice</h5>
                  <table className="w-full border border-border/50 rounded-lg overflow-hidden">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium text-sm text-foreground w-16">#</th>
                        <th className="text-left p-4 font-medium text-sm text-foreground">Behavior/Strategy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structuredData.actionPlan.newBehaviors.map((behavior: unknown, index: number) => (
                        <tr key={index} className="border-t border-border/50">
                          <td className="p-4 text-sm font-medium">{index + 1}</td>
                          <td className="p-4 text-sm">{typeof behavior === 'string' ? behavior : String(behavior || '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Alternative responses removed from current UX */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// Component to render CBT data when available
function DetailedCBTDataDisplay({ reportDetail }: { reportDetail: SessionReportDetail }) {
  // Only show detailed CBT data if we have structured data
  if (reportDetail.structuredCBTData && typeof reportDetail.structuredCBTData === 'object') {
    try {
      const structuredData = reportDetail.structuredCBTData as ExtractedCBTData;
      return <DetailedCBTDataTables structuredData={structuredData} />;
    } catch {
      // Silently handle error
    }
  }
  return null;
}

export function SessionReportViewer({ reportDetail, className }: SessionReportViewerProps) {
  const containerClasses = buildMessageClasses('assistant', 'container');
  const contentWrapperClasses = buildMessageClasses('assistant', 'contentWrapper');
  
  const formatReportSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className={cn("space-y-6", className)}>
        {/* Session Report Header */}
        <div className="bg-card border border-border rounded-lg spacing-md">
        <div className="flex items-start gap-4 mb-4">
          <Brain className="w-6 h-6 text-primary mt-1" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {reportDetail.sessionTitle}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Session: {reportDetail.sessionDate}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Report: {reportDetail.reportDate}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{formatReportSize(reportDetail.reportSize)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Encrypted Content</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Insights */}
        {reportDetail.keyInsights.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Key Therapeutic Insights
            </h3>
            <div className="flex flex-wrap gap-2">
              {reportDetail.keyInsights.map((insight, index) => (
                <span 
                  key={index} 
                  className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                >
                  {insight.length > 40 ? insight.substring(0, 40) + '...' : insight}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>



      {/* Therapeutic Content Display */}
      <div className="bg-card border border-border rounded-lg spacing-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4 pb-3 border-b border-border/30">
          Session Report Content
        </h3>
        
        <article 
          className={cn(containerClasses, "bg-transparent border-0 shadow-none")}
          role="article"
          aria-label="Therapeutic session report content"
        >
          {/* Avatar */}
          <MessageAvatar role="assistant" />
          
          {/* Content Wrapper */}
          <div className={contentWrapperClasses}>
            {/* Message Content with Therapeutic Styling */}
            <MessageContent 
              content={reportDetail.fullContent} 
              role="assistant"
              className="bg-muted/30 border border-border/50 shadow-sm"
            />
            
            {/* Timestamp */}
            <MessageTimestamp 
              timestamp={new Date(reportDetail.reportDate)}
              role="assistant"
            />
          </div>
        </article>
        </div>
        
        {/* Show detailed CBT data if available */}
        <DetailedCBTDataDisplay reportDetail={reportDetail} />
      </div>
    </>
  );
}