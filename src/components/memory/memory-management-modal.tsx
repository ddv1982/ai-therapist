'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';
import { Card } from '@/components/ui/primitives/card';
import { 
  Trash2, 
  AlertTriangle, 
  Calendar,
  FileText,
  CheckCircle,
  Loader2,
  Brain,
  RefreshCw,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useToast } from '@/components/ui/primitives/toast';
import { 
  getMemoryManagementData, 
  deleteMemory, 
  refreshMemoryContext,
  type MemoryDetailInfo,
  type MemoryManagementResponse,
  type MemoryContextInfo
} from '@/lib/chat/memory-utils';
import { SessionReportDetailModal } from './session-report-detail-modal';

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
  onMemoryUpdated 
}: MemoryManagementModalProps) {
  const { showToast } = useToast();
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
    onConfirm: () => {}
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
      console.error('Failed to load memory data:', error);
      showToast({
        title: 'Error',
        message: 'Failed to load memory data',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [open, currentSessionId, showToast]);

  useEffect(() => {
    loadMemoryData();
  }, [loadMemoryData]);

  const handleDeleteMemory = async (type: 'all' | 'recent' | 'specific' | 'all-except-current', options?: { limit?: number }) => {
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
          deleteOptions = { type: 'recent', limit: options?.limit || 3, sessionId: currentSessionId };
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
          title: 'Memory Deleted',
          message: result.message,
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
          title: 'Deletion Failed',
          message: result.message,
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Memory deletion error:', error);
      showToast({
        title: 'Error',
        message: 'Failed to delete memory',
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
      onConfirm
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

  const toggleReportSelection = (reportId: string, event?: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
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
        <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-therapy-lg text-foreground">
              <Brain className="w-5 h-5 text-primary" />
              Therapeutic Memory Management
            </DialogTitle>
            <DialogDescription className="text-therapy-sm text-muted-foreground">
              Manage your therapeutic session memory to control AI context and insights.
              {hasMemory && ` Currently storing ${reportCount} session reports.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden space-y-4">
            {confirmationState.isActive ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg spacing-md max-w-2xl w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                    <h3 className="text-therapy-lg font-semibold text-foreground">Confirm Memory Deletion</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-therapy-sm text-muted-foreground leading-relaxed">
                      {getConfirmationMessage()}
                    </p>
                    
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg spacing-sm">
                      <p className="text-therapy-sm text-destructive font-medium">
                        ⚠️ This action cannot be undone. Your therapeutic insights and session continuity will be lost.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={cancelConfirmation}
                      disabled={isDeleting}
                      className="flex-1 text-therapy-sm h-10"
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
                      className="flex-1 text-therapy-sm h-10"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Yes, Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <span className="text-therapy-sm text-muted-foreground">Loading memory data...</span>
                </div>
              </div>
            ) : !hasMemory ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-therapy-lg font-semibold mb-2 text-foreground">No Memory Data</h3>
                  <p className="text-therapy-sm text-muted-foreground">
                    You don&apos;t have any therapeutic session reports stored yet. 
                    Generate session reports to build therapeutic memory.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {/* Quick Actions */}
                <div className="spacing-sm">
                  <h4 className="text-therapy-sm font-semibold text-foreground mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => showConfirmation('all-except-current', reportCount, () => handleDeleteMemory('all-except-current'))}
                      className="text-therapy-sm h-10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Memory
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showConfirmation('recent', Math.min(reportCount, 3), () => handleDeleteMemory('recent', { limit: 3 }))}
                      className="text-therapy-sm h-10 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      Clear Recent (3)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMemoryData}
                      disabled={isLoading}
                      className="text-therapy-sm h-10"
                    >
                      <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Selected Actions */}
                {selectedCount > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg spacing-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-therapy-sm font-medium text-foreground">
                        {selectedCount} report{selectedCount > 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => showConfirmation('specific', selectedCount, () => handleDeleteMemory('specific'))}
                        className="text-therapy-sm h-8"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}

                {/* Session Reports List */}
                <div className="spacing-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-therapy-sm font-semibold text-foreground">
                      Session Reports
                      {reportCount > 0 && (
                        <span className="ml-2 text-muted-foreground font-normal">
                          ({reportCount} total)
                        </span>
                      )}
                    </h4>
                    {selectedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-therapy-sm text-primary font-medium">
                          {selectedCount} selected
                        </span>
                        <button
                          onClick={() => setSelectedReports(new Set())}
                          className="text-therapy-sm text-muted-foreground hover:text-foreground transition-colors"
                          title="Clear selection"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  {reportCount > 0 && selectedCount === 0 && (
                    <p className="text-therapy-sm text-muted-foreground mb-3 leading-relaxed">
                      Select reports using the checkboxes to delete multiple at once, or click the eye icon to view details.
                    </p>
                  )}
                  <div className="space-y-2">
                    {memoryData?.memoryDetails?.map((report: MemoryDetailInfo) => (
                      <Card 
                        key={report.id} 
                        className={cn(
                          "bg-card border-border transition-all duration-200 relative",
                          selectedReports.has(report.sessionId) && "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                        )}
                      >
                        <div className="flex items-start gap-4 spacing-sm">
                          {/* Enhanced Checkbox Section */}
                          <div className="flex-shrink-0 pt-1">
                            <label className="cursor-pointer inline-flex p-3 -m-3 rounded-lg hover:bg-muted/30 transition-all duration-200 focus-within:bg-muted/20">
                              <input
                                type="checkbox"
                                checked={selectedReports.has(report.sessionId)}
                                onChange={(e) => toggleReportSelection(report.sessionId, e)}
                                className={cn(
                                  "w-5 h-5 rounded border-2 bg-background transition-all duration-200",
                                  "hover:border-primary/50 focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:outline-none",
                                  "checked:bg-primary checked:border-primary checked:hover:bg-primary/90",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  selectedReports.has(report.sessionId) 
                                    ? "border-primary shadow-sm" 
                                    : "border-border hover:border-primary/30"
                                )}
                                aria-label={`Select ${report.sessionTitle}`}
                                tabIndex={0}
                              />
                              <span className="sr-only">Select this session report</span>
                            </label>
                          </div>
                          
                          {/* Content Section */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-therapy-sm font-medium truncate text-foreground">{report.sessionTitle}</h5>
                              <div className="flex items-center gap-1 text-therapy-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {report.reportDate}
                              </div>
                            </div>
                            
                            <p className="text-therapy-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                              {report.contentPreview}
                            </p>
                            
                            {report.keyInsights.length > 0 && (
                              <div className="mb-3">
                                <p className="text-therapy-sm font-medium text-foreground mb-2">Key Insights:</p>
                                <div className="flex flex-wrap gap-1">
                                  {report.keyInsights.slice(0, 3).map((insight, index) => (
                                    <span key={index} className="text-therapy-sm bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                                      {insight.length > 30 ? insight.substring(0, 30) + '...' : insight}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-therapy-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {formatReportSize(report.reportSize)}
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {report.hasEncryptedContent ? 'Encrypted' : 'Accessible'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Dedicated Actions Section */}
                          <div className="flex-shrink-0 flex items-start pt-1">
                            <button
                              onClick={() => handleReportClick(report)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleReportClick(report);
                                }
                              }}
                              className="group p-3 rounded-lg border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
                              aria-label={`View details for ${report.sessionTitle}`}
                              title="View session details"
                              tabIndex={0}
                            >
                              <Eye className="w-5 h-5 text-muted-foreground group-hover:text-primary group-focus:text-primary transition-colors" />
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

          <DialogFooter className="border-t border-border/30">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="text-therapy-sm h-10 min-w-20"
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