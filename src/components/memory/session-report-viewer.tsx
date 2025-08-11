'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { MessageContent } from '@/components/messages/message-content';
import { MessageAvatar } from '@/components/messages/message-avatar';
import { MessageTimestamp } from '@/components/messages/message-timestamp';
import { buildMessageClasses } from '@/lib/design-system/message';
import { type SessionReportDetail } from '@/lib/chat/memory-utils';
import { Calendar, FileText, CheckCircle, Brain } from 'lucide-react';

interface SessionReportViewerProps {
  reportDetail: SessionReportDetail;
  className?: string;
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
    <div className={cn("space-y-6", className)}>
      {/* Session Report Header */}
      <div className="bg-card border border-border rounded-lg spacing-md">
        <div className="flex items-start gap-4 mb-4">
          <Brain className="w-6 h-6 text-primary mt-1" />
          <div className="flex-1">
            <h2 className="text-therapy-lg font-semibold text-foreground mb-2">
              {reportDetail.sessionTitle}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-therapy-sm text-muted-foreground">
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
            <h3 className="text-therapy-sm font-semibold text-foreground mb-3">
              Key Therapeutic Insights
            </h3>
            <div className="flex flex-wrap gap-2">
              {reportDetail.keyInsights.map((insight, index) => (
                <span 
                  key={index} 
                  className="text-therapy-sm bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
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
        <h3 className="text-therapy-sm font-semibold text-foreground mb-4 pb-3 border-b border-border/30">
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
    </div>
  );
}