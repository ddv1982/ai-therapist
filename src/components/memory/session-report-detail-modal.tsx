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
} from '@/lib/memory-utils';
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
    if (!reportInfo || !open) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const detail = await getSessionReportDetail(reportInfo.id, currentSessionId);
      
      if (detail) {
        setReportDetail(detail);
      } else {
        setError('Unable to load full session report content. The report may be encrypted or unavailable.');
      }
    } catch (error) {
      console.error('Failed to load report detail:', error);
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
          <DialogTitle className="flex items-center gap-3 text-therapy-lg text-foreground">
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
              <p className="text-therapy-sm text-muted-foreground">Loading full session report...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center spacing-lg min-h-96">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <h3 className="text-therapy-lg font-semibold text-foreground mb-2">
                Unable to Load Content
              </h3>
              <p className="text-therapy-sm text-muted-foreground text-center max-w-md mb-4">
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
              <p className="text-therapy-sm text-muted-foreground">
                No session report selected
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/30">
          <Button variant="outline" onClick={handleClose} className="text-therapy-sm h-10">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}