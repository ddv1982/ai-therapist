'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SessionReportViewer } from './session-report-viewer';
import {
  getSessionReportDetail,
  type SessionReportDetail,
  type MemoryDetailInfo,
} from '@/features/chat/lib/memory-utils';
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
  currentSessionId,
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
        isOpen: open,
      });
      return;
    }

    logger.therapeuticOperation('Starting to load session report detail', {
      component: 'SessionReportDetailModal',
      operation: 'loadReportDetail',
      reportId: reportInfo.id,
      sessionId: currentSessionId || 'unknown',
      hasReportInfo: !!reportInfo,
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
        detailSize: detail ? JSON.stringify(detail).length : 0,
      });

      if (detail) {
        setReportDetail(detail);
        logger.therapeuticOperation('Session report detail set successfully', {
          component: 'SessionReportDetailModal',
          operation: 'loadReportDetail',
          reportId: reportInfo.id,
        });
      } else {
        logger.warn('No session report detail returned from API', {
          component: 'SessionReportDetailModal',
          operation: 'loadReportDetail',
          reportId: reportInfo.id,
          sessionId: currentSessionId,
        });
        setError(
          'Unable to load full session report content. The report may be encrypted or unavailable.'
        );
      }
    } catch (error) {
      logger.error(
        'Failed to load session report detail',
        {
          component: 'SessionReportDetailModal',
          operation: 'loadReportDetail',
          reportId: reportInfo?.id,
          sessionId: currentSessionId || 'unknown',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      setError('Failed to load session report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [reportInfo, open, currentSessionId]);

  useEffect(() => {
    if (open && reportInfo) {
      void loadReportDetail();
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
    void loadReportDetail();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border flex max-h-[85vh] max-w-5xl flex-col overflow-hidden border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3 text-xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="hover:bg-muted/50 h-8 w-8 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {reportInfo?.sessionTitle || 'Session Report Detail'}
          </DialogTitle>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="spacing-lg flex min-h-96 flex-col items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading full session report...</p>
            </div>
          ) : error ? (
            <div className="spacing-lg flex min-h-96 flex-col items-center justify-center">
              <AlertCircle className="text-destructive mb-4 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-xl font-semibold">Unable to Load Content</h3>
              <p className="text-muted-foreground mb-4 max-w-md text-center text-sm">{error}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Back to List
                </Button>
                <Button onClick={handleRetry}>Try Again</Button>
              </div>
            </div>
          ) : reportDetail ? (
            <SessionReportViewer reportDetail={reportDetail} className="spacing-sm" />
          ) : (
            <div className="spacing-lg flex min-h-96 flex-col items-center justify-center">
              <AlertCircle className="text-muted-foreground/50 mb-4 h-12 w-12" />
              <p className="text-muted-foreground text-sm">No session report selected</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-border/30 border-t">
          <Button variant="outline" onClick={handleClose} className="h-10 text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
