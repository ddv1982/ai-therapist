/**
 * Utilities for managing therapeutic memory context
 */

import { logger } from '@/lib/utils/logger';

export interface MemoryContextInfo {
  hasMemory: boolean;
  reportCount: number;
  lastReportDate?: string;
}

export interface MemoryDetailInfo {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  contentPreview: string;
  keyInsights: string[];
  hasEncryptedContent: boolean;
  reportSize: number;
  fullContent?: string; // Optional full content for detail view
  structuredCBTData?: unknown; // Optional structured CBT data from therapeutic insights
}

export interface SessionReportDetail {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  fullContent: string;
  keyInsights: string[];
  reportSize: number;
  structuredCBTData?: unknown; // Add structured CBT data from therapeutic insights
}

export interface MemoryManagementResponse {
  success: boolean;
  memoryDetails: MemoryDetailInfo[];
  reportCount: number;
  stats: {
    totalReportsFound: number;
    successfullyProcessed: number;
    failedDecryptions: number;
    hasMemory: boolean;
  };
}

export interface MemoryDeletionResponse {
  success: boolean;
  deletedCount: number;
  message: string;
  deletionType: 'specific' | 'recent' | 'all-except-current' | 'all';
}

/**
 * Check if memory context is available for a session
 */
export async function checkMemoryContext(sessionId?: string): Promise<MemoryContextInfo> {
  if (!sessionId) {
    return { hasMemory: false, reportCount: 0 };
  }
  
  try {
    const response = await fetch(`/api/reports/memory?excludeSessionId=${sessionId}&limit=3`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.memoryContext && data.memoryContext.length > 0) {
        const sortedMemory = data.memoryContext.sort((a: { reportDate: string }, b: { reportDate: string }) => 
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
        );
        
        return {
          hasMemory: true,
          reportCount: data.memoryContext.length,
          lastReportDate: sortedMemory[0]?.reportDate
        };
      }
    }
  } catch (error) {
    logger.warn('Failed to check memory context', {
      operation: 'checkMemoryContext',
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: sessionId ? '[FILTERED_SESSION_ID]' : 'none'
    });
  }
  
  return { hasMemory: false, reportCount: 0 };
}

/**
 * Format memory context info for display
 */
export function formatMemoryInfo(memoryInfo: MemoryContextInfo): string {
  if (!memoryInfo.hasMemory) {
    return '';
  }
  
  const count = memoryInfo.reportCount;
  const lastDate = memoryInfo.lastReportDate;
  
  if (count === 1) {
    return `Using insights from 1 previous session${lastDate ? ` (${lastDate})` : ''}`;
  } else {
    return `Using insights from ${count} previous sessions${lastDate ? ` (latest: ${lastDate})` : ''}`;
  }
}

/**
 * Get detailed memory information for management
 */
export async function getMemoryManagementData(sessionId?: string): Promise<MemoryManagementResponse> {
  const excludeParam = sessionId ? `?excludeSessionId=${sessionId}` : '';
  
  try {
    const response = await fetch(`/api/reports/memory/manage${excludeParam}`);
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      logger.error('Failed to fetch memory management data', {
        operation: 'getMemoryManagementData',
        status: response.status,
        sessionId: sessionId ? '[FILTERED_SESSION_ID]' : 'none'
      });
      return {
        success: false,
        memoryDetails: [],
        reportCount: 0,
        stats: {
          totalReportsFound: 0,
          successfullyProcessed: 0,
          failedDecryptions: 0,
          hasMemory: false
        }
      };
    }
  } catch (error) {
    logger.error('Error fetching memory management data', {
      operation: 'getMemoryManagementData',
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: sessionId ? '[FILTERED_SESSION_ID]' : 'none'
    });
    return {
      success: false,
      memoryDetails: [],
      reportCount: 0,
      stats: {
        totalReportsFound: 0,
        successfullyProcessed: 0,
        failedDecryptions: 0,
        hasMemory: false
      }
    };
  }
}

/**
 * Delete memory with various options
 */
export async function deleteMemory(options: {
  type: 'all' | 'recent' | 'specific' | 'all-except-current';
  sessionId?: string;
  sessionIds?: string[];
  limit?: number;
}): Promise<MemoryDeletionResponse> {
  try {
    const params = new URLSearchParams();
    
    if (options.type === 'all-except-current' && options.sessionId) {
      params.set('excludeSessionId', options.sessionId);
    } else if (options.type === 'recent' && options.limit) {
      params.set('limit', options.limit.toString());
      if (options.sessionId) {
        params.set('excludeSessionId', options.sessionId);
      }
    } else if (options.type === 'specific' && options.sessionIds) {
      params.set('sessionIds', options.sessionIds.join(','));
    }
    
    const url = `/api/reports/memory?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Failed to delete memory', {
        operation: 'deleteMemory',
        status: response.status,
        deletionType: options.type,
        error: errorData.error || 'Unknown error'
      });
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to delete memory: ${errorData.error || 'Unknown error'}`,
        deletionType: options.type
      };
    }
  } catch (error) {
    logger.error('Error deleting memory', {
      operation: 'deleteMemory',
      deletionType: options.type,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      success: false,
      deletedCount: 0,
      message: `Error deleting memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      deletionType: options.type
    };
  }
}

/**
 * Get full content for a specific session report
 */
export async function getSessionReportDetail(reportId: string, sessionId?: string): Promise<SessionReportDetail | null> {
  const excludeParam = sessionId ? `?excludeSessionId=${sessionId}&includeFullContent=true` : '?includeFullContent=true';
  
  logger.reportOperation('Session report API call initiated', reportId, {
    sessionId: '[FILTERED_SESSION_ID]',
    hasReportId: !!reportId ? 'true' : 'false',
    hasExcludeParam: !!excludeParam ? 'true' : 'false'
  });
  
  try {
    const response = await fetch(`/api/reports/memory/manage${excludeParam}`);
    
    logger.reportOperation('Session report API response received', reportId, { status: response.status });
    
    if (response.ok) {
      const data = await response.json();
      logger.reportOperation('Session report data processed', reportId, {
        success: data.success ? 'true' : 'false',
        memoryDetailsCount: data.memoryDetails?.length || 0,
        hasMemoryDetails: !!data.memoryDetails ? 'true' : 'false'
      });
      
      if (data.success && data.memoryDetails) {
        // Find the specific report
        const report = data.memoryDetails.find((r: MemoryDetailInfo) => r.id === reportId);
        logger.reportOperation('Session report located', reportId, {
          reportFound: !!report ? 'true' : 'false',
          hasFullContent: !!(report as MemoryDetailInfo)?.fullContent ? 'true' : 'false',
          hasStructuredCBTData: !!(report as MemoryDetailInfo)?.structuredCBTData ? 'true' : 'false',
          reportKeyCount: report ? Object.keys(report).length : 0
        });
        
        if (report && report.fullContent) {
          const result: SessionReportDetail = {
            id: report.id,
            sessionId: report.sessionId,
            sessionTitle: report.sessionTitle,
            sessionDate: report.sessionDate,
            reportDate: report.reportDate,
            fullContent: report.fullContent,
            keyInsights: report.keyInsights,
            reportSize: report.reportSize,
            structuredCBTData: (report as MemoryDetailInfo).structuredCBTData // CRITICAL: Include structured CBT data
          };
          
          logger.reportOperation('Session report detail prepared for return', reportId, {
            hasStructuredCBTData: !!result.structuredCBTData ? 'true' : 'false',
            structuredCBTDataType: typeof result.structuredCBTData,
            structuredCBTDataKeyCount: result.structuredCBTData && typeof result.structuredCBTData === 'object' 
              ? Object.keys(result.structuredCBTData as Record<string, unknown>).length
              : 0
          });
          
          return result;
        } else {
          logger.warn('Session report found but missing fullContent', {
            operation: 'getSessionReportDetail',
            reportId: '[FILTERED_REPORT_ID]',
            hasReport: !!report,
            hasFullContent: !!(report as MemoryDetailInfo)?.fullContent
          });
        }
      } else {
        logger.warn('Session report API response unsuccessful or no memoryDetails', {
          operation: 'getSessionReportDetail',
          success: data.success,
          hasMemoryDetails: !!data.memoryDetails
        });
      }
    } else {
      logger.error('Session report API response not ok', {
        operation: 'getSessionReportDetail',
        status: response.status,
        statusText: response.statusText
      });
    }
  } catch (error) {
    logger.error('Error fetching session report detail', {
      operation: 'getSessionReportDetail',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  return null;
}

/**
 * Refresh memory context after deletion
 */
export async function refreshMemoryContext(sessionId?: string): Promise<MemoryContextInfo> {
  // Small delay to ensure database consistency
  await new Promise(resolve => setTimeout(resolve, 100));
  return checkMemoryContext(sessionId);
}