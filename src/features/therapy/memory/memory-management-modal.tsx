'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Trash2,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle,
  Loader2,
  Brain,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  getMemoryManagementData,
  deleteMemory,
  refreshMemoryContext,
  type MemoryDetailInfo,
  type MemoryManagementResponse,
  type MemoryContextInfo,
} from '@/features/chat/lib/memory-utils';
import { logger } from '@/lib/utils/logger';
import { SessionReportDetailModal } from './session-report-detail-modal';
import { useTranslations } from 'next-intl';

interface MemoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSessionId?: string;
  onMemoryUpdated: (newMemoryContext: MemoryContextInfo) => void;
}

export function MemoryManagementModal({
  open,
  onOpenChange,
  currentSessionId,
  onMemoryUpdated,
}: MemoryManagementModalProps) {
  const { showToast } = useToast();
  const t = useTranslations('toast');
  const [memoryData, setMemoryData] = useState<MemoryManagementResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [confirmationState, setConfirmationState] = useState<{
    isActive: boolean;
    type: string;
    affectedCount: number;
    onConfirm: () => void;
  }>({
    isActive: false,
    type: '',
    affectedCount: 0,
    onConfirm: () => {},
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MemoryDetailInfo | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadMemoryData = useCallback(async () => {
    if (!open) return;

    setIsLoading(true);
    try {
      const data = await getMemoryManagementData(currentSessionId);
      setMemoryData(data);
    } catch (error) {
      logger.error(
        'Failed to load memory management data',
        {
          component: 'MemoryManagementModal',
          operation: 'loadMemoryData',
          currentSessionId,
        },
        error as Error
      );
      showToast({
        title: t('memoryLoadErrorTitle'),
        message: t('memoryLoadErrorBody'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [open, currentSessionId, showToast, t]);

  useEffect(() => {
    void loadMemoryData();
  }, [loadMemoryData]);

  const handleDeleteMemory = async (
    type: 'all' | 'recent' | 'specific' | 'all-except-current',
    options?: { limit?: number }
  ) => {
    setIsDeleting(true);

    try {
      let deleteOptions: {
        type: 'all' | 'recent' | 'specific' | 'all-except-current';
        sessionId?: string;
        sessionIds?: string[];
        limit?: number;
      };

      switch (type) {
        case 'all':
          deleteOptions = { type: 'all' };
          break;
        case 'all-except-current':
          deleteOptions = { type: 'all-except-current', sessionId: currentSessionId };
          break;
        case 'recent':
          deleteOptions = {
            type: 'recent',
            limit: options?.limit || 3,
            sessionId: currentSessionId,
          };
          break;
        case 'specific':
          deleteOptions = { type: 'specific', sessionIds: Array.from(selectedReports) };
          break;
        default:
          throw new Error(`Unknown deletion type: ${type}`);
      }

      const result = await deleteMemory(deleteOptions);

      if (result.success) {
        // Close the modal first
        onOpenChange(false);

        // Show success toast after modal closes
        showToast({
          title: t('memoryDeleteSuccessTitle'),
          message: result.message ?? t('memoryDeleteSuccessBody'),
          type: 'success',
        });

        // Refresh memory context for main app
        const newMemoryContext = await refreshMemoryContext(currentSessionId);
        onMemoryUpdated(newMemoryContext);

        // Reset internal state for next time modal opens
        setSelectedReports(new Set());
        setMemoryData(null);
      } else {
        showToast({
          title: t('memoryDeleteFailedTitle'),
          message: result.message ?? t('memoryDeleteFailedBody'),
          type: 'error',
        });
      }
    } catch (error) {
      logger.error(
        'Memory deletion failed',
        {
          component: 'MemoryManagementModal',
          operation: 'handleDeleteMemory',
          type,
          currentSessionId,
          selectedCount: selectedReports.size,
        },
        error as Error
      );
      showToast({
        title: t('memoryDeleteErrorTitle'),
        message: t('memoryDeleteErrorBody'),
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setConfirmationState({ isActive: false, type: '', affectedCount: 0, onConfirm: () => {} });
    }
  };

  const showConfirmation = (type: string, affectedCount: number, onConfirm: () => void) => {
    setConfirmationState({
      isActive: true,
      type,
      affectedCount,
      onConfirm,
    });
  };

  const cancelConfirmation = () => {
    setConfirmationState({ isActive: false, type: '', affectedCount: 0, onConfirm: () => {} });
  };

  const getConfirmationMessage = () => {
    switch (confirmationState.type) {
      case 'all':
        return `This will permanently delete all ${confirmationState.affectedCount} session reports and clear your therapeutic memory completely.`;
      case 'all-except-current':
        return `This will permanently delete ${confirmationState.affectedCount} session reports, keeping only your current session.`;
      case 'recent':
        return `This will permanently delete the ${confirmationState.affectedCount} most recent session reports.`;
      case 'specific':
        return `This will permanently delete ${confirmationState.affectedCount} selected session reports.`;
      default:
        return `This will permanently delete ${confirmationState.affectedCount} session reports.`;
    }
  };

  const toggleReportSelection = (
    reportId: string,
    event?: React.MouseEvent | React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event) {
      event.stopPropagation();
    }

    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const handleReportClick = (report: MemoryDetailInfo) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
  };

  const formatReportSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasMemory = memoryData?.stats?.hasMemory;
  const reportCount = memoryData?.reportCount || 0;
  const selectedCount = selectedReports.size;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border flex h-[85vh] max-w-5xl flex-col overflow-hidden border">
          <DialogHeader>
            <DialogTitle
              className="text-foreground flex items-center gap-2 text-xl"
              title="Therapeutic Memory Management"
            >
              <Brain className="text-primary h-5 w-5" />
              Therapeutic Memory Management
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Manage your therapeutic session memory to control AI context and insights.
              {hasMemory && ` Currently storing ${reportCount} session reports.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-hidden">
            {confirmationState.isActive ? (
              <div className="flex h-full items-center justify-center">
                <div className="bg-destructive/5 border-destructive/20 spacing-md w-full max-w-2xl rounded-lg border">
                  <div className="mb-4 flex items-center gap-3">
                    <AlertTriangle className="text-destructive h-6 w-6" />
                    <h3 className="text-foreground text-xl font-semibold">
                      Confirm Memory Deletion
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {getConfirmationMessage()}
                    </p>

                    <div className="bg-destructive/10 border-destructive/20 spacing-sm rounded-lg border">
                      <p className="text-destructive text-sm font-semibold">
                        ⚠️ This action cannot be undone. Your therapeutic insights and session
                        continuity will be lost.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={cancelConfirmation}
                      disabled={isDeleting}
                      className="h-10 flex-1 text-sm"
                    >
                      No, Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        confirmationState.onConfirm();
                        // Modal will close automatically after successful deletion
                      }}
                      disabled={isDeleting}
                      className="h-10 flex-1 text-sm"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Yes, Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Loader2 className="text-primary mx-auto mb-2 h-6 w-6 animate-spin" />
                  <span className="text-muted-foreground text-sm">Loading memory data...</span>
                </div>
              </div>
            ) : !hasMemory ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Brain className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
                  <h3 className="text-foreground mb-2 text-xl font-semibold">No Memory Data</h3>
                  <p className="text-muted-foreground text-sm">
                    You don&apos;t have any therapeutic session reports stored yet. Generate session
                    reports to build therapeutic memory.
                  </p>
                </div>
              </div>
            ) : (
              <div className="custom-scrollbar h-full space-y-4 overflow-y-auto pr-2">
                {/* Quick Actions */}
                <div className="spacing-sm">
                  <h4 className="text-foreground mb-3 text-sm font-semibold">Quick Actions</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        showConfirmation('all-except-current', reportCount, () =>
                          handleDeleteMemory('all-except-current')
                        )
                      }
                      className="h-10 text-sm"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All Memory
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        showConfirmation('recent', Math.min(reportCount, 3), () =>
                          handleDeleteMemory('recent', { limit: 3 })
                        )
                      }
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 h-10 text-sm"
                    >
                      Clear Recent (3)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMemoryData}
                      disabled={isLoading}
                      className="h-10 text-sm"
                    >
                      <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Selected Actions */}
                {selectedCount > 0 && (
                  <div className="bg-primary/5 border-primary/20 spacing-sm rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-sm font-semibold">
                        {selectedCount} report{selectedCount > 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          showConfirmation('specific', selectedCount, () =>
                            handleDeleteMemory('specific')
                          )
                        }
                        className="h-8 text-sm"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}

                {/* Session Reports List */}
                <div className="spacing-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-foreground text-sm font-semibold">
                      Session Reports
                      {reportCount > 0 && (
                        <span className="text-muted-foreground ml-2 font-normal">
                          ({reportCount} total)
                        </span>
                      )}
                    </h4>
                    {selectedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-sm font-semibold">
                          {selectedCount} selected
                        </span>
                        <button
                          onClick={() => setSelectedReports(new Set())}
                          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                          title="Clear selection"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  {reportCount > 0 && selectedCount === 0 && (
                    <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                      Select reports using the checkboxes to delete multiple at once, or click the
                      eye icon to view details.
                    </p>
                  )}
                  <div className="space-y-2">
                    {memoryData?.memoryDetails?.map((report: MemoryDetailInfo) => (
                      <Card
                        key={report.id}
                        className={cn(
                          'bg-card border-border relative transition-all duration-200',
                          selectedReports.has(report.sessionId) &&
                            'bg-primary/5 border-primary/30 ring-primary/20 ring-1'
                        )}
                      >
                        <div className="spacing-sm flex items-start gap-4">
                          {/* Enhanced Checkbox Section */}
                          <div className="flex-shrink-0 pt-1">
                            <label className="hover:bg-muted/30 focus-within:bg-muted/20 -m-3 inline-flex cursor-pointer rounded-lg p-3 transition-all duration-200">
                              <input
                                type="checkbox"
                                checked={selectedReports.has(report.sessionId)}
                                onChange={(e) => toggleReportSelection(report.sessionId, e)}
                                className={cn(
                                  'bg-background h-5 w-5 rounded border-2 transition-all duration-200',
                                  'hover:border-primary/50 focus:ring-primary/30 focus:ring-2 focus:ring-offset-2 focus:outline-none',
                                  'checked:bg-primary checked:border-primary checked:hover:bg-primary/90',
                                  'disabled:cursor-not-allowed disabled:opacity-50',
                                  selectedReports.has(report.sessionId)
                                    ? 'border-primary shadow-sm'
                                    : 'border-border hover:border-primary/30'
                                )}
                                aria-label={`Select ${report.sessionTitle}`}
                                tabIndex={0}
                              />
                              <span className="sr-only">Select this session report</span>
                            </label>
                          </div>

                          {/* Content Section */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center justify-between">
                              <h5 className="text-foreground truncate text-sm font-semibold">
                                {report.sessionTitle}
                              </h5>
                              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {report.reportDate}
                              </div>
                            </div>

                            <p className="text-muted-foreground mb-3 line-clamp-2 text-sm leading-relaxed">
                              {report.contentPreview}
                            </p>

                            {report.keyInsights.length > 0 && (
                              <div className="mb-3">
                                <p className="text-foreground mb-2 text-sm font-semibold">
                                  Key Insights:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {report.keyInsights.slice(0, 3).map((insight, index) => (
                                    <span
                                      key={index}
                                      className="bg-primary/10 text-primary border-primary/20 rounded border px-2 py-1 text-sm"
                                    >
                                      {insight.length > 30
                                        ? insight.substring(0, 30) + '...'
                                        : insight}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-muted-foreground flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {formatReportSize(report.reportSize)}
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {report.hasEncryptedContent ? 'Encrypted' : 'Accessible'}
                              </div>
                            </div>
                          </div>

                          {/* Dedicated Actions Section */}
                          <div className="flex flex-shrink-0 items-start pt-1">
                            <button
                              onClick={() => handleReportClick(report)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleReportClick(report);
                                }
                              }}
                              className="group hover:border-primary/30 hover:bg-primary/5 focus:ring-primary/30 rounded-lg border border-transparent p-3 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                              aria-label={`View details for ${report.sessionTitle}`}
                              title="View session details"
                              tabIndex={0}
                            >
                              <Eye className="text-muted-foreground group-hover:text-primary group-focus:text-primary h-5 w-5 transition-colors" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-border/30 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 min-w-20 text-sm"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Report Detail Modal */}
      <SessionReportDetailModal
        open={showDetailModal}
        onOpenChange={handleDetailModalClose}
        reportInfo={selectedReport}
        currentSessionId={currentSessionId}
      />
    </>
  );
}
