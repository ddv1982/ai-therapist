'use client';

import { cn } from '@/lib/utils';
import { MessageContent } from '@/features/chat/messages/message-content';
import { MessageAvatar } from '@/features/chat/messages/message-avatar';
import { MessageTimestamp } from '@/features/chat/messages/message-timestamp';
import { buildMessageClasses } from '@/lib/ui/design-system/message';
import { type SessionReportDetail } from '@/lib/chat/memory-utils';
import { type CBTStructuredAssessment } from '@/lib/therapy/parsers';
import {
  Calendar,
  FileText,
  CheckCircle,
  Brain,
  Heart,
  Target,
  Users,
  Activity,
} from 'lucide-react';

interface SessionReportViewerProps {
  reportDetail: SessionReportDetail;
  className?: string;
}

// Component to display detailed CBT data in tables
function DetailedCBTDataTables({ structuredData }: { structuredData: CBTStructuredAssessment }) {
  const hasAnyData =
    structuredData.situation ||
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
    <div className="bg-card border-border rounded-lg border p-6" data-testid="detailed-cbt-data">
      <div className="mb-6 flex items-center gap-2">
        <FileText className="text-primary h-5 w-5" />
        <h3 className="text-foreground text-xl font-semibold">Detailed CBT Session Data</h3>
      </div>

      <div className="space-y-8">
        {/* Situation Analysis */}
        {structuredData.situation && (
          <div data-testid="cbt-situation-section">
            <h4 className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
              <Calendar className="text-primary h-4 w-4" />
              1. Situation Analysis
            </h4>
            <table className="border-border/50 w-full overflow-hidden rounded-lg border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">Date</th>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">
                    Situation Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-border/50 border-t">
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
            <h4 className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
              <Heart className="text-primary h-4 w-4" />
              2. Emotional Assessment
            </h4>
            <table className="border-border/50 w-full overflow-hidden rounded-lg border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">Emotion</th>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">
                    Initial Rating
                  </th>
                  {structuredData.emotions.final &&
                    Object.keys(structuredData.emotions.final).length > 0 && (
                      <th className="text-foreground p-4 text-left text-sm font-semibold">
                        Final Rating
                      </th>
                    )}
                </tr>
              </thead>
              <tbody>
                {Object.entries(structuredData.emotions.initial).map(([emotion, rating]) => (
                  <tr key={emotion} className="border-border/50 border-t">
                    <td className="p-4 text-sm font-semibold capitalize">{emotion}</td>
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
            <h4 className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
              <Brain className="text-primary h-4 w-4" />
              3. Automatic Thoughts
            </h4>
            <table className="border-border/50 w-full overflow-hidden rounded-lg border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-foreground w-16 p-4 text-left text-sm font-semibold">#</th>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">
                    Automatic Thought
                  </th>
                </tr>
              </thead>
              <tbody>
                {structuredData.thoughts.automaticThoughts.map(
                  (thought: unknown, index: number) => (
                    <tr key={index} className="border-border/50 border-t">
                      <td className="p-4 text-sm font-semibold">{index + 1}</td>
                      <td className="p-4 text-sm">
                        &ldquo;{typeof thought === 'string' ? thought : String(thought || '')}
                        &rdquo;
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Core Beliefs */}
        {structuredData.coreBeliefs && (
          <div>
            <h4 className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
              <Target className="text-primary h-4 w-4" />
              4. Core Belief Analysis
            </h4>
            <table className="border-border/50 w-full overflow-hidden rounded-lg border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">
                    Core Belief
                  </th>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">
                    Credibility Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-border/50 border-t">
                  <td className="p-4 text-sm">&ldquo;{structuredData.coreBeliefs.belief}&rdquo;</td>
                  <td className="p-4 text-sm font-semibold">
                    {structuredData.coreBeliefs.credibility}/10
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Rational Thoughts */}
        {structuredData.rationalThoughts && structuredData.rationalThoughts.thoughts.length > 0 && (
          <div>
            <h4 className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
              <CheckCircle className="text-primary h-4 w-4" />
              5. Rational Alternative Thoughts
            </h4>
            <table className="border-border/50 w-full overflow-hidden rounded-lg border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-foreground w-16 p-4 text-left text-sm font-semibold">#</th>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">
                    Rational Thought
                  </th>
                </tr>
              </thead>
              <tbody>
                {structuredData.rationalThoughts.thoughts.map((thought: unknown, index: number) => (
                  <tr key={index} className="border-border/50 border-t">
                    <td className="p-4 text-sm font-semibold">{index + 1}</td>
                    <td className="p-4 text-sm">
                      &ldquo;{typeof thought === 'string' ? thought : String(thought || '')}&rdquo;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Schema Modes */}
        {structuredData.schemaModes && structuredData.schemaModes.length > 0 && (
          <div>
            <h4 className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
              <Users className="text-primary h-4 w-4" />
              6. Active Schema Modes
            </h4>
            <table className="border-border/50 w-full overflow-hidden rounded-lg border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">
                    Schema Mode
                  </th>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">Intensity</th>
                  <th className="text-foreground p-4 text-left text-sm font-semibold">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {structuredData.schemaModes.map(
                  (
                    mode: { name: string; intensity: number; description: string },
                    index: number
                  ) => (
                    <tr key={index} className="border-border/50 border-t">
                      <td className="p-4 text-sm font-semibold">{mode.name}</td>
                      <td className="p-4 text-sm">{mode.intensity}/10</td>
                      <td className="p-4 text-sm">{mode.description}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Plan */}
        {structuredData.actionPlan && (
          <div>
            <h4 className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
              <Activity className="text-primary h-4 w-4" />
              7. Action Plan & Strategies
            </h4>
            <div className="space-y-6">
              {structuredData.actionPlan.newBehaviors &&
                structuredData.actionPlan.newBehaviors.length > 0 && (
                  <div>
                    <h5 className="text-foreground mb-3 text-sm font-semibold">
                      New Behaviors to Practice
                    </h5>
                    <table className="border-border/50 w-full overflow-hidden rounded-lg border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-foreground w-16 p-4 text-left text-sm font-semibold">
                            #
                          </th>
                          <th className="text-foreground p-4 text-left text-sm font-semibold">
                            Behavior/Strategy
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {structuredData.actionPlan.newBehaviors.map(
                          (behavior: unknown, index: number) => (
                            <tr key={index} className="border-border/50 border-t">
                              <td className="p-4 text-sm font-semibold">{index + 1}</td>
                              <td className="p-4 text-sm">
                                {typeof behavior === 'string' ? behavior : String(behavior || '')}
                              </td>
                            </tr>
                          )
                        )}
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
      const structuredData = reportDetail.structuredCBTData as CBTStructuredAssessment;
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
      <div className={cn('space-y-6', className)}>
        {/* Session Report Header */}
        <div className="bg-card border-border spacing-md rounded-lg border">
          <div className="mb-4 flex items-start gap-4">
            <Brain className="text-primary mt-1 h-6 w-6" />
            <div className="flex-1">
              <h2 className="text-foreground mb-2 text-xl font-semibold">
                {reportDetail.sessionTitle}
              </h2>

              <div className="text-muted-foreground grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Session: {reportDetail.sessionDate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Report: {reportDetail.reportDate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{formatReportSize(reportDetail.reportSize)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Encrypted Content</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          {reportDetail.keyInsights.length > 0 && (
            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Key Therapeutic Insights
              </h3>
              <div className="flex flex-wrap gap-2">
                {reportDetail.keyInsights.map((insight, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 text-primary border-primary/20 rounded-full border px-3 py-1 text-sm"
                  >
                    {insight.length > 40 ? insight.substring(0, 40) + '...' : insight}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Therapeutic Content Display */}
        <div className="bg-card border-border spacing-sm rounded-lg border">
          <h3 className="text-foreground border-border/30 mb-4 border-b pb-3 text-sm font-semibold">
            Session Report Content
          </h3>

          <article
            className={cn(containerClasses, 'border-0 bg-transparent shadow-none')}
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
                className="bg-muted/30 border-border/50 border shadow-sm"
              />

              {/* Timestamp */}
              <MessageTimestamp timestamp={new Date(reportDetail.reportDate)} role="assistant" />
            </div>
          </article>
        </div>

        {/* Show detailed CBT data if available */}
        <DetailedCBTDataDisplay reportDetail={reportDetail} />
      </div>
    </>
  );
}
