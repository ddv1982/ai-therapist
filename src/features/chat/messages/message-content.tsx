/**
 * Message Content Component - Handles content processing and display
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/design-system/message';
import { StreamingTableBuffer } from '@/components/ui/streaming-table-buffer';
import { logger } from '@/lib/utils/logger';
import type { RootState } from '@/store';

interface MessageContentProps {
  content: string;
  role: MessageRole;
  messageId?: string;
  className?: string;
}

// Check if message content suggests it's a session report with CBT data
function detectCBTSessionReport(content: string): boolean {
  const cbtIndicators = [
    'ERP (Exposure & Response Prevention)',
    'Schema Therapy Analysis',
    'Identified Distortions',
    'Active Schema Modes',
    'emotion.*rating',
    'thought.*record',
    'core.*belief'
  ];
  
  return cbtIndicators.some(pattern => 
    new RegExp(pattern, 'i').test(content)
  );
}

export function MessageContent({ content, role, messageId, className }: MessageContentProps) {
  // Get streaming state from Redux
  const { isStreaming, streamingMessageId } = useSelector((state: RootState) => state.chat);
  const { currentSessionId } = useSelector((state: RootState) => state.sessions);
  
  // State for CBT diagnostic data
  const [cbtReportData, setCbtReportData] = useState<Record<string, unknown> | undefined>(undefined);
  
  // Determine if this specific message is currently streaming
  const isThisMessageStreaming = isStreaming && streamingMessageId === messageId;
  
  // Check if this is a CBT session report message
  const isCBTReport = role === 'assistant' && detectCBTSessionReport(content);
  
  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development' && isCBTReport) {
    logger.secureDevLog('CBT report detected', { component: 'MessageContent', messageId, role });
  }
  
  // Load CBT data for session reports
  useEffect(() => {
    if (isCBTReport) {
      // Load CBT data silently
      
      // Try to fetch session report data (don't require Redux session ID)
      fetch('/api/reports/memory/manage?includeFullContent=true')
        .then(response => response.json())
        .then(data => {
          if (data.success && data.memoryDetails && data.memoryDetails.length > 0) {
            // Find the most recent report (likely the current session)
            let sessionReport = null;
            
            if (currentSessionId) {
              sessionReport = data.memoryDetails.find((report: Record<string, unknown>) => 
                report.sessionId === currentSessionId
              );
            }
            
            if (!sessionReport && data.memoryDetails.length > 0) {
              sessionReport = data.memoryDetails[0]; // Most recent
            }
            
            if (sessionReport?.structuredCBTData) {
              // Transform the summary data to the format needed for table population
              // This will enable the tables to show actual CBT data instead of being empty
              
              // Note: The actual table population logic needs to be implemented
              // in the markdown processor or table components
              setCbtReportData(sessionReport);
            }
          }
        })
        .catch(error => {
          logger.error('Failed to load CBT data for message content', {
            component: 'MessageContent',
            messageId,
            currentSessionId,
            isCBTReport
          }, error);
        });
    }
  }, [isCBTReport, messageId, currentSessionId]);
  
  const bubbleClasses = buildMessageClasses(role, 'bubble');
  const contentClasses = role === 'user' ? 'message-content-user' : 'message-content-assistant';
  
  return (
    <div className={cn(bubbleClasses, contentClasses, 'therapeutic-content', className)}>
      <StreamingTableBuffer
        content={content}
        isStreaming={isThisMessageStreaming}
        isUser={role === 'user'}
        cbtData={cbtReportData}
      />
    </div>
  );
}