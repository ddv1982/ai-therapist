'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SessionReportViewer } from './session-report-viewer';
import { 
  getSessionReportDetail, 
  type SessionReportDetail, 
  type MemoryDetailInfo 
} from '@/lib/chat/memory-utils';
import { logger } from '@/lib/utils/logger';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface SessionReportDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportInfo: MemoryDetailInfo | null;
  currentSessionId?: string;
}

export function SessionReportDetailModal({ 
  open, 
  onOpenChange, 
  reportInfo,
  currentSessionId 
}: SessionReportDetailModalProps) {
  const [reportDetail, setReportDetail] = useState<SessionReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReportDetail = useCallback(async () => {
    if (!reportInfo || !open) {
      logger.therapeuticOperation('Session report detail not loading', {
        component: 'SessionReportDetailModal',
        operation: 'loadReportDetail',
        hasReportInfo: !!reportInfo,
        isOpen: open
      });
      return;
    }
    
    logger.therapeuticOperation('Starting to load session report detail', {
      component: 'SessionReportDetailModal',
      operation: 'loadReportDetail',
      reportId: reportInfo.id,
      sessionId: currentSessionId || 'unknown',
      hasReportInfo: !!reportInfo
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      const detail = await getSessionReportDetail(reportInfo.id, currentSessionId);
      
      logger.therapeuticOperation('Received session report detail', {
        component: 'SessionReportDetailModal',
        operation: 'loadReportDetail',
        reportId: reportInfo.id,
        hasDetail: !!detail,
        detailKeysCount: detail ? Object.keys(detail).length : 0,
        hasStructuredCBTData: !!(detail as unknown as Record<string, unknown>)?.structuredCBTData,
        detailSize: detail ? JSON.stringify(detail).length : 0
      });
      
      if (detail) {
        setReportDetail(detail);
        logger.therapeuticOperation('Session report detail set successfully', {
          component: 'SessionReportDetailModal',
          operation: 'loadReportDetail',
          reportId: reportInfo.id
        });
      } else {
        logger.warn('No session report detail returned from API', {
          component: 'SessionReportDetailModal',
          operation: 'loadReportDetail',
          reportId: reportInfo.id,
          sessionId: currentSessionId
        });
        setError('Unable to load full session report content. The report may be encrypted or unavailable.');
      }
    } catch (error) {
      logger.error('Failed to load session report detail', {
        component: 'SessionReportDetailModal',
        operation: 'loadReportDetail',
        reportId: reportInfo?.id,
        sessionId: currentSessionId || 'unknown'
      }, error instanceof Error ? error : new Error(String(error)));
      setError('Failed to load session report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [reportInfo, open, currentSessionId]);

  useEffect(() => {
    if (open && reportInfo) {
      loadReportDetail();
    } else {
      // Reset state when modal closes
      setReportDetail(null);
      setError(null);
    }
  }, [open, reportInfo, loadReportDetail]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleRetry = () => {
    loadReportDetail();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl text-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 h-8 w-8 hover:bg-muted/50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {reportInfo?.sessionTitle || 'Session Report Detail'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center spacing-lg min-h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading full session report...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center spacing-lg min-h-96">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Unable to Load Content
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                {error}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Back to List
                </Button>
                <Button onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : reportDetail ? (
            <SessionReportViewer 
              reportDetail={reportDetail}
              className="spacing-sm"
            />
          ) : (
            <div className="flex flex-col items-center justify-center spacing-lg min-h-96">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No session report selected
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/30">
          <Button variant="outline" onClick={handleClose} className="text-sm h-10">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}